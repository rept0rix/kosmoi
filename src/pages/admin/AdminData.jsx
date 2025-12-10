import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import { StripeService } from '../../services/StripeService';
import BusinessTable from '../../components/admin/BusinessTable';
import { toast } from "@/components/ui/use-toast"; // Assuming toast exists, otherwise use alert

export default function AdminData() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadBusinesses = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getBusinesses();
            setBusinesses(data);
        } catch (e) {
            console.error("Businesses Load Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBusinesses();
    }, []);

    const handleAction = async (type, biz) => {
        if (type === 'verify') {
            await AdminService.toggleBusinessVerification(biz.id);
            await loadBusinesses();
        }
        if (type === 'send_invoice') {
            const linkData = await StripeService.createPaymentLink(biz.business_name, 'pro');
            await StripeService.sendInvoice(biz.owner_email, linkData.url);
            alert(`Invoice sent to ${biz.owner_email}\nLink: ${linkData.url}`);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Data & Businesses</h1>
                <p className="text-slate-400">Manage service providers and subscriptions.</p>
            </div>
            <BusinessTable businesses={businesses} onAction={handleAction} />
        </div>
    );
}
