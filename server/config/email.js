const nodemailer = require("nodemailer")
const sanitizeHtml = require("sanitize-html")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
})

console.log("Email transporter configured:", {
  user: process.env.GMAIL_USER ? "set" : "not set",
  pass: process.env.GMAIL_PASS ? "set" : "not set"
})

const sanitizeInput = (input) => {
  if (!input) return ""
  return sanitizeHtml(String(input), {
    allowedTags: [],
    allowedAttributes: {}
  })
}

const sendWelcomeEmail = async (userName, userEmail) => {
  try {
    const safeName = sanitizeInput(userName)
    await transporter.sendMail({
      from: `"FreelanceFlow" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: "Welcome to FreelanceFlow!",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6c63ff,#ff6584);padding:40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;">Welcome to FreelanceFlow!</h1>
          <p style="margin:8px 0 0;">Hi ${safeName}! Your account is ready.</p>
        </div>
        <div style="padding:40px;">
          <p style="color:#c4b5fd;">Start managing your freelance business today!</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="http://localhost:5173/app" style="background:linear-gradient(135deg,#6c63ff,#ff6584);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;">Go to Dashboard</a>
          </div>
        </div>
      </div>`
    })
  } catch (e) {
    console.error("Email error:", e.message)
  }
}

const sendOwnerNotification = async (userName, userEmail) => {
  try {
    const safeName = sanitizeInput(userName)
    const safeEmail = sanitizeInput(userEmail)
    await transporter.sendMail({
      from: `"FreelanceFlow" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `New User: ${safeName}`,
      html: `<div style="font-family:Arial;padding:30px;background:#0f0f1a;color:#fff;border-radius:16px;">
        <h2 style="color:#00d97e;">New User Signed Up!</h2>
        <p>Name: <strong>${safeName}</strong></p>
        <p>Email: <strong>${safeEmail}</strong></p>
        <p>Time: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
      </div>`
    })
  } catch (e) {
    console.error("Notify error:", e.message)
  }
}

const sendPasswordResetEmail = async (userName, userEmail, resetToken) => {
  const resetLink = `https://freelanceflow-blue-delta.vercel.app/reset-password?token=${resetToken}`
  try {
    const safeName = sanitizeInput(userName)
    console.log("Attempting to send password reset email to:", userEmail)
    console.log("Reset link:", resetLink)
    
    const result = await transporter.sendMail({
      from: `"FreelanceFlow" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: "Reset your FreelanceFlow password",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#fff;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ff6584,#ff4d6d);padding:40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;">Reset Password</h1>
        </div>
        <div style="padding:40px;">
          <p>Hi ${safeName},</p>
          <p style="color:#c4b5fd;">We received a request to reset your password. Click the button below:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}" style="background:linear-gradient(135deg,#ff6584,#ff4d6d);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;">Reset Password</a>
          </div>
          <p style="color:#a8aec0;font-size:13px;">Or copy this link: ${resetLink}</p>
          <p style="color:#a8aec0;font-size:13px;margin-top:30px;">If you didn't request this, ignore this email.</p>
        </div>
      </div>`
    })
    console.log("Email sent successfully:", result.messageId)
    return result
  } catch (e) {
    console.error("Password reset email error:", e.message)
    console.error("Full error:", e)
    throw e
  }
}

module.exports = { sendWelcomeEmail, sendOwnerNotification, sendPasswordResetEmail }
