const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendOTPEmail = async (email, otp, userName) => {
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5;">Hello ${userName || 'User'},</h2>
            <p>You requested a login verification code for your DocBook account.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #6b7280; font-weight: bold; letter-spacing: 1px;">Your OTP Code</p>
                <h1 style="margin: 10px 0; font-size: 48px; color: #111827; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p><strong>This OTP expires in 10 minutes.</strong></p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you did not request this code, please ignore this email or contact support if you have concerns about your account security.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">© 2026 DocBook. All rights reserved.</p>
        </div>
    `;

    return sendEmail(email, 'Your DocBook Login OTP', html);
};

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html: htmlContent,
        });
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Send Email error:', error);
        throw error;
    }
};

module.exports = {
    sendOTPEmail,
    sendEmail
};
