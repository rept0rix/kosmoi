import { describe, it, expect, vi } from 'vitest'
import { getSuperCategory } from './categoryMapping'

// Mock the subCategories dependency
// Note: We are testing the logic in getSuperCategory which IMPORTS subCategoriesBySuperCategory.
// We can either mock the module '@components/subCategories' OR assume it's static data and test against real data.
// Since it's a util relying on a constant config, testing against real data is fine and less brittle than mocking structure.
// However, if we want unit isolation, we should mock. Given it's a mapping util, testing real behavior is valuable.
// Let's test with real data first.

describe('categoryMapping Util', () => {
    it('returns correct super category for known sub-categories', () => {
        expect(getSuperCategory('plumber')).toBe('fix')
        expect(getSuperCategory('thai_food')).toBe('eat')
        expect(getSuperCategory('clothing')).toBe('shop')
        expect(getSuperCategory('massage_spa')).toBe('enjoy')
        expect(getSuperCategory('pubs')).toBe('go_out')
        expect(getSuperCategory('taxis')).toBe('travel')
        expect(getSuperCategory('hospitals')).toBe('help')
        expect(getSuperCategory('visa_agents')).toBe('get_service')
        // Wait, looking at subCategories.jsx:
        // fix: [..., 'laundry', ...]
        // get_service: [..., 'laundry', ...]
        // It appears in 'fix' first in the object definition order (usually).
        // Let's verify exactly which one.
    })

    it('returns "other" for unknown category', () => {
        expect(getSuperCategory('unknown_category_xyz')).toBe('other')
    })

    it('is case sensitive (as per implementation)', () => {
        // "Plumber" vs "plumber"
        // The implementation uses .includes(category), so it is case sensitive.
        expect(getSuperCategory('Plumber')).toBe('other')
    })
})
