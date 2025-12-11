import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import MapProviderCard from './MapProviderCard'
import { BrowserRouter } from 'react-router-dom'

// Mock sub-components/hooks
vi.mock('@/components/ui/card', () => ({
    Card: ({ children }) => <div>{children}</div>,
    CardContent: ({ children }) => <div>{children}</div>
}))

const mockProvider = {
    id: '456',
    business_name: 'Map Test Business',
    category: 'taxi',
    average_rating: 4.8,
    phone: '0812345678',
    whatsapp: '0812345678',
    latitude: 9.5,
    longitude: 100.0,
    description: 'A test taxi service'
}

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter })
}

describe('MapProviderCard', () => {
    it('renders provider information correctly', () => {
        // Note: MapProviderCard usually renders inside Google MapOverlay, but testing it purely as React component
        renderWithRouter(<MapProviderCard provider={mockProvider} onClose={() => { }} />)

        expect(screen.getByText('Map Test Business')).toBeVisible()
        expect(screen.getByText('Taxi')).toBeVisible() // Category label mapping check might be needed if using mapped labels
        expect(screen.getByText('4.8')).toBeVisible()
    })

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup()
        const handleClose = vi.fn()
        renderWithRouter(<MapProviderCard provider={mockProvider} onClose={handleClose} />)

        // Using query selector or accessible name might be tricky if it's just an icon button
        // The button has <X className="..."/> inside.
        // Let's find by role button, it should be the one at top right
        // Actually, there are multiple buttons (Call, WhatsApp, Navigate, Open).
        // The close button is usually the first one or distinct.

        // In MapProviderCard.jsx:
        // <button onClick={onClose} ... ><X ... /></button>
        // It doesn't have an aria-label. It might be hard to select specifically without adding one.
        // However, I can select by the X icon if I mock lucide-react or just rely on class?
        // Let's select by role 'button' and pick the one that doesn't have text or has specific class.

        // Better strategy: Since I am iterating fast, I will rely on the fact it's likely the first button in DOM order or look for one with no text content but with svg.

        const buttons = screen.getAllByRole('button')
        // The close button is first in the JSX
        const closeButton = buttons[0]

        await user.click(closeButton)

        expect(handleClose).toHaveBeenCalledTimes(1)
    })
})
