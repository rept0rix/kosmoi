import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import VendorSignup from './VendorSignup'
import { BrowserRouter } from 'react-router-dom'

// Mock the API client
// Note: We need to mock the MODULE path.
// The component imports: import { db } from '../api/supabaseClient';
// So we mock '../api/supabaseClient' relative to the test file (which is in src/pages).
vi.mock('../api/supabaseClient', () => ({
    db: {
        entities: {
            ServiceProvider: {
                create: vi.fn()
            }
        }
    }
}))

// We need to import the mocked object to spy on it
import { db } from '../api/supabaseClient'

const renderWithRouter = (ui) => {
    return render(ui, { wrapper: BrowserRouter })
}

describe('VendorSignup Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Mock successful response by default
        // @ts-ignore
        db.entities.ServiceProvider.create.mockResolvedValue({ data: { id: 1 }, error: null })
    })

    it('renders signup form', () => {
        renderWithRouter(<VendorSignup />)
        expect(screen.getByText(/Partner with Kosmoi/i)).toBeInTheDocument()
        // Check for h1
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('submits form with valid data', async () => {
        const user = userEvent.setup()
        const { container } = renderWithRouter(<VendorSignup />)

        const businessNameInput = container.querySelector('input[name="business_name"]')
        const descriptionInput = container.querySelector('textarea[name="description"]')
        const locationInput = container.querySelector('input[name="location"]')
        const ownerInput = container.querySelector('input[name="owner_name"]')

        await user.type(businessNameInput, 'My Great Restaurant')
        await user.type(descriptionInput, 'Best pad thai')
        await user.type(locationInput, 'Chaweng Beach')
        await user.type(ownerInput, 'Mr. Chef')

        // Submit
        const submitButton = container.querySelector('button[type="submit"]') || container.querySelector('button')

        await user.click(submitButton)

        // Verify API called
        await waitFor(() => {
            expect(db.entities.ServiceProvider.create).toHaveBeenCalledWith(expect.objectContaining({
                business_name: 'My Great Restaurant',
                description: 'Best pad thai',
                location: 'Chaweng Beach',
                owner_name: 'Mr. Chef'
            }))
        })

        // Verify success message
        expect(await screen.findByText(/בקשתך התקבלה/i)).toBeInTheDocument()
    })
})
