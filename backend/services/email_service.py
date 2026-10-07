"""Email service for STEMLearn - Admin configured SMTP for Password Reset & Notifications only."""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from utils.crypto_helper import decrypt_secret, encrypt_secret

logger = logging.getLogger('stemlearn.email')


def get_smtp_config(db):
    """Retrieve SMTP configuration from system_settings with fallback to env."""
    settings = db.system_settings.find_one({'type': 'global'}) or {}
    smtp = settings.get('smtp_settings', {})

    host = smtp.get('host') or os.getenv('SMTP_HOST', '')
    port = int(smtp.get('port') or os.getenv('SMTP_PORT', 587))
    user = smtp.get('user') or os.getenv('SMTP_USER', '')
    encrypted_pass = smtp.get('password', '')
    password = decrypt_secret(encrypted_pass) if encrypted_pass else os.getenv('SMTP_PASS', '')
    from_email = smtp.get('from_email') or os.getenv('SMTP_FROM_EMAIL', user)
    from_name = smtp.get('from_name') or os.getenv('SMTP_FROM_NAME', 'STEMLearn Academy')
    use_tls = smtp.get('use_tls', True)

    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'from_email': from_email,
        'from_name': from_name,
        'use_tls': use_tls,
        'is_configured': bool(host and user and password)
    }


def send_email(db, to_email: str, subject: str, html_body: str, text_body: str = "") -> tuple[bool, str]:
    """Send an email using admin-configured SMTP server."""
    if not to_email:
        return False, "Recipient email is missing."

    config = get_smtp_config(db)
    
    # Always log email attempt
    log_entry = {
        'to_email': to_email,
        'subject': subject,
        'sent_at': datetime.utcnow(),
        'status': 'pending',
        'error': None
    }

    if not config['is_configured']:
        msg = "SMTP is not configured by the administrator."
        logger.warning(f"Email to {to_email} not sent: {msg}")
        print(f"\n[MOCK EMAIL DISPATCH] To: {to_email}\nSubject: {subject}\nBody:\n{text_body or html_body}\n")
        log_entry['status'] = 'mock_dispatched'
        log_entry['error'] = 'SMTP not configured - logged to console'
        db.mail_logs.insert_one(log_entry)
        return True, "Mock email dispatched to server logs (SMTP not configured)."

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{config['from_name']} <{config['from_email']}>"
        msg['To'] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, 'plain'))
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(config['host'], config['port'], timeout=10)
        if config['use_tls']:
            server.starttls()
        server.login(config['user'], config['password'])
        server.sendmail(config['from_email'], [to_email], msg.as_string())
        server.quit()

        log_entry['status'] = 'sent'
        db.mail_logs.insert_one(log_entry)
        logger.info(f"Email sent successfully to {to_email}")
        return True, "Email sent successfully."
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Failed to send email to {to_email}: {err_msg}")
        log_entry['status'] = 'failed'
        log_entry['error'] = err_msg
        db.mail_logs.insert_one(log_entry)
        return False, f"Failed to send email: {err_msg}"


def send_test_email(db, test_recipient: str) -> tuple[bool, str]:
    """Send a diagnostic test email to verify SMTP configuration."""
    subject = "STEMLearn SMTP Test Email"
    html = """
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #2563eb;">STEMLearn SMTP Diagnostic Test</h2>
        <p>This is a test email sent from your STEMLearn Platform.</p>
        <p>If you are receiving this message, your SMTP settings are configured correctly and active.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">STEMLearn Educational Platform &bull; Automated System</p>
    </div>
    """
    return send_email(db, test_recipient, subject, html, text_body="STEMLearn SMTP test email succeeded.")


def send_password_reset_email(db, to_email: str, recipient_name: str, reset_url: str) -> tuple[bool, str]:
    """Send single-use password reset link (expires in 30 minutes)."""
    subject = "STEMLearn — Password Reset Request"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1e293b; margin: 0; font-size: 24px;">STEM<span style="color: #2563eb;">Learn</span></h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Instructions</p>
        </div>
        <p style="color: #334155; font-size: 15px;">Hello <strong>{recipient_name}</strong>,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            We received a request to reset your password for your STEMLearn account. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 28px 0;">
            <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.4;">
            This link is valid for <strong>30 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email or contact your school administrator.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            STEMLearn Educational Platform &bull; Single-use token link
        </p>
    </div>
    """
    text = f"Hello {recipient_name},\n\nReset your STEMLearn password using this link (valid for 30 min):\n{reset_url}\n\nIf you did not request this, ignore this email."
    return send_email(db, to_email, subject, html, text)


def send_password_changed_confirmation(db, to_email: str, recipient_name: str) -> tuple[bool, str]:
    """Send confirmation that password has been successfully updated."""
    subject = "STEMLearn — Your Password Was Changed"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #059669;">Password Changed Successfully</h2>
        <p style="color: #334155;">Hello <strong>{recipient_name}</strong>,</p>
        <p style="color: #334155;">Your STEMLearn account password was recently changed.</p>
        <p style="color: #64748b; font-size: 13px;">If you performed this change, no further action is needed. If you did NOT make this change, please immediately notify your school administrator.</p>
    </div>
    """
    return send_email(db, to_email, subject, html, text_body=f"Hello {recipient_name}, your STEMLearn password was recently updated.")


def send_teacher_approval_notification(db, to_email: str, teacher_name: str, approved: bool, reason: str = "") -> tuple[bool, str]:
    """Send teacher approval or rejection notice."""
    if approved:
        subject = "STEMLearn — Faculty Account Approved"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #059669;">Welcome to STEMLearn Faculty!</h2>
            <p>Hello <strong>{teacher_name}</strong>,</p>
            <p>Your faculty registration has been <strong>approved</strong> by the administrator. You can now log into your Teacher Portal using your username and password.</p>
        </div>
        """
    else:
        subject = "STEMLearn — Faculty Registration Update"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #dc2626;">Faculty Registration Not Approved</h2>
            <p>Hello <strong>{teacher_name}</strong>,</p>
            <p>Your faculty application could not be approved at this time.</p>
            {f'<p><strong>Reason provided:</strong> {reason}</p>' if reason else ''}
            <p>Please contact your institution administrator for assistance.</p>
        </div>
        """
    return send_email(db, to_email, subject, html, text_body=f"Registration status update for {teacher_name}.")
