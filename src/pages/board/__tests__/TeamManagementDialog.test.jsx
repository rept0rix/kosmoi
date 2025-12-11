import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamManagementDialog from '../TeamManagementDialog';
import { describe, it, expect, vi } from 'vitest';

const mockAgents = [
    { id: 'ceo-agent', role: 'CEO', name: 'Chief', layer: 'executive' },
    { id: 'tech-lead-agent', role: 'Tech Lead', name: 'Dev', layer: 'board' },
    { id: 'qa-agent', role: 'QA', name: 'Tester', layer: 'operational' }
];

describe('TeamManagementDialog', () => {
    it('renders correctly when open', () => {
        render(
            <TeamManagementDialog
                open={true}
                onOpenChange={vi.fn()}
                agents={mockAgents}
                selectedAgentIds={['ceo-agent']}
                onToggleAgent={vi.fn()}
            />
        );

        expect(screen.getByText('Manage Team')).toBeInTheDocument();
        expect(screen.getByText('CEO')).toBeInTheDocument();
        expect(screen.getByText('Tech Lead')).toBeInTheDocument();
    });

    it('displays search input', () => {
        render(
            <TeamManagementDialog
                open={true}
                onOpenChange={vi.fn()}
                onToggleAgent={vi.fn()}
                agents={mockAgents}
            />
        );
        expect(screen.getByPlaceholderText(/Search agents.../i)).toBeInTheDocument();
    });

    it('filters agents by search query', () => {
        render(
            <TeamManagementDialog
                open={true}
                onOpenChange={vi.fn()}
                onToggleAgent={vi.fn()}
                agents={mockAgents}
            />
        );

        const input = screen.getByPlaceholderText(/Search agents.../i);
        fireEvent.change(input, { target: { value: 'Tech' } });

        expect(screen.getByText('Tech Lead')).toBeInTheDocument();
        expect(screen.queryByText('QA')).not.toBeInTheDocument();
    });

    it('calls onToggleAgent when clicking an agent', () => {
        const onToggle = vi.fn();
        render(
            <TeamManagementDialog
                open={true}
                onOpenChange={vi.fn()}
                agents={mockAgents}
                selectedAgentIds={[]}
                onToggleAgent={onToggle}
            />
        );

        const agentRow = screen.getByText('CEO').closest('div').parentElement;
        // The parent div has the onClick handler
        fireEvent.click(agentRow);

        expect(onToggle).toHaveBeenCalledWith('ceo-agent');
    });
});
