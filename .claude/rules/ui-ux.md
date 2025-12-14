# UI/UX Design Rules

## Core Aesthetic: "Premium Glassmorphism"
The application uses a high-end glassmorphism aesthetic. All new UI components must adhere to these principles.

### Glass Effects
Use the following Tailwind utilities for glass surfaces:
- **Backgrounds**: `bg-primary-glass` (10% white), `bg-surface-glass` (5% white).
- **Backdrop**: Always use `backdrop-blur-md` or `backdrop-blur-xl` for floating elements.
- **Borders**: Subtle gradients or white/10 (`border-white/10`) to define edges without heaviness.
- **Shadows**: `shadow-glass` (soft), `shadow-glass-hover` (glow), `shadow-neon` (colored glow).

### Typography
- **Headings**: `Outfit` (Sans-serif, geometric). variable weights.
- **Body**: `Inter` (Clean, readable). 
- **Hierarchy**: Use `bg-clip-text text-transparent bg-gradient-to-r` for main titles to add depth.

### Components
- **GlassCard**: Use `src/components/ui/GlassCard.jsx` for containers.
- **GlassButton**: Use `src/components/ui/GlassButton.jsx` for primary actions.
- **Animations**:
  - `float`: For empty states or key icons.
  - `breathe`: For pulsing glows.
  - `motion.div` (framer-motion) with `spring` config for entrance animations.

### Dark/Light Mode
- Ensure glass effects work in both modes.
- Dark mode: `bg-black/20` or `bg-black/40` for deeper contrast.
- Light mode: `bg-white/60` or `bg-white/80`.
