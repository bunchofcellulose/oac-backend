const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const REGISTRATIONS_FILE = path.join(__dirname, '..', 'registrations.csv');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Apply rate limiting
app.use('/api/', generalLimiter);

// Validation schema
const registrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  studentEmail: Joi.string().email().trim().lowercase().required(),
  parentEmail: Joi.string().email().trim().lowercase().required(),
  school: Joi.string().trim().min(2).max(200).required(),
  grade: Joi.number().integer().min(9).max(12).required(),
  age: Joi.number().integer().min(13).max(19).required(),
  country: Joi.string().trim().min(2).max(100).required(),
  experience: Joi.string().trim().max(1000).allow('').optional(),
  motivation: Joi.string().trim().max(1000).allow('').optional()
});

// Utility functions
const logError = (error, context = '') => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = `[${timestamp}] ${context}: ${error.message}\n${error.stack}\n---\n`;
  fs.appendFileSync(path.join(LOGS_DIR, 'error.log'), logEntry);
  console.error(`[${timestamp}] ${context}:`, error);
};

const logRegistration = (data) => {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logEntry = `[${timestamp}] Registration: ${data.name} (${data.studentEmail}) from ${data.country}\n`;
  fs.appendFileSync(path.join(LOGS_DIR, 'registration.log'), logEntry);
};

const isEmailRegistered = async (email) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      resolve(false);
      return;
    }

    const emails = [];
    fs.createReadStream(REGISTRATIONS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (row.studentEmail) {
          emails.push(row.studentEmail.toLowerCase());
        }
      })
      .on('end', () => {
        resolve(emails.includes(email.toLowerCase()));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const saveRegistration = async (data) => {
  const registrationData = {
    id: uuidv4(),
    timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    ...data
  };

  const csvWriter = createCsvWriter({
    path: REGISTRATIONS_FILE,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'name', title: 'Name' },
      { id: 'studentEmail', title: 'Student Email' },
      { id: 'parentEmail', title: 'Parent Email' },
      { id: 'school', title: 'School' },
      { id: 'grade', title: 'Grade' },
      { id: 'age', title: 'Age' },
      { id: 'country', title: 'Country' },
      { id: 'experience', title: 'Experience' },
      { id: 'motivation', title: 'Motivation' }
    ],
    append: fs.existsSync(REGISTRATIONS_FILE)
  });

  await csvWriter.writeRecords([registrationData]);
  return registrationData;
};

const sendConfirmationEmail = async (registrationData) => {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const competitionDate = 'August 30, 2025';
  const competitionTime = '12:00 - 23:59 Eastern Standard Time';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2c3e50; text-align: center;">🌟 Welcome to the Online Astronomy Competition! 🌟</h2>
      
      <p>Dear ${registrationData.name},</p>
      
      <p>Congratulations! You have successfully registered for the <strong>Online Astronomy Competition (OAC)</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #495057; margin-top: 0;">📅 Competition Details:</h3>
        <ul style="color: #495057;">
          <li><strong>Date:</strong> ${competitionDate}</li>
          <li><strong>Time:</strong> ${competitionTime}</li>
          <li><strong>Format:</strong> Online Competition</li>
          <li><strong>Duration:</strong> 12-hour window</li>
        </ul>
      </div>
      
      <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #155724; margin-top: 0;">🚀 What's Next?</h3>
        <ol style="color: #155724;">
          <li>Mark your calendar for the competition date</li>
          <li>Review the sample problems on our website</li>
          <li>Prepare using the recommended study topics</li>
          <li>Check your email for competition access details closer to the date</li>
        </ol>
      </div>
      
      <p>We're excited to have you participate in this journey through the cosmos! The OAC brings together passionate astronomy students from around the world to explore the wonders of the universe.</p>
      
      <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:astronomycompetition@gmail.com">astronomycompetition@gmail.com</a>.</p>
      
      <p>Best of luck with your preparation!</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <strong>— The OAC Team</strong><br>
        <em>Inspiring Future Astronomers 🌟</em>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
      <p style="font-size: 12px; color: #6c757d; text-align: center;">
        This email was sent to ${registrationData.studentEmail} because you registered for the Online Astronomy Competition.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"OAC Team" <${process.env.EMAIL_USER}>`,
    to: registrationData.studentEmail,
    cc: registrationData.parentEmail,
    subject: '🌟 OAC Registration Confirmed - Welcome to the Online Astronomy Competition!',
    html: htmlContent,
    text: `Hi ${registrationData.name},

Congratulations! You have successfully registered for the Online Astronomy Competition (OAC).

Competition Details:
- Date: ${competitionDate}
- Time: ${competitionTime}
- Format: Online Competition
- Duration: 12-hour window

What's Next?
1. Mark your calendar for the competition date
2. Review the sample problems on our website
3. Prepare using the recommended study topics
4. Check your email for competition access details closer to the date

We're excited to have you participate in this journey through the cosmos!

If you have any questions, please contact us at astronomycompetition@gmail.com.

Best of luck with your preparation!

— The OAC Team
Inspiring Future Astronomers 🌟`
  };

  await transporter.sendMail(mailOptions);
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Online Astronomy Competition API',
    version: '1.0.0',
    status: 'active',
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
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      return res.json({
        totalRegistrations: 0,
        countries: [],
        grades: {},
        lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
      });
    }

    const registrations = [];
    const countries = new Set();
    const grades = {};

    await new Promise((resolve, reject) => {
      fs.createReadStream(REGISTRATIONS_FILE)
        .pipe(csv())
        .on('data', (row) => {
          registrations.push(row);
          if (row.country) countries.add(row.country);
          if (row.grade) {
            grades[row.grade] = (grades[row.grade] || 0) + 1;
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    res.json({
      totalRegistrations: registrations.length,
      countries: Array.from(countries).sort(),
      grades: grades,
      lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
    });
  } catch (error) {
    logError(error, 'GET /api/stats');
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

app.post('/api/register', registerLimiter, async (req, res) => {
  try {
    // Validate input
    const { error, value } = registrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const registrationData = value;

    // Check if email is already registered
    const isRegistered = await isEmailRegistered(registrationData.studentEmail);
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
    try {
      await sendConfirmationEmail(savedRegistration);
      res.status(200).json({
        success: true,
        message: 'Registration successful! Check your email for confirmation.',
        registrationId: savedRegistration.id
      });
    } catch (emailError) {
      logError(emailError, 'Email sending failed');
      res.status(200).json({
        success: true,
        message: 'Registration successful! However, there was an issue sending the confirmation email. Please contact us if you don\'t receive it.',
        registrationId: savedRegistration.id,
        emailWarning: true
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
  console.log(`📊 Registration file: ${REGISTRATIONS_FILE}`);
});
