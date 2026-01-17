import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Send, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/shared/lib/utils";

const countryCodes = [
    { code: '+66', country: 'TH', label: 'Thailand (+66)' },
    { code: '+972', country: 'IL', label: 'Israel (+972)' },
    { code: '+1', country: 'US', label: 'USA (+1)' },
    { code: '+44', country: 'UK', label: 'UK (+44)' },
    { code: '+7', country: 'RU', label: 'Russia (+7)' },
    { code: '+33', country: 'FR', label: 'France (+33)' },
    { code: '+49', country: 'DE', label: 'Germany (+49)' },
];

export function PhoneVerification({ value, onChange, error }) { // value is assumed to be the full number string or object
    const [countryCode, setCountryCode] = useState('+66');
    const [localNumber, setLocalNumber] = useState('');
    const [verificationState, setVerificationState] = useState('idle'); // idle, sending, sentinel, verified
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState(null);

    // Initialize from value if present
    useEffect(() => {
        if (value && typeof value === 'string' && value.startsWith('+')) {
            // Simple parsing logic (could be improved with libphonenumber)
            const matchedCode = countryCodes.find(c => value.startsWith(c.code));
            if (matchedCode) {
                setCountryCode(matchedCode.code);
                setLocalNumber(value.slice(matchedCode.code.length));
            } else {
                setLocalNumber(value);
            }
        }
    }, [value]);

    const handleSendCode = () => {
        if (!localNumber) return;
        setVerificationState('sending');

        // Simulate API call
        setTimeout(() => {
            setGeneratedOtp('123456'); // Mock OTP
            setVerificationState('sentinel');
            // In a real app, we would trigger the SMS here
        }, 1500);
    };

    const handleVerify = () => {
        if (otp === '123456') {
            setVerificationState('verified');
            // Notify parent of full verified number
            onChange(`${countryCode}${localNumber}`);
        } else {
            // error state handling could go here
            alert("Invalid Code (Hint: use 123456)");
        }
    };

    const isVerified = verificationState === 'verified';

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Select
                    disabled={isVerified}
                    value={countryCode}
                    onValueChange={setCountryCode}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                        {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                <span className="flex items-center gap-2">
                                    <span className="font-mono">{c.code}</span>
                                    <span className="text-muted-foreground text-xs">{c.country}</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative flex-1">
                    <Input
                        disabled={isVerified}
                        type="tel"
                        placeholder="Mobile Number"
                        value={localNumber}
                        onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ''))} // Numbers only
                        className={cn(
                            "pr-10 font-mono tracking-wide",
                            error && "border-red-500",
                            isVerified && "border-green-500 bg-green-50 text-green-700"
                        )}
                    />
                    {isVerified && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                    )}
                </div>
            </div>

            {!isVerified && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    {verificationState === 'idle' && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={handleSendCode}
                            disabled={!localNumber || localNumber.length < 8}
                        >
                            <Smartphone className="w-4 h-4 mr-2" />
                            Verify Number
                        </Button>
                    )}

                    {verificationState === 'sending' && (
                        <Button disabled variant="outline" size="sm" className="w-full">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending Code...
                        </Button>
                    )}

                    {verificationState === 'sentinel' && (
                        <div className="flex w-full gap-2">
                            <Input
                                placeholder="Enter Code (123456)"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="text-center tracking-widest font-mono"
                            />
                            <Button type="button" onClick={handleVerify}>
                                Confirm
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    );
}
