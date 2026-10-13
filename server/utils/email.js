import { logInfo } from "./logger.js";

export const sendEmailNotificationHook = async ({ to, subject, message }) => {
  // Hook point for production email provider integration (SES, SendGrid, etc.)
  logInfo("Email hook invoked", { to, subject, preview: message?.slice(0, 120) });
  return { queued: true };
};

export const sendVerificationCodeHook = async ({ to, code }) => {
  const subject = "Verify your college email";
  const message = `Your Alumni Nexus verification code is ${code}. It expires in 15 minutes.`;
  return sendEmailNotificationHook({ to, subject, message });
};
