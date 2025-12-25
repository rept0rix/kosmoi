import React from "react";
import { Badge } from "@/components/ui/badge";
import { subCategoriesBySuperCategory, getSubCategoryLabel } from "./subCategories";

export default function SubCategorySelector({ superCategory, selectedSubCategory, onSelectSubCategory, language = 'he', compact = false, limit, onViewMore }) {
  if (!superCategory || superCategory === 'all') return null;

  const subCategories = subCategoriesBySuperCategory[superCategory] || [];

  if (subCategories.length === 0) return null;

  const visibleCategories = limit ? subCategories.slice(0, limit) : subCategories;
  const remainingCount = subCategories.length - visibleCategories.length;

  return (
    <div className={`space-y-2 ${compact ? 'min-w-0' : ''}`}>
      <div className={`flex gap-2 ${compact ? 'flex-nowrap' : 'flex-wrap justify-center'}`}>
        {visibleCategories.map((subCat) => (
          <Badge
            key={subCat}
            onClick={() => onSelectSubCategory(subCat)}
            className={`cursor-pointer transition-all text-xs py-1 px-3 rounded-full ${selectedSubCategory === subCat
              ? "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-blue-300"
              }`}
          >
            {getSubCategoryLabel(subCat, language).includes('_')
              ? getSubCategoryLabel(subCat, language).split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              : getSubCategoryLabel(subCat, language)}
          </Badge>
        ))}
        {limit && remainingCount > 0 && (
          <Badge
            onClick={onViewMore}
            className="cursor-pointer transition-all text-xs py-1 px-3 rounded-full bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 hover:border-slate-400"
          >
            +{remainingCount} {language === 'he' ? 'נוספים' : 'More'}
          </Badge>
        )}
      </div>
    </div>
  );
}