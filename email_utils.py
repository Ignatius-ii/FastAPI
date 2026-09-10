import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv
 
load_dotenv()
 
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Lenovo Support")
 
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
 
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
 
 
def _send_email(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """
    Raises if Brevo isn't configured or the send fails — callers decide how
    to handle that (forgot_password swallows it so a misconfigured mail
    setup doesn't reveal anything to the caller, but still logs server-side).
    """
    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        raise RuntimeError(
            "Brevo is not configured — set BREVO_API_KEY and BREVO_SENDER_EMAIL in .env"
        )
 
    payload = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
        "textContent": text_body,
    }
 
    request = urllib.request.Request(
        BREVO_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "api-key": BREVO_API_KEY,
        },
    )
 
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status >= 300:
                raise RuntimeError(f"Brevo returned unexpected status {response.status}")
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Brevo API error {exc.code}: {error_body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Could not reach Brevo API: {exc.reason}") from exc
 
 
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
 















