# Online Astronomy Competition Backend

A robust backend API for the Online Astronomy Competition (OAC) website, designed to handle student registrations, email confirmations, and competition statistics.

## Features

- **Student Registration**: Secure registration with validation
- **Email Confirmation**: Automated HTML email confirmations
- **Rate Limiting**: Protection against spam and abuse
- **Data Validation**: Comprehensive input validation using Joi
- **CSV Data Storage**: Structured data storage with proper CSV handling
- **Statistics API**: Registration statistics for analysis
- **Security**: Helmet.js security headers and CORS configuration
- **Error Handling**: Comprehensive error logging and handling
- **Health Checks**: API health monitoring endpoints

## API Endpoints

### `GET /`
Returns API information and available endpoints.

### `GET /api/health`
Health check endpoint for monitoring service status.

### `GET /api/stats`
Returns registration statistics including:
- Total registrations
- Countries represented
- Grade distribution
- Last updated timestamp

### `POST /api/register`
Student registration endpoint with the following fields:
- `name` (required): Student's full name
- `studentEmail` (required): Student's email address
- `parentEmail` (required): Parent/guardian email address
- `school` (required): School name
- `grade` (required): Grade level (9-12)
- `age` (required): Student's age (13-19)
- `country` (required): Country of residence
- `experience` (optional): Previous astronomy experience
- `motivation` (optional): Motivation for participating

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
NODE_ENV=production
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the application:
```bash
# Development
npm run dev

# Production
npm start
```

## Railway Deployment

This backend is optimized for Railway deployment:

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Set Environment Variables**: Configure the following in Railway dashboard:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password
   - `NODE_ENV`: `production`
3. **Deploy**: Railway will automatically build and deploy your application

### Railway Configuration Files

- `Procfile`: Defines the web process
- `package.json`: Contains build scripts and dependencies
- `.env.example`: Template for environment variables

## Security Features

- **Rate Limiting**: 5 registration attempts per 15 minutes per IP
- **Input Validation**: Comprehensive validation using Joi
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js for security headers
- **Error Handling**: Detailed error logging without exposing internal details

## Data Storage

- **CSV Format**: Registrations stored in structured CSV format
- **Unique IDs**: Each registration gets a unique UUID
- **Timestamps**: All registrations timestamped
- **Logging**: Separate logs for registrations and errors

## Email Features

- **HTML Templates**: Beautiful, responsive email templates
- **Dual Format**: Both HTML and plain text versions
- **CC Parents**: Automatically CC parent/guardian emails
- **Competition Details**: Includes all relevant competition information

## File Structure

```
oac-backend/
├── src/
│   └── index.js          # Main application file
├── logs/                 # Log files (created automatically)
├── package.json          # Dependencies and scripts
├── Procfile             # Railway deployment configuration
├── .env.example         # Environment variables template
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Development

For local development:

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Test registration endpoint
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "studentEmail": "john@example.com",
    "parentEmail": "parent@example.com",
    "school": "Test High School",
    "grade": 11,
    "age": 16,
    "country": "United States"
  }'
```

## Support

For issues or questions:
- Create an issue on the GitHub repository
- Contact: astronomycompetition@gmail.com

## License

MIT License - See LICENSE file for details.

---

**Online Astronomy Competition** - Inspiring Future Astronomers 🌟
