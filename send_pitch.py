import time

recipient = 'test@example.com'
link = 'https://buy.stripe.com/mock_LINK_MISSING'

subject = "Subject: STOP. Do not read this unless you have $1."
body = f"""
Hey there,

Serious question: What can you buy with $1 today?
A gumball? Half a song?

I've got something better. It's almost criminal that we're giving this away for a buck.

Grab it before I come to my senses:
{link}

Tick tock.

- The Sales Wizard
"""

print(f"Preparing to send email to {recipient}...")
time.sleep(1)
print(subject)
print("-" * 20)
print(body)
print("-" * 20)
print("Email dispatched successfully! (Simulated)")