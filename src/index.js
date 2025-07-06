const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const LOG_FILE = './registrations.csv';

app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  const {
    name,
    studentEmail,
    parentEmail,
    school,
    grade,
    age,
    country,
    experience,
    motivation,
  } = req.body;

  if (!studentEmail || !name || !parentEmail || !school || !grade || !age || !country) {
    return res.status(400).send('Missing required fields');
  }

  // Check if studentEmail is already registered
  if (fs.existsSync(LOG_FILE)) {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    if (data.includes(studentEmail)) {
      return res.status(409).send('Email already registered');
    }
  }

  const line = `"${name}","${studentEmail}","${parentEmail}","${school}","${grade}",${age},"${country}","${experience}","${motivation}"\n`;
  fs.appendFileSync(LOG_FILE, line);

  // Send confirmation email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"OAC Team" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: 'OAC Registration Confirmed',
      text: `Hi ${name},\n\nYou're successfully registered for the Online Astronomy Competition!\n\n— OAC Team`,
    });

    res.status(200).send('Registered successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Email failed but data saved');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
