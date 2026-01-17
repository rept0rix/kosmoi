import React, { useState } from 'react';
import {
    Utensils,
    Wrench,
    ShoppingBag,
    Smile,
    Moon,
    Plane,
    HeartHandshake,
    UserCog,
    Info,
    ChevronRight,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { subCategoriesBySuperCategory, getSubCategoryLabel } from '@/components/subCategories';
import { useLanguage } from '@/components/LanguageContext';

const superCategoryIcons = {
    eat: Utensils,
    fix: Wrench,
    shop: ShoppingBag,
    enjoy: Smile,
    go_out: Moon,
    travel: Plane,
    help: HeartHandshake,
    get_service: UserCog,
    get_info: Info,
};

const superCategoryLabels = {
    eat: "Eat & Drink",
    fix: "Professional Services",
    shop: "Shopping",
    enjoy: "Activities & Fun",
    go_out: "Nightlife",
    travel: "Travel & Stay",
    help: "Community Help",
    get_service: "General Services",
    get_info: "Information",
};

export function CategorySelector({ value, onChange, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSuper, setSelectedSuper] = useState(null);
    const { language } = useLanguage();

    const handleSubSelect = (sub) => {
        onChange(sub);
        setIsOpen(false);
    };

    // Helper to format "beach_club" -> "Beach Club" if translation fails or for fallback
    const formatLabel = (key) => {
        // Try to get translation first
        const label = getSubCategoryLabel(key, language);
        if (label && label !== key) return label;

        // Fallback: replace underscores and capitalize
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const selectedLabel = value ? formatLabel(value) : "Select Category";

    return (
        <div className="space-y-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className={cn(
                            "w-full justify-between text-left font-normal h-12",
                            !value && "text-muted-foreground",
                            error && "border-red-500"
                        )}
                    >
                        {selectedLabel}
                        <ChevronRight className="ml-2 h-4 w-4 opacity-50 rotate-90" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 pb-2 border-b bg-white z-10">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            {selectedSuper ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="-ml-2 px-2"
                                        onClick={() => setSelectedSuper(null)}
                                    >
                                        Back
                                    </Button>
                                    <span className="text-slate-300">/</span>
                                    {superCategoryLabels[selectedSuper]}
                                </div>
                            ) : (
                                "Select a Category"
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6 bg-slate-50/50">
                        {!selectedSuper ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {Object.keys(subCategoriesBySuperCategory).map((superCat) => {
                                    const Icon = superCategoryIcons[superCat] || Info;
                                    return (
                                        <Button
                                            key={superCat}
                                            variant="outline"
                                            className="h-auto aspect-square flex flex-col items-center justify-center gap-3 p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                            onClick={() => setSelectedSuper(superCat)}
                                        >
                                            <div className="p-3 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors">
                                                <Icon className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
                                            </div>
                                            <span className="font-semibold text-slate-700 group-hover:text-blue-700 text-center text-sm">
                                                {superCategoryLabels[superCat]}
                                            </span>
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {subCategoriesBySuperCategory[selectedSuper].map((sub) => (
                                    <Button
                                        key={sub}
                                        variant="ghost"
                                        className={cn(
                                            "justify-start h-auto py-3 px-4 text-left border bg-white hover:bg-blue-50 hover:border-blue-200",
                                            value === sub && "border-blue-500 bg-blue-50"
                                        )}
                                        onClick={() => handleSubSelect(sub)}
                                    >
                                        <span className="flex-1 text-base text-slate-700">
                                            {formatLabel(sub)}
                                        </span>
                                        {value === sub && <Check className="w-4 h-4 text-blue-600 ml-2" />}
                                    </Button>
                                ))}
                                {/* Visual "Other" Option (Non-functional placeholders for now if not in list) */}
                                <Button
                                    variant="ghost"
                                    className="justify-start h-auto py-3 px-4 text-left border border-dashed border-slate-300 bg-transparent hover:bg-slate-50 text-slate-500"
                                    onClick={() => handleSubSelect('other')} // Assuming 'other' is handled
                                >
                                    <span className="flex-1 text-base">Other / Not Listed</span>
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
            {error && <p className="text-sm text-red-500">{error.message}</p>}
        </div>
    );
}
