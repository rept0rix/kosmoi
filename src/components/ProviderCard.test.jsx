import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import ProviderCard from './ProviderCard'
import { BrowserRouter } from 'react-router-dom'

// Mock sub-components/hooks that might cause issues or aren't focus of unit test
vi.mock('@/components/AuthGate', () => ({
    default: ({ children }) => <div>{children}</div>
}))

vi.mock('@/components/LanguageContext', () => ({
    useLanguage: () => ({ language: 'en' })
}))

const mockProvider = {
    id: '123',
    business_name: 'Test Business',
    category: 'plumber',
    contact_name: 'John Doe',
    average_rating: 4.5,
    total_reviews: 10,
    phone: '0812345678',
    verified: true,
    images: ['https://example.com/image.jpg'],
    location: 'Chaweng'
}

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter })
}

describe('ProviderCard', () => {
    it('renders provider information correctly', () => {
        renderWithRouter(<ProviderCard provider={mockProvider} onCall={() => { }} />)

        expect(screen.getByText('Test Business')).toBeVisible()
        expect(screen.getByText('John Doe', { exact: false })).toBeVisible() // "Contact: John Doe"
        expect(screen.getByText('4.5')).toBeVisible()
        expect(screen.getByText('(10)')).toBeVisible()
        expect(screen.getByText('Verified')).toBeVisible() // Verified badge
    })

    it('calls onCall when call button is clicked', async () => {
        const user = userEvent.setup()
        const handleCall = vi.fn()
        renderWithRouter(<ProviderCard provider={mockProvider} onCall={handleCall} />)

        const callButton = screen.getByText('Call')
        await user.click(callButton)

        expect(handleCall).toHaveBeenCalledTimes(1)
        expect(handleCall).toHaveBeenCalledWith('0812345678')
    })
})
