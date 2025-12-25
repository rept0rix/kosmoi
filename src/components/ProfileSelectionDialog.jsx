import React from 'react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Palmtree, Laptop, Home, Plane } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProfileSelectionDialog({ open, onOpenChange }) {
    const { setProfile, PROFILES } = useUserProfile();
    const { t } = useTranslation();

    const handleSelect = (profile) => {
        setProfile(profile);
        onOpenChange(false);
    };

    const options = [
        {
            id: PROFILES.TOURIST,
            icon: Palmtree,
            title: t('profiles.tourist.title', 'Tourist'),
            desc: t('profiles.tourist.desc', 'Here for a vacation'),
            color: 'bg-orange-100 text-orange-600 border-orange-200 hover:border-orange-400'
        },
        {
            id: PROFILES.NOMAD,
            icon: Laptop,
            title: t('profiles.nomad.title', 'Digital Nomad'),
            desc: t('profiles.nomad.desc', 'Working & Traveling'),
            color: 'bg-purple-100 text-purple-600 border-purple-200 hover:border-purple-400'
        },
        {
            id: PROFILES.RESIDENT,
            icon: Home,
            title: t('profiles.resident.title', 'Resident'),
            desc: t('profiles.resident.desc', 'Living here long-term'),
            color: 'bg-green-100 text-green-600 border-green-200 hover:border-green-400'
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        {t('profiles.welcome', 'Welcome to Koh Samui')} 🌴
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {t('profiles.what_brings_you', 'What brings you to the island? We\'ll customize your experience.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {options.map((option) => (
                        <Card
                            key={option.id}
                            className={`cursor-pointer transition-all hover:scale-102 hover:shadow-md border-2 ${option.color} bg-opacity-50`}
                            onClick={() => handleSelect(option.id)}
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className={`p-3 rounded-full bg-white shadow-sm`}>
                                    <option.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{option.title}</h3>
                                    <p className="text-sm text-gray-600 font-medium opacity-80">{option.desc}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
