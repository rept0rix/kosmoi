import React, { useState } from 'react';
import { db } from '../api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Store, Image as ImageIcon, BadgeCheck } from 'lucide-react';

export default function VendorSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        business_name: '',
        category: 'Restaurant',
        description: '',
        location: '',
        contact_info: '',
        owner_name: '' // New field for personalization
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insert into Supabase
            // We use a specific status 'new_lead' to trigger our agents later
            const { data, error } = await db.entities.ServiceProvider.create({
                ...formData,
                status: 'new_lead',
                average_rating: 0, // New listing
                review_count: 0
            });

            if (error) throw error;

            setSuccess(true);

            // Optional: Redirect after delay
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (error) {
            console.error("Signup failed:", error);
            alert("Failed to submit application. Please try again.");
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">בקשתך התקבלה!</h2>
                    <p className="text-gray-500 mb-6">
                        אחד מסוכני ה-AI שלנו (כנראה ה-Researcher) יבדוק את העסק שלך ויוסיף אותו למאגר.
                        <br />
                        תודה שבחרת ב-Kosmoi Hub.
                    </p>
                    <button onClick={() => navigate('/')} className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition">
                        חזרה למסך הראשי
                    </button>
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
                        Join Kosmoi Service Hub
                    </h1>
                    <p className="text-lg text-gray-600">
                        הצטרף למהפכת השירות של קוסמוי. תן ל-AI שלנו להביא לך לקוחות.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/50">
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

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
                                    rows="4"
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

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'הגש בקשה להצטרפות'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
