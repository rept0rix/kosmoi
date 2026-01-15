
export const INVITATION_TEMPLATE = (businessName, claimLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Kosmoi Invitation</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
    body { margin: 0; padding: 0; font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 40px auto; background: #1E293B; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #334155; }
    .hero { background: linear-gradient(135deg, #F59E0B 0%, #B45309 100%); padding: 48px 32px; text-align: center; position: relative; overflow: hidden; }
    .hero::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=1200&opacity=0.1'); background-size: cover; background-position: center; opacity: 0.1; mix-blend-mode: overlay; pointer-events: none; }
    .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.05em; color: #FFFFFF; margin-bottom: 8px; position: relative; z-index: 10; padding: 8px 16px; border: 2px solid rgba(255,255,255,0.3); display: inline-block; border-radius: 12px; backdrop-filter: blur(4px); }
    .hero h1 { margin: 24px 0 0; color: #FFFFFF; font-size: 36px; font-weight: 600; line-height: 1.1; position: relative; z-index: 10; text-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .content { padding: 48px 40px; }
    .greeting { font-size: 20px; color: #94A3B8; margin-bottom: 24px; font-weight: 300; }
    .lead-text { font-size: 18px; line-height: 1.6; color: #E2E8F0; margin-bottom: 32px; }
    .highlight { color: #FBBF24; font-weight: 600; position: relative; display: inline-block; }
    .highlight::after { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 2px; background-color: #FBBF24; opacity: 0.5; }
    .card { background: #0F172A; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin-bottom: 32px; display: flex; align-items: center; gap: 16px; }
    .card-icon { width: 48px; height: 48px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #F59E0B; }
    .card-text { font-size: 15px; color: #CBD5E1; line-height: 1.5; margin: 0; }
    .cta-container { text-align: center; margin: 40px 0 16px; }
    .button { background: linear-gradient(to right, #F59E0B, #D97706); color: #FFF; padding: 18px 48px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 18px; display: inline-block; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3); }
    .button:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(245, 158, 11, 0.4); }
    .disclaimer { font-size: 13px; color: #64748B; text-align: center; margin-top: 24px; line-height: 1.5; }
    .footer { background: #0F172A; padding: 32px; text-align: center; border-top: 1px solid #334155; border-bottom-left-radius: 23px; border-bottom-right-radius: 23px; }
    .footer p { margin: 8px 0; font-size: 13px; color: #475569; }
    .social-links { margin-top: 16px; }
    .social-link { color: #64748B; text-decoration: none; margin: 0 8px; font-size: 14px; }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; width: 100%; border: none; }
      .content { padding: 32px 24px; }
      .hero { padding: 40px 24px; }
      .hero h1 { font-size: 32px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div class="logo">KOSMOI</div>
      <h1>Koh Samui is Calling.</h1>
    </div>
    <div class="content">
      <p class="greeting">Sawasdee <strong>${businessName}</strong>,</p>
      
      <p class="lead-text">
        Our 'Island Crawler' AI has specifically identified your business as a <span class="highlight">Hidden Gem</span> that tourists need to see.
      </p>

      <div class="card">
        <div class="card-icon">💎</div>
        <p class="card-text">
          We've created a preliminary <strong>Premium Profile</strong> for you on Kosmoi - the new digital heart of the island.
        </p>
      </div>

      <p class="lead-text">
        Travelers are looking for authentic experiences exactly like yours. Don't let them miss you.
      </p>

      <div class="cta-container">
        <a href="${claimLink}" class="button">Claim Your Profile Free</a>
      </div>

      <p class="disclaimer">
        No credit card required. Verify your ownership in 30 seconds to update your photos, hours, and start receiving direct bookings.
      </p>
    </div>
    <div class="footer">
      <p>Sent autonomously by <strong>Sarah</strong> (AI Sales Coordinator)</p>
      <p style="opacity: 0.6; font-size: 11px; margin-top: 16px;">
        Protocol ID: 626-ALPHA • Node: SAMUI-SOUTH
      </p>
      <p style="margin-top: 24px;">
        © 2026 Kosmoi Island Hub<br>
        Built with 🍌 in Koh Samui
      </p>
    </div>
  </div>
</body>
</html>
`;
