// server.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// basic rate limiter to avoid abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max requests per IP per window
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure transporter using SMTP (Gmail example using app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify transporter on startup (logs helpful error if config wrong)
transporter.verify().then(() => {
  console.log('SMTP transporter ready');
}).catch(err => {
  console.error('Error verifying transporter', err);
});

app.post('/send', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !message) return res.status(400).json({ ok: false, error: 'Missing fields' });

    const mailOptions = {
      from: process.env.EMAIL_USER, // sender (your email)
      to: to,                       // recipient (from form)
      subject: subject || 'Message from website',
      text: message,
      // html: `<p>${message}</p>` // optional HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return res.json({ ok: true, info });
  } catch (err) {
    console.error('Send error', err);
    return res.status(500).json({ ok: false, error: 'Failed to send' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});