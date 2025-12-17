
import { realSupabase as db } from '../../api/supabaseClient.js';

export const WORKFLOWS = {
    QUICK_FIX: {
        id: 'quick_fix',
        name: '⚡️ Quick Fix',
        description: 'Fast track for bugs and minor tweaks.',
        steps: [
            { role: 'user', label: 'Request' },
            { role: 'tech-lead', label: 'Code & Fix' },
            { role: 'qa', label: 'Verify' }
        ]
    },
    FEATURE_BUILD: {
        id: 'feature_build',
        name: '📋 Feature Build',
        description: 'Standard flow for new features.',
        steps: [
            { role: 'user', label: 'Request' },
            { role: 'product-manager', label: 'Spec & Requirements' },
            { role: 'ux', label: 'Design Review' },
            { role: 'tech-lead', label: 'Implementation' },
            { role: 'qa', label: 'Testing' }
        ]
    },
    STRATEGIC_PIVOT: {
        id: 'strategic_pivot',
        name: '🏢 Strategic Pivot',
        description: 'High-level strategy and planning.',
        steps: [
            { role: 'user', label: 'Vision' },
            { role: 'board-chairman', label: 'Orchestration' },
            { role: 'marketing-intelligence', label: 'Market Analysis' },
            { role: 'product-vision', label: 'Roadmap Update' },
            { role: 'ceo', label: 'Execution Plan' }
        ]
    },
    ONE_DOLLAR_CHALLENGE: {
        id: 'one_dollar_challenge',
        name: '💸 The One Dollar Challenge',
        description: 'Autonomous Revenue Generation Protocol',
        steps: [
            { role: 'ceo', label: 'Ideation: Invent a $1 Product' },
            { role: 'tech-lead', label: 'Infrastructure: Create Stripe Link' },
            { role: 'sales-pitch', label: 'Execution: Send Sales Email' },
            { role: 'qa', label: 'Verification: Confirm Payment' }
        ]
    },
    GENERATE_LEADS: {
        id: 'generate_leads',
        name: '🤖 CRM Population Protocol',
        description: 'Autonomous Lead Generation & Qualification',
        steps: [
            { role: 'sales-pitch', label: 'Prospecting: Find Leads' },
            { role: 'sales-pitch', label: 'Data Entry: Create CRM Records' },
            { role: 'sales-pitch', label: 'Outreach: Draft Initial Emails' }
        ]
    }
};

export class WorkflowService {
    constructor() {
        this.activeWorkflow = null;
        this.currentStepIndex = 0;
        this.context = {};
    }

    startWorkflow(workflowId, initialContext = {}) {
        const workflow = Object.values(WORKFLOWS).find(w => w.id === workflowId);
        if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

        this.activeWorkflow = workflow;
        this.currentStepIndex = 0; // 0 is usually User, so we might auto-advance to 1
        this.context = initialContext;

        return this.getState();
    }

    async saveWorkflow(name, nodes, edges, id = null) {
        // Import transformer dynamically
        const { WorkflowTransformer } = await import('./WorkflowSchema');
        const executable = WorkflowTransformer.toLinearWorkflow(nodes, edges);
        executable.name = name;

        const payload = {
            name: name,
            graph_data: { nodes, edges },
            workflow_schema: executable,
            deployment_status: 'draft', // Always save as draft first
            updated_at: new Date().toISOString()
        };

        let result;
        if (id) {
            // Update existing
            const { data, error } = await db.from('workflows')
                .update(payload)
                .eq('id', id)
                .select();
            if (error) throw error;
            result = data[0];
        } else {
            // Insert new
            const { data, error } = await db.from('workflows').insert([payload]).select();
            if (error) throw error;
            result = data[0];
        }
        return result;
    }

    async publishWorkflow(id) {
        const { data: current } = await db.from('workflows').select('version').eq('id', id).single();
        const nextVersion = (current?.version || 0) + 1;

        const { data, error } = await db.from('workflows')
            .update({
                deployment_status: 'published',
                published_at: new Date().toISOString(),
                version: nextVersion
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    }

    async listWorkflows() {
        const { data, error } = await db.from('workflows')
            .select('id, name, created_at, deployment_status, version')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    async loadWorkflow(id) {
        const { data, error } = await db.from('workflows').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    }

    startCustomWorkflow(customWorkflowJson, initialContext = {}) {
        if (!customWorkflowJson || !customWorkflowJson.steps) {
            throw new Error("Invalid custom workflow JSON");
        }

        this.activeWorkflow = customWorkflowJson;
        this.currentStepIndex = 0;
        this.context = initialContext;

        console.log("[WorkflowService] Started Custom Workflow:", this.activeWorkflow.name);
        return this.getState();
    }

    nextStep() {
        if (!this.activeWorkflow) return null;

        if (this.currentStepIndex < this.activeWorkflow.steps.length - 1) {
            this.currentStepIndex++;
            return this.getState();
        } else {
            this.completeWorkflow();
            return null;
        }
    }

    getState() {
        if (!this.activeWorkflow) return null;
        return {
            workflow: this.activeWorkflow,
            currentStep: this.activeWorkflow.steps[this.currentStepIndex],
            progress: (this.currentStepIndex / this.activeWorkflow.steps.length) * 100,
            isComplete: false
        };
    }

    completeWorkflow() {
        this.activeWorkflow = null;
        this.currentStepIndex = 0;
        this.context = {};
    }
}

export const workflowService = new WorkflowService();
