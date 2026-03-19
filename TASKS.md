# 📋 TASKS.md — Single Source of Truth
> **עדכון אחרון:** 18 מרץ 2026
> **כלל:** רק קובץ זה מייצג את המצב האמיתי. שאר קבצי המשימות הם ארכיון.

---

## 🔴 עדיפות גבוהה (High Priority)

- [ ] **Soft Launch — Operation One Dollar**: הזמנת קבוצת בעלי עסקים ראשונה ל-"Claim Profile"
- [ ] **ניתוח תוצאות Harvest**: בדוק `scripts/harvest_log.json` — כמה עסקים עודכנו בהצלחה?
- [ ] **Security Audit**: החלף מפתחות חשופים (Google Maps, Telegram)

---

## 🟡 עדיפות בינונית (Medium Priority)

### 🧠 שדרוג מודלים (Brain Transplants)
- [ ] **CEO Agent**: שדרג מ-`gemini-3-pro` ל-`gemini-3-pro-preview`
- [ ] **CTO Agent**: שדרג מ-`gemini-3-pro` ל-`gemini-3-pro-preview`
- [ ] **Tech Lead**: שדרג מ-`gemini-2.0-flash` ל-`gemini-3-flash-preview`
- [ ] **עדכן AGENTS.md** אחרי כל שדרוג

### 💌 מערכת הזמנות (Invitation System)
- [ ] צור תבניות מייל יפות ל-"Claim your business"
- [ ] עקוב אחר Open Rates ו-Click Rates ב-Admin Dashboard

### 📱 Mobile Optimization
- [ ] ודא ש-Pricing ו-Dashboard נראים טוב במובייל

---

## 🟢 עדיפות נמוכה / R&D

- [ ] **AI Receptionist Alpha**: בדוק auto-reply לתוכנית Scale (3500฿)
- [ ] **Analytics Dashboard**: הצג מספרי "Leads" אמיתיים לעסקים
- [ ] **Autonomous Billing**: חיוב אוטומטי וחידוש מינויים
- [ ] **Commission Engine**: לוגיקת 8-15% עמלה על הזמנות

---

## 🧹 ניקוי (Cleanup)
- [ ] מחק קבצי debug ישנים: `diagnose_gemini.js`, `verify_payment_flow.js`, `harvest_samuimap.js`
- [ ] הרץ את הארכיאולוג השבועי ל-audit מלא של `scripts/`

---

## ✅ הושלם לאחרונה (Recently Done)
- [x] Optimizer Agent שודרג ל-`gemini-3-flash-preview`
- [x] End-to-end payment flow אומת
- [x] Admin Dashboard loading תוקן
- [x] Pricing Page עודכנה (Free / 35฿ / 1500฿ / 3500฿)
- [x] AI Chatbot שולב בדפי ספקי שירות
- [x] Worker עם self-tasking loop (`feat(worker): self-tasking loop`)
- [x] Telegram alerts מ-worker
- [x] Railway deployment fixes
- [x] pgvector + embeddings edge function
