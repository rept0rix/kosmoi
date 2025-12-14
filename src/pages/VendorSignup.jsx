
import React, { useState } from 'react';
import { db } from '../api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Store, Image as ImageIcon, BadgeCheck, Loader2, Upload, Link as LinkIcon, FileText, Mail } from 'lucide-react';
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
        owner_name: ''
    });

    // Claim Form State
    const [claimSearch, setClaimSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(null);

    // Verification State
    const [verificationMethod, setVerificationMethod] = useState('document'); // 'document' | 'social' | 'email'
    const [claimerName, setClaimerName] = useState('');
    const [claimerContact, setClaimerContact] = useState('');
    const [verificationProof, setVerificationProof] = useState(''); // URL or File name mock

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // --- Create Logic ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await db.entities.ServiceProvider.create({
                ...formData,
                status: 'new_lead',
                average_rating: 0,
                review_count: 0
            });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            console.error("Signup failed:", error);
            alert("Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };

    // --- Claim Logic ---
    const handleSearch = async () => {
        if (!claimSearch) return;
        setLoading(true);
        // Mock search or real DB search
        const { data, error } = await db.from('service_providers')
            .select('id, business_name, location, category')
            .ilike('business_name', `% ${claimSearch}% `)
            .limit(5);

        if (data) setSearchResults(data);
        setLoading(false);
    };

    const handleClaimSubmit = async () => {
        if (!selectedBusiness || !claimerName || !claimerContact) return;
        setLoading(true);
        try {
            // Submit claim to database
            const { error } = await db.from('business_claims').insert({
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                        <BadgeCheck className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {mode === 'create' ? 'בקשתך התקבלה!' : 'בקשת הבעלות נשלחה!'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                        {mode === 'create'
                            ? 'אחד מסוכני ה-AI שלנו יבדוק את העסק שלך ויוסיף אותו למאגר.'
                            : 'כדי לאמת שאתה הבעלים, נציג (או בוט) ייצור איתך קשר במספר המופיע במאגר.'}
                        <br />
                        תודה שבחרת ב-Kosmoi Hub.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                        חזרה למסך הראשי
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <img src="/kosmoi_logo_blue.svg" alt="Kosmoi" className="h-12 w-auto mx-auto mb-6" />
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
                        Partner with Kosmoi
                    </h1>
                    <p className="text-lg text-gray-600">
                        פלטפורמת ה-AI שדואגת לעסק שלך.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/50">

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex - 1 py - 4 text - center font - medium transition ${mode === 'create' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'} `}
                            onClick={() => setMode('create')}
                        >
                            <Store className="inline-block w-5 h-5 mb-1 ml-2" />
                            רשום עסק חדש
                        </button>
                        <button
                            className={`flex - 1 py - 4 text - center font - medium transition ${mode === 'claim' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'} `}
                            onClick={() => setMode('claim')}
                        >
                            <BadgeCheck className="inline-block w-5 h-5 mb-1 ml-2" />
                            תבוע בעלות על עסק קיים
                        </button>
                    </div>

                    <div className="p-8">
                        {mode === 'create' ? (
                            <form onSubmit={handleCreateSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">שם העסק</label>
                                        <input
                                            type="text"
                                            name="business_name"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50"
                                            placeholder="Coco Tam's"
                                            value={formData.business_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                                        <select
                                            name="category"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50"
                                            value={formData.category}
                                            onChange={handleChange}
                                        >
                                            <option value="Restaurant">מסעדה / Restaurant</option>
                                            <option value="Activity">אטרקציה / Activity</option>
                                            <option value="Service">שירותים / Services</option>
                                            <option value="Hotel">מלון / Hotel</option>
                                            <option value="Transport">תחבורה / Transport</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור העסק</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50"
                                        placeholder="ספר לנו על המקום המיוחד שלך..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">מיקום (אזור / כתובת)</label>
                                        <input
                                            type="text"
                                            name="location"
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50"
                                            placeholder="Fisherman's Village, Bophut"
                                            value={formData.location}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">איש קשר (בשבילנו)</label>
                                        <input
                                            type="text"
                                            name="owner_name"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white/50"
                                            placeholder="שם בעל העסק"
                                            value={formData.owner_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={`w - full py - 6 text - lg bg - gradient - to - r from - blue - 600 to - indigo - 600 hover: from - blue - 700 hover: to - indigo - 700 shadow - lg hover: shadow - xl transition - all transform hover: scale - [1.02]`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-5 w-5" />
                                            Processing...
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
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold text-gray-900">איתור העסק שלך</h3>
                                        <p className="text-sm text-gray-500">חפש את העסק במאגר שלנו כדי להתחיל בתהליך האימות</p>
                                    </div>
                                    <div className="flex gap-2 relative">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-right transition-all outline-none"
                                            placeholder="הקלד שם עסק..."
                                            value={claimSearch}
                                            onChange={(e) => setClaimSearch(e.target.value)}
                                        />
                                        <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-full aspect-square rounded-xl">
                                            חפש
                                        </Button>
                                    </div>
                                </div>

                                {/* RESULTS */}
                                {searchResults.length > 0 && !selectedBusiness && (
                                    <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white shadow-sm overflow-hidden">
                                        {searchResults.map((biz) => (
                                            <div
                                                key={biz.id}
                                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors group"
                                                onClick={() => setSelectedBusiness(biz)}
                                            >
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">{biz.business_name}</div>
                                                    <div className="text-sm text-gray-400">{biz.category} • {biz.location}</div>
                                                </div>
                                                <div className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                    <BadgeCheck className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* STEP 2: VERIFICATION */}
                                {selectedBusiness && (
                                    <div className="bg-white border boundary-blue-100 rounded-xl p-6 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">

                                        {/* Selected Business Header */}
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedBusiness(null)} className="text-gray-400 hover:text-red-500">
                                                החלף עסק
                                            </Button>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">עסק נבחר</div>
                                                <div className="font-bold text-lg text-blue-700 flex items-center gap-2 justify-end">
                                                    {selectedBusiness.business_name}
                                                    <BadgeCheck className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity Form */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-gray-900 text-right">פרטי מבקש הבעלות</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="טלפון ליצירת קשר"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-right bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={claimerContact}
                                                    onChange={(e) => setClaimerContact(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="שם מלא"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-right bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={claimerName}
                                                    onChange={(e) => setClaimerName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Verification Method Selector */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-gray-900 text-right">בחר שיטת אימות</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => setVerificationMethod('document')}
                                                    className={`p - 3 rounded - lg border text - sm font - medium flex flex - col items - center gap - 2 transition - all ${verificationMethod === 'document' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'} `}
                                                >
                                                    <FileText className="w-5 h-5" />
                                                    מסמך רשמי
                                                </button>
                                                <button
                                                    onClick={() => setVerificationMethod('social')}
                                                    className={`p - 3 rounded - lg border text - sm font - medium flex flex - col items - center gap - 2 transition - all ${verificationMethod === 'social' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'} `}
                                                >
                                                    <LinkIcon className="w-5 h-5" />
                                                    מדיה חברתית
                                                </button>
                                                <button
                                                    onClick={() => setVerificationMethod('email')}
                                                    className={`p - 3 rounded - lg border text - sm font - medium flex flex - col items - center gap - 2 transition - all ${verificationMethod === 'email' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'} `}
                                                >
                                                    <Mail className="w-5 h-5" />
                                                    דוא״ל עסקי
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Input based on Method */}
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            {verificationMethod === 'document' && (
                                                <div className="text-center space-y-3">
                                                    <p className="text-sm text-gray-500">אנא צרף צילום של רישיון עסק, חשבונית ארנונה או תעודה מזהה של בעל העסק.</p>
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-white transition-colors cursor-pointer group">
                                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500" />
                                                        <span className="text-sm text-gray-400 group-hover:text-gray-600">לחץ להעלאת קובץ (או גרור לכאן)</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            id="file-upload"
                                                            onChange={(e) => setVerificationProof(e.target.files[0]?.name)}
                                                        />
                                                        <label htmlFor="file-upload" className="absolute inset-0 cursor-pointer"></label>
                                                    </div>
                                                    {verificationProof && <div className="text-sm text-green-600 font-medium">{verificationProof}</div>}
                                                </div>
                                            )}
                                            {verificationMethod === 'social' && (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-500 text-right">אנא צרף קישור לעמוד העסקי (פייסבוק/אינסטגרם) שבו אתה מוגדר כמנהל, או שלח לנו הודעה מהעמוד הזה.</p>
                                                    <input
                                                        type="url"
                                                        placeholder="https://facebook.com/..."
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-right"
                                                        value={verificationProof}
                                                        onChange={(e) => setVerificationProof(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            {verificationMethod === 'email' && (
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-500 text-right">נשלח קוד אימות לכתובת הדוא״ל המופיעה באתר הרשמי של העסק.</p>
                                                    <input
                                                        type="email"
                                                        placeholder="כתובת הדוא״ל העסקית שלך"
                                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-right"
                                                        value={verificationProof}
                                                        onChange={(e) => setVerificationProof(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={handleClaimSubmit}
                                            className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
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
        </div>
    );
}
