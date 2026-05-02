import { transporter, sender } from "../Emails/sender";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_UPDATE_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
} from "../Emails/template";
import { SentMessageInfo } from "nodemailer";

//send verification Email

export const sendVerificationEmail = async (
  email: string,
  verificationToken: string
): Promise<SentMessageInfo> => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Verify Your Email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
    });

    console.log("Verification Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error sending verification Email:", err.message);
    throw new Error(`Error sending verification email: ${err.message}`);
  }
}

// Send welcome email
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<SentMessageInfo> => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Welcome to AI LAB'S",
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name),
    });

    console.log("Welcome Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error sending welcome Email:", err.message);
    throw new Error(`Error sending welcome Email: ${err.message}`);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetURL: string
): Promise<SentMessageInfo> => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Reset Your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });

    console.log("Password Reset Email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error sending password reset Email:", err.message);
    throw new Error(`Error sending password reset Email: ${err.message}`);
  }
};

// Send reset success email
export const sendUpdateSuccessEmail = async (
email: string, Name: string): Promise<SentMessageInfo> => {
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: email,
      subject: "Password update Successful",
      html: PASSWORD_UPDATE_SUCCESS_TEMPLATE,
    });

    console.log(
      "Password update success email sent successfully:",
      response.messageId
    );

    return response;
  } catch (error) {
    const err = error as Error;
    console.error("Error sending password reset success email:", err.message);
    throw new Error(
      `Error sending password reset success email: ${err.message}`
    );
  }
};