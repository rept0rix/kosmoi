---
description: How to perform a Design Overhaul using the agent team
---

# Design Overhaul Workflow

This workflow guides the agents through a complete UI redesign process.

## 1. Analysis & Visualization (Graphic Designer)
- **Role**: `graphic-designer-agent`
- **Action**:
    1.  Analyze the user's request (e.g., "Make it look like a cyberpunk dashboard").
    2.  Use `generate_image` to create a visual reference.
    3.  **CRITICAL**: Output a **Visual Spec** in the following format:
        ```markdown
        # Visual Spec: [Component Name]
        ## Color Palette
        - Primary: #HEX
        - Background: #HEX
        ## Typography
        - Font: [Name]
        ## Tailwind Classes
        - Container: `p-4 bg-gray-900 rounded-xl`
        - Buttons: `bg-neon-blue hover:bg-neon-purple text-white`
        ```

## 2. Implementation (Tech Lead)
- **Role**: `tech-lead-agent`
- **Action**:
    1.  Read the **Visual Spec** provided by the Designer.
    2.  Translate the Tailwind classes and rules into code changes.
    3.  **CRITICAL**: Use `create_task` to execute the changes via the worker.
        - Example: `create_task { "title": "Apply Cyberpunk Styles", "description": "write_code: src/components/Button.jsx ...", "assigned_to": "tech-lead-agent" }`

## 3. Verification (Frontend Agent)
- **Role**: `frontend-agent`
- **Action**:
    1.  Wait for the worker to complete the task.
    2.  Review the changes (using `read_file` or visual inspection if possible).
    3.  Report success or request adjustments.
