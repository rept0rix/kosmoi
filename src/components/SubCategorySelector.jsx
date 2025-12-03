import React from "react";
import { Badge } from "@/components/ui/badge";
import { subCategoriesBySuperCategory, getSubCategoryLabel } from "./subCategories";

export default function SubCategorySelector({ superCategory, selectedSubCategory, onSelectSubCategory, language = 'he' }) {
  if (!superCategory || superCategory === 'all') return null;
  
  const subCategories = subCategoriesBySuperCategory[superCategory] || [];
  
  if (subCategories.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-center gap-2">
        {subCategories.map((subCat) => (
          <Badge
            key={subCat}
            onClick={() => onSelectSubCategory(subCat)}
            className={`cursor-pointer transition-all text-sm py-2 px-4 rounded-full ${
              selectedSubCategory === subCat
                ? "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-blue-300"
            }`}
          >
            {getSubCategoryLabel(subCat, language)}
          </Badge>
        ))}
      </div>
    </div>
  );
}