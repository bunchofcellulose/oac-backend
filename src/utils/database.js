const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const REGISTRATIONS_FILE = path.join(__dirname, '..', '..', 'registrations.csv');
const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

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
        if (row.studentEmail || row['Student Email']) {
          emails.push((row.studentEmail || row['Student Email']).toLowerCase());
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

const getRegistrationStats = async () => {
  if (!fs.existsSync(REGISTRATIONS_FILE)) {
    return {
      totalRegistrations: 0,
      countries: [],
      grades: {},
      lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  const registrations = [];
  const countries = new Set();
  const grades = {};

  await new Promise((resolve, reject) => {
    fs.createReadStream(REGISTRATIONS_FILE)
      .pipe(csv())
      .on('data', (row) => {
        registrations.push(row);
        const country = row.country || row['Country'];
        const grade = row.grade || row['Grade'];
        
        if (country) countries.add(country);
        if (grade) {
          grades[grade] = (grades[grade] || 0) + 1;
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return {
    totalRegistrations: registrations.length,
    countries: Array.from(countries).sort(),
    grades: grades,
    lastUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
  };
};

module.exports = {
  logError,
  logRegistration,
  isEmailRegistered,
  saveRegistration,
  getRegistrationStats,
  REGISTRATIONS_FILE,
  LOGS_DIR
};
