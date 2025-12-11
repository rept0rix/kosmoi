import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('Tabs Component', () => {
    it('renders correctly and switches tabs', async () => {
        const user = userEvent.setup()
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">Content 1</TabsContent>
                <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
        )

        // Check initial state
        expect(screen.getByText('Content 1')).toBeVisible()
        // Content 2 should not be visible (either unmounted or hidden)
        expect(screen.queryByText('Content 2')).not.toBeInTheDocument()

        // Switch tab
        const tab2Trigger = screen.getByText('Tab 2')
        await user.click(tab2Trigger)

        // Check new state
        expect(await screen.findByText('Content 2')).toBeVisible()
        expect(screen.queryByText('Content 1')).not.toBeInTheDocument()
    })

    it('forwards refs correctly', () => {
        const listRef = React.createRef()
        const triggerRef = React.createRef()
        const contentRef = React.createRef()

        render(
            <Tabs defaultValue="tab1">
                <TabsList ref={listRef}>
                    <TabsTrigger value="tab1" ref={triggerRef}>Tab 1</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" ref={contentRef}>Content 1</TabsContent>
            </Tabs>
        )

        expect(listRef.current).toBeInstanceOf(HTMLDivElement)
        expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement)
        expect(contentRef.current).toBeInstanceOf(HTMLDivElement)
    })
})
