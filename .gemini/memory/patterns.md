# Coding Patterns

## 1. Services
- **Pattern**: Singleton-like objects exporting methods.
- **Location**: `src/services/`
- **Example**:
  ```javascript
  export const MyService = {
      async method(params) {
          // implementation
      }
  };
  ```

## 2. Tools
- **Registration**: All tools must be registered in `ToolRegistry.js`.
- **Signature**: `(payload, options) => Promise<Result>`
- **Documentation**: All tools require a description string in `register()`.

## 3. Components
- **Structure**: Functional Pattern.
- **shadcn/ui**: Use components from `@/components/ui/` (e.g., `Button`, `Input`).
- **Icons**: Import from `lucide-react`.

## 4. Database Access
- **Client**: Use `import { supabase } from '@/api/supabaseClient'`.
- **Typing**: Since we use JS, rely on JSDoc for complex data structures.

## 5. Environment Variables
- **Access**: Use `import.meta.env.VITE_KEY`.
- **Prefix**: All frontend env vars must start with `VITE_`.
