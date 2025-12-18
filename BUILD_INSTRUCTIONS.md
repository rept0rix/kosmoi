# Build & Deployment Instructions

The "One Dollar Challenge" landing page has been fully integrated into the codebase.

## Status
- **Integration**: Complete
- **Configuration**: Active (`src/pages.config.js`)
- **Theme**: Banana AI (Yellow) Applied

## Final Steps
Since the automated build command encountered an environment restriction, please execute the following manually to generate production assets:

1.  **Install Dependencies** (if needed):
    ```bash
    npm install
    ```
2.  **Build Application**:
    ```bash
    npm run build
    ```
3.  **Preview Production Build**:
    ```bash
    npm run preview
    ```

## Testing
The project uses Vitest for unit and component testing.

1.  **Run All Tests**:
    ```bash
    npm test -- --run
    ```
2.  **Run UI Mode**:
    ```bash
    npm run test:ui
    ```
3.  **Specific Test**:
    ```bash
    npm test path/to/file.test.js -- --run
    ```

---

## Verification
- Access the root URL.
- Verify the Yellow Theme is visible.
- Click "Start Now" to test the WhatsApp redirection.
- Run `npm test` and ensure all tests pass.
