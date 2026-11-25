const nodemailer = require("nodemailer");

const hasSmtpConfig = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : nodemailer.createTransport({ jsonTransport: true });

const buildFromAddress = () => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "no-reply@metrobook.local";
  const fromName = process.env.SMTP_FROM_NAME || "MetroBook";
  return `"${fromName}" <${fromEmail}>`;
};

const sendEmailVerificationCode = async ({ to, name, code, accountType }) => {
  const accountLabel = accountType === "host" ? "Corporate Host" : "Corporate Book";

  const info = await transporter.sendMail({
    from: buildFromAddress(),
    to,
    subject: `${accountLabel} Email Verification Code`,
    text: `Hello ${name || "there"},\n\nYour MetroBook verification code is: ${code}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <p>Hello ${name || "there"},</p>
      <p>Your MetroBook verification code is:</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  if (!hasSmtpConfig) {
    console.warn("SMTP config missing. Email sent via JSON transport only.");
    console.warn("Preview:", info.message.toString());
  }

  return info;
};

module.exports = {
  sendEmailVerificationCode,
};
