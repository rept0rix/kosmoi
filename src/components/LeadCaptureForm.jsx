
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../api/supabaseClient'; // Ensure correct path to your client

// Validation Schema
const leadSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(9, "Valid phone number is required"),
    details: z.string().optional(),
});

export default function LeadCaptureForm({ category, source = 'web', onSuccess }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(leadSchema),
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const [firstName, ...lastNameParts] = data.name.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            const { error } = await supabase
                .from('crm_leads')
                .insert([
                    {
                        first_name: firstName,
                        last_name: lastName,
                        phone: data.phone,
                        notes: data.details,
                        status: 'new',
                        source: source,
                        tags: [category, 'smoke_test']
                    }
                ]);

            if (error) throw error;

            // Analytics: Push to Data Layer
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'generate_lead',
                    conversion_id: 'auto_generated', // Placeholder since we don't have a real ID back easily from insert in some cases, or use data.id if available from select().
                    lead_category: category,
                    lead_source: source
                });
            }

            setIsSuccess(true);
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error("Lead submission error:", err);
            setSubmitError("Failed to submit request. Please try again or call use directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-green-50 p-6 rounded-xl border border-green-200 text-center animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Request Received!</h3>
                <p className="text-green-700">We're finding a provider for you now. Expect a call shortly.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Instant Help</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                    {...register('name')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                    {...register('phone')}
                    type="tel"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="+66..."
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
                <textarea
                    {...register('details')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Current location, type of issue..."
                    rows={3}
                />
            </div>

            {submitError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {submitError}
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Now"}
            </button>

            <p className="text-xs text-gray-400 text-center mt-2">
                Free to request. Pay provider directly.
            </p>
        </form>
    );
}
