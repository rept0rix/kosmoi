import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { SalesService } from '@/services/SalesService';
import { toast } from "@/components/ui/use-toast";

const LeadCaptureForm = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        platform: 'website',
        interest: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlatformChange = (value) => {
        setFormData({ ...formData, platform: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.contact) {
            toast({ title: "Missing Information", description: "Please provide your name and contact info.", variant: "destructive" });
            return;
        }

        try {
            setIsLoading(true);

            // Create payload for SalesService
            // Status 'new' triggers the Automation Engine
            const leadPayload = {
                name: formData.name,
                status: 'new',
                platform: formData.platform,
                interest: formData.interest || "General Inquiry from Website",
                last_contact: new Date().toISOString()
            };

            await SalesService.createLead(leadPayload);

            setIsSubmitted(true);
            toast({
                title: "Message Sent!",
                description: "Our AI Concierge will reach out to you shortly.",
                className: "bg-green-50 border-green-200 text-green-800"
            });

        } catch (error) {
            console.error("Lead Capture Error:", error);
            toast({ title: "Error", description: "Could not send message. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-md mx-auto shadow-lg border-green-100 bg-green-50/50">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Send className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-green-800">Request Received!</h3>
                        <p className="text-green-700 mt-2">
                            Thanks, {formData.name}. Our AI agent has received your request and is already drafting a response.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="mt-4 border-green-200 text-green-700 hover:bg-green-100"
                        onClick={() => {
                            setIsSubmitted(false);
                            setFormData({ name: '', contact: '', platform: 'website', interest: '' });
                        }}
                    >
                        Send Another Request
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl border-slate-200 bg-white/95 backdrop-blur">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Talk to our AI Concierge
                </CardTitle>
                <CardDescription className="text-center text-slate-500">
                    Tell us what you need in Koh Samui.
                    <br />Our agents are standing by 24/7.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact">Email or Phone</Label>
                        <Input
                            id="contact"
                            name="contact"
                            placeholder="john@example.com"
                            value={formData.contact}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="platform">Preferred Contact Method</Label>
                        <Select value={formData.platform} onValueChange={handlePlatformChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="website">Email</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="interest">How can we help?</Label>
                        <Textarea
                            id="interest"
                            name="interest"
                            placeholder="I'm looking for a villa... I need a boat rental..."
                            value={formData.interest}
                            onChange={handleChange}
                            className="h-24"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all text-white font-medium shadow-md hover:shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting to Agent...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Start Request
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default LeadCaptureForm;
