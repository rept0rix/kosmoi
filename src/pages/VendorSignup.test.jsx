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
        auth: {
            signUp: vi.fn()
        },
        entities: {
            ServiceProvider: {
                create: vi.fn()
            },
            Review: { // Also mock Review as it might be used in other tests or init
                filter: vi.fn().mockResolvedValue([])
            }
        },
        integrations: {
            Core: {
                UploadFile: vi.fn()
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
        // @ts-ignore
        db.auth.signUp.mockResolvedValue({ data: { user: { id: 'test-user-id' }, session: { access_token: 'token' } }, error: null })
    })

    it('renders signup form', () => {
        renderWithRouter(<VendorSignup />)
        expect(screen.getByText('Partner with Kosmoi', { exact: false })).toBeVisible()
        // Check for h1
        expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
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

        const emailInput = container.querySelector('input[name="email"]')
        await user.type(emailInput, 'test@example.com')

        const passwordInput = container.querySelector('input[name="password"]')
        await user.type(passwordInput, 'password123')

        // There is no input named 'contact_info' in the JSX form based on view_file! 
        // It seems 'owner_name' is used for contact person.
        // Wait, looking at the code, state has 'contact_info', but JSX only has 'owner_name' input.
        // And 'handleSubmit' sends formData.
        // If 'contact_info' input is missing, it sends empty string.
        // But the test tried to type into it and failed.
        // I will remove typing into contact_info for now, or check if I missed it.
        // The file ends at line 183.
        // We saw 'owner_name' at line 170.
        // There is NO 'contact_info' input in the file provided (lines 100-183).
        // So I should remove contactInput from test.

        // Submit
        const submitButton = container.querySelector('button[type="submit"]') || container.querySelector('button')

        await user.click(submitButton)

        // Verify API called
        await waitFor(() => {
            expect(db.entities.ServiceProvider.create).toHaveBeenCalledWith(expect.objectContaining({
                business_name: 'My Great Restaurant',
                description: 'Best pad thai',
                location: 'Chaweng Beach',
                owner_name: 'Mr. Chef',
                status: 'new_lead'
            }))
        })

        // Verify success message
        expect(await screen.findByText(/בקשתך התקבלה/i)).toBeVisible()
    })
})
