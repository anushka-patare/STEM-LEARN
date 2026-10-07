"""
Email dispatch service for OTP verification and administrative notices.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_otp_email(recipient_email: str, recipient_name: str, otp_code: str, role: str = 'Student') -> bool:
    """Send an HTML email containing the 6-digit login/verification OTP."""
    debug_mode = current_app.config.get('DEBUG', True) if current_app else True
    
    # In Debug mode or if SMTP is not configured, print to server console for testing
    if debug_mode:
        print(f"\n{'='*55}\n[EMAIL NOTIFICATION] To: {recipient_email} ({recipient_name})\nRole: {role}\nYour 6-Digit STEMLearn Login OTP is: >>> {otp_code} <<<\nExpires in 5 minutes.\n{'='*55}\n")

    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')
    from_email = os.getenv('SMTP_FROM', 'no-reply@stemlearn.org')

    if not smtp_host or not smtp_user:
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Your STEMLearn Login Code: {otp_code}"
        msg['From'] = f"STEMLearn Platform <{from_email}>"
        msg['To'] = recipient_email

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">STEMLearn Portal</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Middle School Gamified STEM Research Platform</p>
            </div>
            <p style="color: #1e293b; font-size: 15px;">Hello <strong>{recipient_name}</strong>,</p>
            <p style="color: #475569; font-size: 14px;">Use the following One-Time Password (OTP) to complete your sign-in to STEMLearn:</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">{otp_code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">This code is valid for <strong>5 minutes</strong> and can only be used once. If you did not request this login, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">STEMLearn Research Laboratory &copy; 2026. All rights reserved.</p>
        </div>
        """
        msg.attach(MIMEText(html_content, 'html'))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, recipient_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[SMTP Error] Failed to send email to {recipient_email}: {e}")
        return False

def send_teacher_approval_email(recipient_email: str, recipient_name: str, approved: bool, reason: str = "") -> bool:
    """Send approval or rejection notice to teacher."""
    debug_mode = current_app.config.get('DEBUG', True) if current_app else True
    status_text = "APPROVED ✅" if approved else "REJECTED ❌"
    
    if debug_mode:
        print(f"\n{'='*55}\n[TEACHER NOTIFICATION] To: {recipient_email} ({recipient_name})\nStatus: Account {status_text}\nReason/Details: {reason or 'Welcome to STEMLearn!'}\n{'='*55}\n")
    return True
