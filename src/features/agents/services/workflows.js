export const WORKFLOWS = {
    "documentation_package": {
        name: "Full Documentation Package",
        description: "Generates System Map, Screen Docs, PRD, and Onboarding Guide.",
        steps: [
            {
                id: "step_1",
                agentId: "system-mapping-agent",
                instruction: "Map the entire system and save 'system_map.json'.",
                expectedFile: "system_map.json",
                nextStepId: "step_2"
            },
            {
                id: "step_2",
                agentId: "ui-ux-docs-agent",
                instruction: "Read 'system_map.json' and document all screens. Save to 'screens_documentation/'.",
                expectedFile: "screens_index.md", // Simplified check
                nextStepId: "step_3"
            },
            {
                id: "step_3",
                agentId: "requirements-agent",
                instruction: "Read the system map and screen docs. Write the PRD and save 'prd/main_prd.md'.",
                expectedFile: "prd/main_prd.md",
                nextStepId: "step_4"
            },
            {
                id: "step_4",
                agentId: "onboarding-agent",
                instruction: "Create the onboarding guide based on all previous docs. Save 'training_package/guide.md'.",
                expectedFile: "training_package/guide.md",
                nextStepId: "step_5"
            },
            {
                id: "step_5",
                agentId: "consistency-auditor-agent",
                instruction: "Review all generated documents for consistency. Save 'consistency_report.md'.",
                expectedFile: "consistency_report.md",
                nextStepId: "TERMINATE"
            }
        ]
    }
};
