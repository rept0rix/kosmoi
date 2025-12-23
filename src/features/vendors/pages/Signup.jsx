
import React, { useState } from 'react';
import { db, supabase } from "@/api/supabaseClient";
import { useNavigate } from 'react-router-dom';
import { Store, Image as ImageIcon, BadgeCheck, Loader2, Upload, Link as LinkIcon, FileText, Mail, MapPin, User, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function VendorSignup() {
    const navigate = useNavigate();
    const [mode, setMode] = useState('create'); // 'create' | 'claim'

    // Create Form State
    const [formData, setFormData] = useState({
        business_name: '',
        category: 'Restaurant',
        description: '',
        location: '',
        contact_info: '',
        owner_name: '',

        email: ''
    });

    // Claim Form State
    const [claimSearch, setClaimSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    // Verification State
    const [verificationMethod, setVerificationMethod] = useState('document'); // 'document' | 'social' | 'email'
    const [claimerName, setClaimerName] = useState('');
    const [claimerContact, setClaimerContact] = useState('');
    const [verificationProof, setVerificationProof] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);

    // --- Create Logic ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Sign up / Verify via OTP (Magic Link)
            // We store the business data in user_metadata so we can pick it up after they click the email link
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/complete-signup`,
                    data: {
                        business_name: formData.business_name,
                        category: formData.category,
                        description: formData.description,
                        location: formData.location,
                        owner_name: formData.owner_name,
                        contact_info: formData.contact_info || formData.email,
                        signup_step: 'pending_password'
                    }
                }
            });

            if (error) throw error;

            // 2. Show Verification Message
            setIsWaitingForVerification(true);
            setSuccess(true);

        } catch (error) {
            console.error("Signup failed:", error);
            alert(`Failed to submit application: ${error.message} `);
        } finally {
            setLoading(false);
        }
    };

    // --- Claim Logic ---
    const handleSearch = async () => {
        if (!claimSearch) return;
        setLoading(true);
        const { data, error } = await supabase.from('service_providers')
            .select('id, business_name, location, category')
            .ilike('business_name', `% ${claimSearch}% `) // Corrected logic
            .limit(5);

        if (data) setSearchResults(data);
        setLoading(false);
    };

    const handleClaimSubmit = async () => {
        if (!selectedBusiness || !claimerName || !claimerContact) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('business_claims').insert({
                business_id: selectedBusiness.id,
                claimer_name: claimerName,
                claimer_contact: claimerContact,
                verification_method: verificationMethod,
                verification_proof: verificationProof
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            alert("Claim request failed.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500 border border-slate-200 dark:border-slate-700">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
                        <BadgeCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        {isWaitingForVerification
                            ? 'נרשמת בהצלחה!'
                            : (mode === 'create' ? 'בקשתך התקבלה!' : 'בקשת הבעלות נשלחה!')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        {isWaitingForVerification
                            ? 'שלחנו לך מייל לאימות החשבון. אנא לחץ על הלינק במייל כדי להשלים את ההרשמה ולהקים את העסק.'
                            : (mode === 'create'
                                ? 'אחד מסוכני ה-AI שלנו יבדוק את העסק שלך ויוסיף אותו למאגר.'
                                : 'כדי לאמת שאתה הבעלים, נציג (או בוט) ייצור איתך קשר במספר המופיע במאגר.')}
                        <br />
                        תודה שבחרת ב-Kosmoi Hub.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 h-12 text-lg rounded-xl">
                        חזרה למסך הראשי
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 mb-4">
                        <span className="font-bold text-white text-xl">K</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Partner with Kosmoi
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        פלטפורמת ה-AI שצומחת איתך. נהל את העסק שלך חכם יותר.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800">
                        <button
                            className={`flex - 1 py - 4 text - center font - medium text - sm transition - all focus: outline - none ${mode === 'create' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'} `}
                            onClick={() => setMode('create')}
                        >
                            <Store className="inline-block w-4 h-4 mb-0.5 ml-2" />
                            רשום עסק חדש
                        </button>
                        <button
                            className={`flex - 1 py - 4 text - center font - medium text - sm transition - all focus: outline - none ${mode === 'claim' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'} `}
                            onClick={() => setMode('claim')}
                        >
                            <BadgeCheck className="inline-block w-4 h-4 mb-0.5 ml-2" />
                            תבוע בעלות על עסק קיים
                        </button>
                    </div>

                    <div className="p-8">
                        {mode === 'create' ? (
                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">שם העסק</label>
                                        <input
                                            type="text"
                                            name="business_name"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="לדוגמה: קפה בוקר טוב"
                                            value={formData.business_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">קטגוריה</label>
                                        <div className="relative">
                                            <select
                                                name="category"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                                value={formData.category}
                                                onChange={handleChange}
                                            >
                                                <option value="Restaurant">מסעדה / Restaurant</option>
                                                <option value="Activity">אטרקציה / Activity</option>
                                                <option value="Service">שירותים / Services</option>
                                                <option value="Hotel">מלון / Hotel</option>
                                                <option value="Transport">תחבורה / Transport</option>
                                            </select>
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">תיאור העסק</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                        placeholder="ספר לנו בכמה מילים על המפעל שלך, מה עושה אותו מיוחד?"
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">מיקום</label>
                                        <div className="relative">
                                            <MapPin className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="location"
                                                required
                                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                placeholder="כתובת או אזור"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">שם בעל העסק</label>
                                        <div className="relative">
                                            <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="owner_name"
                                                className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                placeholder="השם המלא שלך"
                                                value={formData.owner_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">אימייל</label>
                                    <div className="relative">
                                        <Mail className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            placeholder="your@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                {/* Password field removed - set via CompleteSignup */}


                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-6 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg transition-all rounded-xl mt-4"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-5 w-5" />
                                            מעבד בקשה...
                                        </span>
                                    ) : (
                                        'הגש בקשה להצטרפות'
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* STEP 1: SEARCH */}
                                <div className="space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg shrink-0">
                                            <BadgeCheck className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-blue-900 dark:text-blue-100">איתור עסקים מהיר</h3>
                                            <p className="text-sm text-blue-700 dark:text-blue-300/80 mt-1">חפש את העסק שלך במאגר שלנו כדי לקצר את תהליך ההרשמה ולאמת בעלות.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 relative">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="הקלד שם עסק לחיפוש..."
                                            value={claimSearch}
                                            onChange={(e) => setClaimSearch(e.target.value)}
                                        />
                                        <Button onClick={handleSearch} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 h-auto px-6 rounded-xl font-medium">
                                            חפש
                                        </Button>
                                    </div>
                                </div>

                                {/* RESULTS */}
                                {searchResults.length > 0 && !selectedBusiness && (
                                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                        {searchResults.map((biz) => (
                                            <div
                                                key={biz.id}
                                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                                                onClick={() => setSelectedBusiness(biz)}
                                            >
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{biz.business_name}</div>
                                                    <div className="text-sm text-slate-400">{biz.category} • {biz.location}</div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* STEP 2: VERIFICATION */}
                                {selectedBusiness && (
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">

                                        {/* Selected Business Header */}
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedBusiness(null)} className="text-slate-400 hover:text-red-500">
                                                בטל בחירה
                                            </Button>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">עסק נבחר לאימות</div>
                                                <div className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 justify-end">
                                                    {selectedBusiness.business_name}
                                                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity Form */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-slate-900 dark:text-white text-right flex items-center justify-end gap-2">
                                                פרטים אישיים
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center text-slate-500">1</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="טלפון ליצירת קשר"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                    value={claimerContact}
                                                    onChange={(e) => setClaimerContact(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="שם מלא"
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                    value={claimerName}
                                                    onChange={(e) => setClaimerName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Verification Method Selector */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-slate-900 dark:text-white text-right flex items-center justify-end gap-2">
                                                שיטת אימות
                                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs flex items-center justify-center text-slate-500">2</span>
                                            </h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'document', label: 'מסמך רשמי', icon: FileText },
                                                    { id: 'social', label: 'מדיה חברתית', icon: LinkIcon },
                                                    { id: 'email', label: 'דוא״ל עסקי', icon: Mail }
                                                ].map((method) => (
                                                    <button
                                                        key={method.id}
                                                        onClick={() => setVerificationMethod(method.id)}
                                                        className={`p - 4 rounded - xl border text - sm font - medium flex flex - col items - center gap - 3 transition - all ${verificationMethod === method.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'} `}
                                                    >
                                                        <method.icon className={`w - 6 h - 6 ${verificationMethod === method.id ? 'text-blue-600' : 'text-slate-400'} `} />
                                                        {method.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dynamic Input based on Method */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                                            {verificationMethod === 'document' && (
                                                <div className="text-center space-y-4">
                                                    <p className="text-sm text-slate-500">אנא צרף צילום של רישיון עסק, חשבונית ארנונה או תעודה מזהה של בעל העסק.</p>
                                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer group relative">
                                                        <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                                                        <span className="block text-sm font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">לחץ להעלאת קובץ (או גרור לכאן)</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            id="file-upload"
                                                            onChange={(e) => setVerificationProof(e.target.files[0]?.name)}
                                                        />
                                                        <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
                                                    </div>
                                                    {verificationProof && (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-100">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            {verificationProof}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {verificationMethod === 'social' && (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-slate-500 text-right">אנא צרף קישור לעמוד העסקי (פייסבוק/אינסטגרם) שבו אתה מוגדר כמנהל.</p>
                                                    <input
                                                        type="url"
                                                        placeholder="https://facebook.com/..."
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                        value={verificationProof}
                                                        onChange={(e) => setVerificationProof(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            {verificationMethod === 'email' && (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-slate-500 text-right">נשלח קוד אימות לכתובת הדוא״ל המופיעה באתר הרשמי של העסק.</p>
                                                    <input
                                                        type="email"
                                                        placeholder="כתובת הדוא״ל העסקית שלך"
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                                        value={verificationProof}
                                                        onChange={(e) => setVerificationProof(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleClaimSubmit}
                                            className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all rounded-xl mt-4"
                                            disabled={loading || !claimerName || !claimerContact}
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin h-5 w-5" />
                                                    שולח בקשה...
                                                </span>
                                            ) : (
                                                'שלח בקשת בעלות לאימות'
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}

function CheckCircle2(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
