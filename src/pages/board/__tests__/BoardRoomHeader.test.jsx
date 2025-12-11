import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BoardRoomHeader from '../BoardRoomHeader';
import { describe, it, expect, vi } from 'vitest';
import { TooltipProvider } from "@/components/ui/tooltip";

// Context Mocks
vi.mock("@/components/LanguageContext", () => ({
    useLanguage: () => ({ language: 'en' })
}));

describe('BoardRoomHeader', () => {
    const mockMeetings = [
        { id: '1', title: 'Meeting A', created_at: new Date().toISOString(), status: 'active' },
        { id: '2', title: 'Meeting B', created_at: new Date().toISOString(), status: 'active' }
    ];

    const defaultProps = {
        meetings: mockMeetings,
        selectedMeeting: mockMeetings[0],
        setSelectedMeeting: vi.fn(),
        handleCreateMeeting: vi.fn(),
        activeAgentsCount: 3,
        autonomousMode: false,
        setAutonomousMode: vi.fn(),
        selectedAgentIds: ['1', '2', '3'],
        onManageTeam: vi.fn(),
        onOpenMobileMenu: vi.fn(),
        onOpenMobileInfo: vi.fn(),
        localBrainEnabled: false,
        setLocalBrainEnabled: vi.fn(),
        localBrainStatus: { isReady: false, isDownloading: false, loadingText: '' },
        handleStartDailyStandup: vi.fn(),
        handleStartOneDollarChallenge: vi.fn(),
        handleStartWorkflow: vi.fn(),
        workflows: [],
        isRTL: false,
        boardAgents: [],
        agents: [
            { id: '1', name: 'Agent 1', layer: 'board' },
            { id: '2', name: 'Agent 2', layer: 'board' },
            { id: '3', name: 'Agent 3', layer: 'board' }
        ]
    };

    const renderComponent = (props = {}) => {
        return render(
            <TooltipProvider>
                <BoardRoomHeader {...defaultProps} {...props} />
            </TooltipProvider>
        );
    };

    it('renders the selected meeting title in the select trigger', () => {
        renderComponent();
        // The trigger displays placeholder if no value match, or the value?
        // Radix Select trigger usually displays the selected value content.
        // Wait, Radix Select structure is complex. The trigger contains `SelectValue`.
        // If `value` prop is set, it shows text corresponding to that item.
        // Since we are not full mounting Radix Select logic without pointer events etc, 
        // we might just check if "Meeting A" is present in the DOM (it might be hidden in content).
        // Actually, Radix Select renders the selected value text in the trigger.
        expect(screen.getByText('Meeting A')).toBeInTheDocument();
    });

    it('renders the Local Brain toggle correctly (off/Cloud by default)', () => {
        renderComponent();
        expect(screen.getByText(/Cloud AI/i)).toBeInTheDocument();
        expect(screen.queryByText(/Local Brain/i)).not.toBeInTheDocument();
    });

    it('toggles Local Brain when clicked', () => {
        renderComponent();
        const button = screen.getByText(/Cloud AI/i).closest('button');
        fireEvent.click(button);
        expect(defaultProps.setLocalBrainEnabled).toHaveBeenCalledWith(true);
    });

    it('renders Local Brain status when enabled', () => {
        renderComponent({
            localBrainEnabled: true,
            localBrainStatus: { isReady: true }
        });
        expect(screen.getByText(/Local Brain/i)).toBeInTheDocument();
        // Since isReady is true, check for green dot class roughly? 
        // Or just text.
    });

    it('calls handleStartDailyStandup when Daily button clicked', () => {
        renderComponent();
        const dailyBtn = screen.getByText(/Daily/i).closest('button');
        fireEvent.click(dailyBtn);
        expect(defaultProps.handleStartDailyStandup).toHaveBeenCalled();
    });
});
