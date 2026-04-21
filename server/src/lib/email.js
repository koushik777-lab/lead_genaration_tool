import { Resend } from "resend";
import logger from "./logger.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY not configured. Email not sent.");
      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "LeadForge <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });

    if (error) {
      logger.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    logger.error("Failed to send email:", err);
    return { success: false, error: err.message };
  }
};
