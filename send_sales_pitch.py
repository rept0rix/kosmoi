import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuration
recipient = 'test@example.com'
subject = 'Stop scrolling. Start earning. ($1 inside)'
payment_link = 'https://buy.stripe.com/mock_LINK_MISSING'

# Sales Copy
body = f"""
Hi,

I'll keep this brief because your time is money.

Most people ignore opportunities that cost less than a cup of coffee. That's why they stay exactly where they are.

For $1, you aren't just buying a product. You're buying a fast-track ticket to results.

Don't overthink it. It's one dollar.

Grab it here: {payment_link}

To your success,

Sales Wizard
"""

# Mock Sending (Printing to console since SMTP isn't configured in this environment)
print(f"--- SENDING EMAIL TO {recipient} ---")
print(f"Subject: {subject}")
print(body)
print("--- EMAIL SENT SUCCESSFULLY ---")
