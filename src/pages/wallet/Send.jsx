import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send as SendIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletService } from '@/services/WalletService';
import { useToast } from '@/components/ui/use-toast';

export default function Send() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");
            await WalletService.transferFunds(recipientId, parseFloat(amount), note);
            toast({
                title: "Transfer Successful",
                description: `Sent ${amount} THB to recipient.`
            });
            navigate(-1);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Transfer Failed",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <h1 className="text-xl font-bold">Send Money</h1>
                </div>

                <form onSubmit={handleSend} className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Wallet ID</Label>
                        <Input
                            id="recipient"
                            placeholder="UUID or Username"
                            value={recipientId}
                            onChange={e => setRecipientId(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (THB)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                            className="text-2xl font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Input
                            id="note"
                            placeholder="What's this for?"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Now'}
                        <SendIcon className="ml-2 w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
