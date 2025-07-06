const nodemailer = require('nodemailer');
const { logError } = require('./database');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const createEmailTemplate = (registrationData) => {
  const competitionDate = 'August 30, 2025';
  const competitionTime = '12:00 - 23:59 Eastern Standard Time';

  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; text-align: center;">🌟 Welcome to the Online Astronomy Competition! 🌟</h2>
        
        <p>Dear ${registrationData.fullName},</p>
        
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
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">📚 Study Resources:</h3>
          <ul style="color: #856404;">
            <li>Visit our website for sample problems</li>
            <li>Review the recommended study topics</li>
            <li>Practice with astronomy olympiad problems</li>
            <li>Join our community for discussion and tips</li>
          </ul>
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
          This email was sent to ${registrationData.email} because you registered for the Online Astronomy Competition.<br>
          Registration ID: ${registrationData.id}
        </p>
      </div>
    `,
    text: `Hi ${registrationData.fullName},

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

Study Resources:
- Visit our website for sample problems
- Review the recommended study topics
- Practice with astronomy olympiad problems
- Join our community for discussion and tips

We're excited to have you participate in this journey through the cosmos!

If you have any questions, please contact us at astronomycompetition@gmail.com.

Best of luck with your preparation!

— The OAC Team
Inspiring Future Astronomers 🌟

Registration ID: ${registrationData.id}`
  };
};

const sendConfirmationEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = createEmailTemplate(registrationData);

    const mailOptions = {
      from: `"OAC Team" <${process.env.EMAIL_USER}>`,
      to: registrationData.email,
      cc: registrationData.parentEmail,
      subject: '🌟 OAC Registration Confirmed - Welcome to the Online Astronomy Competition!',
      html: emailTemplate.html,
      text: emailTemplate.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${registrationData.email}`);
    return result;
  } catch (error) {
    logError(error, 'Email sending failed');
    throw error;
  }
};

const sendNotificationEmail = async (registrationData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"OAC System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New OAC Registration - ${registrationData.fullName}`,
      html: `
        <h3>New Registration Received</h3>
        <p><strong>Name:</strong> ${registrationData.fullName}</p>
        <p><strong>Email:</strong> ${registrationData.email}</p>
        <p><strong>School:</strong> ${registrationData.school}</p>
        <p><strong>Grade:</strong> ${registrationData.grade}</p>
        <p><strong>Age:</strong> ${registrationData.age}</p>
        <p><strong>Country:</strong> ${registrationData.country}</p>
        <p><strong>Parent Email:</strong> ${registrationData.parentEmail}</p>
        <p><strong>Previous Experience:</strong> ${registrationData.previousExperience || 'Not provided'}</p>
        <p><strong>Motivation:</strong> ${registrationData.motivation || 'Not provided'}</p>
        <p><strong>Registration ID:</strong> ${registrationData.id}</p>
        <p><strong>Timestamp:</strong> ${registrationData.timestamp}</p>
      `,
      text: `New OAC Registration:
      
Name: ${registrationData.fullName}
Email: ${registrationData.email}
School: ${registrationData.school}
Grade: ${registrationData.grade}
Age: ${registrationData.age}
Country: ${registrationData.country}
Parent Email: ${registrationData.parentEmail}
Previous Experience: ${registrationData.previousExperience || 'Not provided'}
Motivation: ${registrationData.motivation || 'Not provided'}
Registration ID: ${registrationData.id}
Timestamp: ${registrationData.timestamp}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to admin');
  } catch (error) {
    logError(error, 'Admin notification email failed');
    // Don't throw error as this is not critical
  }
};

module.exports = {
  sendConfirmationEmail,
  sendNotificationEmail,
  createTransporter,
  createEmailTemplate
};
