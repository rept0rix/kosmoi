email_recipient = 'test@example.com'
payment_link = 'https://buy.stripe.com/mock_LINK_MISSING'
subject = "Stop wasting time. This $1 changes everything."

body = f"""
To: {email_recipient}
Subject: {subject}

Hey,

You’ve got a dollar, right? It's probably sitting uselessly in your digital wallet.

I’m offering you something worth way more than a cheap vending machine coffee. This is the One Dollar Challenge. 

It’s bold. It’s instant. It’s yours.

One buck. Massive value. No brainer.

Grab it before I come to my senses and raise the price:
{payment_link}

Let's move.

Cheers,
The Sales Wizard
"""

print("--- SIMULATING EMAIL SEND ---")
print(body)
print("--- EMAIL SENT SUCCESSFULLY ---")