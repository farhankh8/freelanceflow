const nodemailer = require("nodemailer")
const sanitizeHtml = require("sanitize-html")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
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

module.exports = { sendWelcomeEmail, sendOwnerNotification }
