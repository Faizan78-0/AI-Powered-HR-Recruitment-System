import nodemailer from "nodemailer";

export const sender = '"AI-Powered HR Recruitment System" <hrrecruitmentsystem@gmail.com>';

// Check environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
}

// Use port 465 and secure SSL for Gmail
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App password if using Gmail
  },
});