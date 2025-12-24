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
    { id: "get_service", name: t("get_service"), icon: Briefcase, color: "bg-indigo-100 text-indigo-600" },
    { id: "get_info", name: t("get_info"), icon: Info, color: "bg-yellow-100 text-yellow-600" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 py-4">
      {superCategories.map((category) => {
        const isSelected = selectedCategory === category.id;
        return (
          <button
            key={category.id}
            className={`flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            onClick={() => onSelect(category.id)}
          >
            <div className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center shadow-sm ${isSelected ? 'ring-4 ring-blue-500 shadow-md' : ''
              }`}>
              <category.icon className="w-8 h-8" />
            </div>
            <p className={`text-sm font-medium ${isSelected ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
              {category.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}