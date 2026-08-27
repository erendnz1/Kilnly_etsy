import requests

from app.config import settings


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
) -> None:
    headers = {
        "accept": "application/json",
        "api-key": settings.brevo_api_key,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": settings.brevo_from_name,
            "email": settings.brevo_from_email,
        },
        "to": [
            {
                "email": to_email,
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
    }

    response = requests.post(
        BREVO_API_URL,
        headers=headers,
        json=payload,
        timeout=10,
    )

    if not response.ok:
        raise RuntimeError(
            f"Brevo email sending failed: "
            f"{response.status_code} - {response.text}"
        )