const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { registerLimiter, generalLimiter } = require('./middleware/rateLimiter');
const { validateRegistration } = require('./utils/validation');
const { 
  isEmailRegistered, 
  saveRegistration, 
  getRegistrationStats,
  logError, 
  logRegistration 
} = require('./utils/database');
const { sendConfirmationEmail, sendNotificationEmail } = require('./utils/emailService');
const moment = require('moment');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: [
    'https://online-astronomy-competition.web.app',
    'https://online-astronomy-competition.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use('/api/', generalLimiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Online Astronomy Competition API',
    version: '1.0.0',
    status: 'active',
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    endpoints: {
      register: 'POST /api/register',
      health: 'GET /api/health',
      stats: 'GET /api/stats'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: !!process.env.EMAIL_USER
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getRegistrationStats();
    res.json(stats);
  } catch (error) {
    logError(error, 'GET /api/stats');
    res.status(500).json({ 
      error: 'Failed to retrieve statistics',
      message: 'An error occurred while retrieving registration statistics.'
    });
  }
});

app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const registrationData = validation.data;

    // Check if email is already registered
    const isRegistered = await isEmailRegistered(registrationData.email);
    if (isRegistered) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'This email address is already registered for the competition.'
      });
    }

    // Save registration
    const savedRegistration = await saveRegistration(registrationData);
    
    // Log registration
    logRegistration(savedRegistration);

    // Send confirmation email
    let emailSent = false;
    let emailError = null;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await sendConfirmationEmail(savedRegistration);
        emailSent = true;
        
        // Send notification email to admin (non-blocking)
        sendNotificationEmail(savedRegistration).catch(err => {
          console.log('Admin notification failed:', err.message);
        });
      } catch (error) {
        emailError = error;
        logError(error, 'Email sending failed');
      }
    }

    // Return response
    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Registration successful! Check your email for confirmation.',
        registrationId: savedRegistration.id
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Registration successful! However, there was an issue sending the confirmation email. Please contact us if you don\'t receive it.',
        registrationId: savedRegistration.id,
        emailWarning: true,
        emailError: emailError ? emailError.message : 'Email service not configured'
      });
    }

  } catch (error) {
    logError(error, 'POST /api/register');
    res.status(500).json({
      error: 'Registration failed',
      message: 'An internal server error occurred. Please try again later.'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logError(err, `${req.method} ${req.path}`);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist.',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/stats',
      'POST /api/register'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 OAC Backend server running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 CORS origins: ${corsOptions.origin.join(', ')}`);
  console.log(`⚡ Server ready to accept connections`);
});
