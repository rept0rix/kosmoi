// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// EMAIL TEMPLATES
// ============================================

const TEMPLATES = {
    welcome: (data: { name?: string }) => ({
        subject: `ברוכים הבאים ל-Kosmoi! 🎉`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; }
        p { color: #94A3B8; line-height: 1.6; }
        .cta { display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .checklist { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 20px 0; }
        .checklist-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .checklist-item:last-child { border: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        .footer p { font-size: 12px; color: #64748B; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">KOSMOI</div>
        </div>
        <h1>שלום ${data.name || 'שם'}! 👋</h1>
        <p>ברוכים הבאים למשפחת Kosmoi. אנחנו שמחים שבחרתם להצטרף אלינו!</p>
        <p>ה-trial שלכם פעיל ל-14 ימים הקרובים. הנה מה שכדאי לעשות קודם:</p>
        
        <div class="checklist">
            <div class="checklist-item">⬜ העלו את הלוגו שלכם</div>
            <div class="checklist-item">⬜ הגדירו שעות פעילות</div>
            <div class="checklist-item">⬜ קבלו את ה-lead הראשון שלכם!</div>
        </div>
        
        <center>
            <a href="https://kosmoi.site/dashboard" class="cta">כניסה לדאשבורד →</a>
        </center>
        
        <div class="footer">
            <p>Kosmoi - The City OS for Koh Samui</p>
            <p>יש שאלות? פשוט תשלחו לנו הודעה!</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    trial_reminder: (data: { name?: string, daysLeft?: number }) => ({
        subject: `⏰ נשארו לך ${data.daysLeft || 7} ימים ב-trial`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; }
        p { color: #94A3B8; line-height: 1.6; }
        .highlight { background: linear-gradient(135deg, #F59E0B, #EF4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
        .cta { display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .stats { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .stat-number { font-size: 36px; font-weight: 700; color: #60A5FA; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">KOSMOI</div>
        </div>
        <h1>היי ${data.name || 'שם'}! 👋</h1>
        <p>רק רצינו להזכיר לך שנשארו לך <span class="highlight">${data.daysLeft || 7} ימים</span> ב-trial שלך.</p>
        <p>כבר קיבלת leads? השתמשת בפיצ'רים? אנחנו פה לעזור!</p>
        
        <center>
            <a href="https://kosmoi.site/dashboard" class="cta">המשך לעבוד →</a>
        </center>
        
        <div class="footer">
            <p>Kosmoi - The City OS for Koh Samui</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    trial_ending: (data: { name?: string, daysLeft?: number }) => ({
        subject: `🚨 ה-trial שלך מסתיים בעוד ${data.daysLeft || 2} ימים!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 2px solid #F59E0B; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #F59E0B, #EF4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; }
        p { color: #94A3B8; line-height: 1.6; }
        .urgent { background: linear-gradient(135deg, #F59E0B, #EF4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; font-size: 24px; }
        .cta { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 20px 0; font-size: 18px; }
        .discount { background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .discount-code { font-size: 24px; font-weight: 700; color: #10B981; letter-spacing: 2px; }
        .footer { text-align: center; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚠️ KOSMOI</div>
        </div>
        <h1>היי ${data.name || 'שם'}!</h1>
        <p class="urgent">נשארו רק ${data.daysLeft || 2} ימים!</p>
        <p>ה-trial שלך עומד להסתיים. אל תפספסו את ההזדמנות להמשיך לקבל leads ולהגדיל את העסק שלכם!</p>
        
        <div class="discount">
            <p style="margin: 0 0 10px; color: #94A3B8;">🎁 מתנה מיוחדת:</p>
            <div class="discount-code">20% OFF</div>
            <p style="margin: 10px 0 0; color: #64748B; font-size: 12px;">השתמשו בקוד EARLY20 בתשלום</p>
        </div>
        
        <center>
            <a href="https://kosmoi.site/pricing" class="cta">שדרגו עכשיו →</a>
        </center>
        
        <div class="footer">
            <p style="color: #64748B; font-size: 12px;">יש שאלות? פשוט תענו על המייל הזה!</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    trial_expired: (data: { name?: string }) => ({
        subject: `😢 ה-trial שלך הסתיים - נתראה בפעם הבאה?`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; color: #64748B; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; }
        p { color: #94A3B8; line-height: 1.6; }
        .cta { display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .survey { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">KOSMOI</div>
        </div>
        <h1>נתראה בפעם הבאה, ${data.name || ''}!</h1>
        <p>ה-trial שלך הסתיים. אנחנו מקווים שנהנית מהשירות!</p>
        <p>אם יש משהו שיכולנו לעשות טוב יותר, נשמח לשמוע:</p>
        
        <div class="survey">
            <p style="margin: 0; color: #CBD5E1;">למה לא המשכת?</p>
            <p style="margin: 10px 0 0; font-size: 14px;">
                <a href="https://kosmoi.site/survey?reason=price" style="color: #60A5FA;">💰 יקר מדי</a> · 
                <a href="https://kosmoi.site/survey?reason=features" style="color: #60A5FA;">🔧 חסרו פיצ'רים</a> · 
                <a href="https://kosmoi.site/survey?reason=time" style="color: #60A5FA;">⏰ לא היה זמן</a>
            </p>
        </div>
        
        <center>
            <a href="https://kosmoi.site/pricing" class="cta">חזרו אלינו בכל זמן →</a>
        </center>
        
        <div class="footer">
            <p style="color: #64748B; font-size: 12px;">תודה שניסית את Kosmoi! 💙</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    lead_notification: (data: { businessName?: string, leadName?: string, leadType?: string }) => ({
        subject: `🎯 Lead חדש: ${data.leadName || 'לקוח חדש'}!`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 2px solid #10B981; }
        .header { text-align: center; margin-bottom: 20px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; text-align: center; }
        p { color: #94A3B8; line-height: 1.6; }
        .lead-card { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .lead-name { font-size: 24px; font-weight: 700; color: #10B981; margin-bottom: 10px; }
        .lead-detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .cta { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">🎯 NEW LEAD</span>
        </div>
        <h1>יש לך lead חדש!</h1>
        <p style="text-align: center;">מישהו מתעניין בשירותים של <strong>${data.businessName || 'העסק שלך'}</strong>!</p>
        
        <div class="lead-card">
            <div class="lead-name">${data.leadName || 'לקוח פוטנציאלי'}</div>
            <div class="lead-detail">
                <span style="color: #64748B;">סוג:</span>
                <span style="color: #CBD5E1;">${data.leadType || 'פנייה כללית'}</span>
            </div>
        </div>
        
        <center>
            <a href="https://kosmoi.site/dashboard/leads" class="cta">צפה ב-Lead →</a>
        </center>
        
        <div class="footer">
            <p style="color: #64748B; font-size: 12px;">צרו קשר עם ה-lead תוך 24 שעות להמרה מקסימלית! 🚀</p>
        </div>
    </div>
</body>
</html>
        `
    }),

    payment_failed: (data: { name?: string, attempt?: number, billingPortalUrl?: string }) => ({
        subject: `⚠️ תשלום נכשל - נדרשת פעולה`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0A0F1C; color: #E2E8F0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); border-radius: 16px; padding: 40px; border: 2px solid #EF4444; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 800; background: linear-gradient(135deg, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .warning-icon { font-size: 48px; margin-bottom: 10px; }
        h1 { color: #F1F5F9; margin: 20px 0 10px; }
        p { color: #94A3B8; line-height: 1.6; }
        .highlight { color: #EF4444; font-weight: 700; }
        .cta { display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
        .info-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body dir="rtl">
    <div class="container">
        <div class="header">
            <div class="logo">KOSMOI</div>
        </div>
        <div style="text-align: center;"><span class="warning-icon">⚠️</span></div>
        <h1 style="text-align: center;">תשלום נכשל</h1>
        <p style="text-align: center;">היי ${data.name || ''},</p>
        <p style="text-align: center;">לא הצלחנו לחייב את כרטיס האשראי שלך.</p>
        
        <div class="info-box">
            <p style="margin: 0; text-align: center;">
                ניסיון מספר: <span class="highlight">${data.attempt || 1} מתוך 3</span>
            </p>
            <p style="margin: 10px 0 0; text-align: center; font-size: 14px;">
                אם התשלום לא יתבצע תוך 72 שעות, המנוי שלך יבוטל.
            </p>
        </div>
        
        <center>
            <a href="${data.billingPortalUrl || 'https://kosmoi.site/billing'}" class="cta">עדכון פרטי תשלום →</a>
        </center>
        
        <p style="text-align: center; font-size: 14px; color: #64748B;">
            אם זו טעות או שיש לך שאלות, פנה אלינו ונעזור! 💜
        </p>
        
        <div class="footer">
            <p style="color: #64748B; font-size: 12px;">Kosmoi - The City OS for Koh Samui</p>
        </div>
    </div>
</body>
</html>
        `
    })
};

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY');
        }

        const body = await req.json();
        const { to, subject, html, from, template, data } = body;

        // Determine email content
        let emailSubject = subject;
        let emailHtml = html;

        // If template is specified, use it
        if (template && TEMPLATES[template]) {
            const templateResult = TEMPLATES[template](data || {});
            emailSubject = templateResult.subject;
            emailHtml = templateResult.html;
        }

        if (!emailSubject || !emailHtml) {
            throw new Error('Missing subject or html content');
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: from || 'Kosmoi <noreply@kosmoi.site>',
                to: Array.isArray(to) ? to : [to],
                subject: emailSubject,
                html: emailHtml,
            }),
        });

        const responseData = await res.json();

        if (!res.ok) {
            console.error('Resend API Error:', responseData);
            return new Response(JSON.stringify(responseData), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Log email sent for analytics
        console.log(`Email sent: ${emailSubject} to ${to}`);

        return new Response(JSON.stringify({
            success: true,
            id: responseData.id,
            template: template || 'custom'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Send Email Error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
