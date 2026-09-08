import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Lenovo Support")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")


def _send_email(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """
    Raises if SMTP isn't configured or the send fails — callers decide how to
    handle that (e.g. forgot_password swallows it so a broken mail server
    doesn't reveal anything to the caller, but still logs server-side).
    """
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP is not configured — set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in .env"
        )

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        if SMTP_USE_TLS:
            server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [to_email], message.as_string())


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={reset_token}"

    text_body = (
        "We received a request to reset your Lenovo Support password.\n\n"
        f"Reset your password using this link:\n{reset_link}\n\n"
        "This link expires in 30 minutes. If you didn't request this, you can "
        "safely ignore this email — your password won't be changed."
    )

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>We received a request to reset your Lenovo Support password.</p>
      <p>
        <a href="{reset_link}"
           style="display:inline-block;padding:10px 20px;background:#534ab7;
                  color:#ffffff;text-decoration:none;border-radius:6px;">
          Reset your password
        </a>
      </p>
      <p style="color:#666;font-size:13px;">
        This link expires in 30 minutes. If you didn't request this, you can
        safely ignore this email — your password won't be changed.
      </p>
    </div>
    """

    _send_email(to_email, "Reset your Lenovo Support password", html_body, text_body)
