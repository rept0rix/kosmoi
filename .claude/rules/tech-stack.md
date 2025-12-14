# Technology Stack & Standards

## Core Frameworks
- **Frontend**: React 18+ (Vite)
- **Styling**: Tailwind CSS + generic `index.css` for globals.
- **State/Animations**: `framer-motion` for complex animations.
- **Icons**: `lucide-react`.

## File Structure
- `src/components/ui/`: Reusable, generic UI components (shadcn/ui style).
- `src/pages/`: Route-based page components.
- `src/lib/`: Utilities and context providers.

## Coding Standards
1. **Functional Components**: Use functional components with hooks.
2. **Prop Types**: Use JSDoc annotations for significant components (Reference `GlassCard.jsx` for example).
3. **Imports**: Use absolute paths `@/` where possible.
4. **Tailwind**: Use `cn()` utility for class merging.
