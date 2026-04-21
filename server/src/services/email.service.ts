import nodemailer from 'nodemailer'
import { logger } from '../utils/logger'

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

const FROM  = process.env.EMAIL_FROM || 'BugHive <noreply@bughive.io>'
const BASE  = process.env.CLIENT_URL || 'http://localhost:3000'

const wrap = (body: string) => `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif}
.wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.header{background:#0a0a0a;padding:24px 32px}.logo{font-size:20px;font-weight:700;color:#6366f1;letter-spacing:-0.5px}
.body{padding:32px}.footer{background:#f9f9f9;padding:16px 32px;font-size:12px;color:#888;text-align:center;border-top:1px solid #eee}
.btn{display:inline-block;background:#6366f1;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:20px}
h2{color:#0a0a0a;margin-top:0}p{color:#555;line-height:1.7;margin:8px 0}
.code{background:#f4f4f4;border:1px solid #e0e0e0;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:14px;color:#333;margin:12px 0}
</style></head><body>
<div class="wrap">
  <div class="header"><div class="logo">⬡ BugHive</div></div>
  <div class="body">${body}</div>
  <div class="footer">BugHive Bug Tracking · <a href="${BASE}" style="color:#6366f1">Open App</a></div>
</div></body></html>`

class EmailService {
  private async send(to: string, subject: string, html: string) {
    if (!process.env.SMTP_PASS) { logger.warn(`Email skipped (no SMTP): ${subject} → ${to}`); return }
    try {
      await transport.sendMail({ from: FROM, to, subject, html })
      logger.info(`Email → ${to}: ${subject}`)
    } catch (e) { logger.error('Email failed:', e) }
  }

  sendWelcome(to: string, name: string) {
    return this.send(to, 'Welcome to BugHive', wrap(`
      <h2>Welcome, ${name}! 👋</h2>
      <p>Your BugHive account is ready. Start tracking bugs with your team.</p>
      <a class="btn" href="${BASE}">Open BugHive</a>`))
  }

  sendWelcomeNewUser(to: string, name: string, email: string, password: string) {
    return this.send(to, 'Your BugHive account has been created', wrap(`
      <h2>Hi ${name},</h2>
      <p>Your admin has created a BugHive account for you. Use the credentials below to sign in:</p>
      <div class="code"><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</div>
      <p>Please change your password after your first login.</p>
      <a class="btn" href="${BASE}/login">Sign In Now</a>`))
  }

  sendBugAssigned(to: string, name: string, bugId: string, title: string, assignedBy: string) {
    return this.send(to, `[BugHive] Bug assigned: ${bugId}`, wrap(`
      <h2>Bug Assigned to You</h2>
      <p>Hi ${name}, <strong>${assignedBy}</strong> assigned you a bug:</p>
      <div class="code"><strong>${bugId}</strong><br/>${title}</div>
      <a class="btn" href="${BASE}/bugs/${bugId}">View Bug</a>`))
  }

  sendStatusChanged(to: string, name: string, bugId: string, title: string, newStatus: string) {
    return this.send(to, `[BugHive] ${bugId} → ${newStatus}`, wrap(`
      <h2>Bug Status Updated</h2>
      <p>Hi ${name}, the status of <strong>${bugId}</strong> changed to <strong>${newStatus}</strong>.</p>
      <div class="code">${title}</div>
      <a class="btn" href="${BASE}/bugs/${bugId}">View Bug</a>`))
  }

  sendPasswordResetByAdmin(to: string, name: string, newPassword: string) {
    return this.send(to, 'Your BugHive password was reset', wrap(`
      <h2>Password Reset</h2>
      <p>Hi ${name}, your administrator has reset your BugHive password.</p>
      <div class="code"><strong>New Password:</strong> ${newPassword}</div>
      <p>Please sign in and change your password immediately.</p>
      <a class="btn" href="${BASE}/login">Sign In</a>`))
  }
}

export const emailService = new EmailService()
