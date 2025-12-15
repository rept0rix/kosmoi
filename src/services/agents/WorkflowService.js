
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
