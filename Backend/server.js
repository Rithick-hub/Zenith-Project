const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const otpStorage = new Map();

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Route to generate and send verification OTP
app.post('/api/send-email-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, { otp: otpCode, expiresAt: Date.now() + 5 * 60 * 1000 }); // Valid for 5 minutes

    const mailOptions = {
        from: `"Zenith Gaming" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Zenith Store OTP Code",
        html: `<div style="background:#1a1a2e; color:#fff; padding:20px; max-width:400px; border-radius:10px; font-family:sans-serif;">
                <h2>Verification Code</h2>
                <p>Use the OTP code below to secure your login access:</p>
                <h1 style="color:#ff416c; letter-spacing:5px; background:#111; padding:10px; text-align:center; border-radius:5px;">${otpCode}</h1>
                <p style="font-size:12px; color:#aaa;">This code expires in 5 minutes.</p>
               </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: "Email send failed" });
    }
});

// Route to verify the submitted OTP code
app.post('/api/verify-email-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStorage.get(email);
    
    if (record && record.otp === otp && Date.now() < record.expiresAt) {
        otpStorage.delete(email); // Delete OTP after successful one-time use
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));