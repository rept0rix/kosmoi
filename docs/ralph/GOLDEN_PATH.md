# Kosmoi "Golden Path" Workflow (Superpowers/Ralph)

This document outlines the mandatory workflow for developing complex logic in the Kosmoi project, adopting the "Superpowers" methodology.

## 1. The Ralph Loop (Agentic TDD)
For any non-trivial feature (especially business logic, financial calculations, or integrations), follow this loop:

1.  **Brainstorm & PRD**:
    - Create a markdown file in `docs/ralph/` describing the requirements.
    - Define clear inputs, outputs, and edge cases.

2.  **Red (Failing Test)**:
    - Create a standard `.test.ts` file alongside the intended implementation.
    - Write tests that assert the expected behavior defined in the PRD.
    - **Verify Failure**: Run `npx vitest run <path>` and confirm it fails.

3.  **Green (Implementation)**:
    - Write the minimal code necessary to pass the tests.
    - Do not over-engineer.

4.  **Refactor**:
    - Clean up the code while ensuring tests still pass.

## 2. Tools
- **Ralph TUI**: Use `ralph-tui` for managing multi-step agent tasks.
- **Vitest**: Standard test runner.
- **Bun**: Runtime for Ralph.

## 3. Directory Structure
- `docs/ralph/`: PRDs and planning documents.
- `src/**/__tests__` or `*.test.ts`: Test files co-located with source.

## 4. Checklists
- [ ] PRD approved?
- [ ] Tests written *before* code?
- [ ] All verification steps (Automated & Manual) documented in PRD?
