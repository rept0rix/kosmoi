
export const INVITATION_TEMPLATE = (businessName, claimLink) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #334155; }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; letter-spacing: -0.5px; }
    .content { padding: 40px 32px; }
    .text { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
    .highlight { color: #FBBF24; font-weight: 600; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background-color: #F59E0B; color: #0f172a; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; transition: all 0.2s; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kosmoi Island Hub</h1>
    </div>
    <div class="content">
      <p class="text">Sawasdee <strong>${businessName}</strong>,</p>
      
      <p class="text">
        Our AI scouts have identified your business as a <span class="highlight">Hidden Gem</span> in Koh Samui. 
        Note: This is an automated discovery by our "Island Crawler" system.
      </p>

      <p class="text">
        We have created a preliminary profile for you on the Kosmoi App - the new digital heart of the island.
        Tourists are looking for authentic experiences like yours.
      </p>

      <div class="button-container">
        <a href="${claimLink}" class="button">Claim Your Profile Now</a>
      </div>

      <p class="text">
        Claiming is free and allows you to update your photos, hours, and receive direct bookings.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Kosmoi. Built with 🍌 in Koh Samui.</p>
      <p>Automated message from "Sarah" (Sales Agent ID: 882)</p>
    </div>
  </div>
</body>
</html>
`;
