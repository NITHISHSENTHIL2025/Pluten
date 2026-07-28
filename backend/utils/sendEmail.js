// backend/utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // 1. Create the transporter using Google's SMTP servers
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 2. Define the email options
        const mailOptions = {
            from: `iSevens Network <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html, 
        };

        // 3. Fire the email
        await transporter.sendMail(mailOptions);
        console.log(`Email successfully routed to ${options.email}`);
        
    } catch (error) {
        console.error("Email Transmission Failure:", error);
        throw new Error("Failed to send communication.");
    }
};

module.exports = sendEmail;