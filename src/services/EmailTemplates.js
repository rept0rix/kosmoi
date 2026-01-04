export const EmailTemplates = {
    getInvitationEmail: (businessName, link) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { text-align: center; padding: 40px 0; background-color: #0f172a; border-radius: 12px 12px 0 0; }
        .logo { color: #fff; font-size: 24px; font-weight: bold; text-decoration: none; }
        .content { padding: 40px 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; padding: 14px 28px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding-top: 20px; font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="https://kosmoi.site" class="logo">Samui Service Hub</a>
        </div>
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Hello, ${businessName} 👋</h2>
            <p>We've created a profile for your business on <strong>Samui Service Hub</strong>, the new premier platform for island services.</p>
            <p>Your profile is already visible to customers, but you need to claim it to:</p>
            <ul style="color: #475569;">
                <li>Update your pricing and services</li>
                <li>Respond to customer inquiries</li>
                <li>Receive direct bookings</li>
            </ul>
            <div style="text-align: center;">
                <a href="${link}" class="button">Claim Your Profile Now</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">
                Can't click the button? Copy this link:<br>
                <a href="${link}" style="color: #7c3aed;">${link}</a>
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Samui Service Hub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
};
