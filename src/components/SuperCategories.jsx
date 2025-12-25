import React from "react";
import {
  UtensilsCrossed,
  Wrench,
  ShoppingBag,
  PartyPopper,
  Plane,
  HandHeart,
  Briefcase,
  Info,
  Home
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function SuperCategories({ onSelect, selectedCategory }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const superCategories = [
    { id: "eat", name: t("eat"), icon: UtensilsCrossed, color: "bg-orange-100 text-orange-600" },
    { id: "fix", name: t("fix"), icon: Wrench, color: "bg-blue-100 text-blue-600" },
    { id: "shop", name: t("shop"), icon: ShoppingBag, color: "bg-purple-100 text-purple-600" },
    { id: "enjoy", name: t("enjoy"), icon: PartyPopper, color: "bg-pink-100 text-pink-600" },
    { id: "go_out", name: t("go_out"), icon: Home, color: "bg-green-100 text-green-600" },
    { id: "travel", name: t("travel"), icon: Plane, color: "bg-cyan-100 text-cyan-600" },
    { id: "help", name: t("help"), icon: HandHeart, color: "bg-red-100 text-red-600" },
    { id: "get_service", name: t("all_services"), icon: Briefcase, color: "bg-teal-100 text-teal-600" },
  ];

  const { userProfile, PROFILES } = useUserProfile();

  const categoryOrder = {
    [PROFILES.TOURIST]: ['eat', 'enjoy', 'travel', 'shop', 'go_out', 'get_service', 'fix', 'help'],
    [PROFILES.NOMAD]: ['get_service', 'eat', 'enjoy', 'travel', 'shop', 'go_out', 'fix', 'help'],
    [PROFILES.RESIDENT]: ['fix', 'get_service', 'shop', 'help', 'eat', 'enjoy', 'travel', 'go_out']
  };

  const currentOrder = categoryOrder[userProfile] || categoryOrder[PROFILES.TOURIST];

  const sortedCategories = [...superCategories].sort((a, b) => {
    const indexA = currentOrder.indexOf(a.id);
    const indexB = currentOrder.indexOf(b.id);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <div className="grid grid-cols-4 gap-4 py-4 justify-items-center">
      {sortedCategories.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            className={`flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            onClick={() => onSelect(category.id)}
          >
            <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center shadow-sm ${isSelected ? 'ring-4 ring-blue-500 shadow-md' : ''
              }`}>
              <category.icon className="w-7 h-7" />
            </div>
            <p className={`text-xs font-medium text-center leading-tight ${isSelected ? 'text-blue-400 font-bold' : 'text-gray-100'}`}>
              {category.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}