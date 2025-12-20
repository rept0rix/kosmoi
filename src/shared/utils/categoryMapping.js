import { subCategoriesBySuperCategory } from '@/components/subCategories';

/**
 * Determines the super category for a given sub-category.
 * @param {string} category - The sub-category to find the parent for.
 * @returns {string} The super category key, or 'other' if not found.
 */
export const getSuperCategory = (category) => {
    for (const [superCat, subCats] of Object.entries(subCategoriesBySuperCategory)) {
        if (subCats.includes(category)) return superCat;
    }
    return 'other';
};
