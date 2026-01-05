import { subCategoriesBySuperCategory } from '@/components/subCategories';

/**
 * Determines the super category for a given sub-category.
 * @param {string} category - The sub-category to find the parent for.
 * @returns {string} The super category key, or 'other' if not found.
 */
export const getSuperCategory = (category) => {
    if (!category) return 'other';
    // Normalize input
    const normalized = category.toLowerCase().trim();

    for (const [superCat, subCats] of Object.entries(subCategoriesBySuperCategory)) {
        if (subCats.includes(normalized)) return superCat;
    }
    return 'other';
};

/**
 * Formats a snake_case category key into a readable label.
 * @param {string} category 
 * @returns {string} e.g. "real_estate" -> "Real Estate"
 */
export const formatCategory = (category) => {
    if (!category) return '';
    return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
