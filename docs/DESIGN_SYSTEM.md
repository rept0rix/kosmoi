# 🍌 Nano Banana Design System
*The Premium UI Standard for Kosmoi (January 2026)*

## 🌟 Philosophy
**"Midnight & Gold"**
The interface should feel deep, immersive, and premium. We move away from flat "Admin Dashboards" to a "Digital Operating System" vibe.

- **Primary Vibe**: Immersive, Glass, Neon, Fluid.
- **Dark Mode First**: The system is designed for dark mode (Midnight) as the default experience.
- **Micro-interactions**: Everything should feel alive.

---

## 🎨 Color Palette

### 🌌 Midnight (Backgrounds)
The foundation of the universe. Deep, rich, slightly blue-tinted blacks.
- **`bg-midnight-950`** (#020617): Main page background.
- **`bg-midnight-900`** (#0f172a): Secondary backgrounds, sidebar base.

### 🍌 Banana (Primary / Brand)
Used for calls to action, premium badges, and highlights.
- **`text-banana-400`** (#FBBF24): Primary text highlight.
- **`bg-banana-500`** (#F59E0B): Primary buttons.
- **`border-banana-500/20`**: Subtle borders for premium cards.
- **Gradient**: `from-banana-400 to-banana-600`.

### 💎 Glass (Surfaces)
We do not use solid grays for cards. We use **Glass**.

#### `.glass-card-premium`
The standard container for almost everything.
```css
@apply bg-slate-950/70 backdrop-blur-2xl border border-white/10 shadow-2xl;
```
*Note: In special cases (Gold Tier), add `border-banana-500/20` and `shadow-gold-glow`.*

#### `.glass-panel`
For sidebars or floating panels.
```css
@apply bg-slate-950/80 backdrop-blur-lg border border-white/5;
```

---

## ✨ Typography
- **Headings**: `Outfit` (Geometric, clean, modern).
- **Body**: `Inter` or `Heebo` (Readable, neutral).
- **Hebrew/Thai**: `Noto Sans` variations.

---

## ⚡ Lighting & Effects

### Text Glows
- `.text-glow-banana`: For gold headings.
- `.text-glow-blue`: For neutral/tech headings.

### Shadows
- `shadow-gold-glow`: `box-shadow: 0 0 15px rgba(245, 158, 11, 0.3)`

---

## 🛠️ Usage Examples

### 1. The Standard Card
```jsx
<div className="glass-card-premium p-6 rounded-3xl">
  <h3 className="text-white font-heading font-bold text-lg">Title</h3>
  <p className="text-slate-400">Content goes here.</p>
</div>
```

### 2. The Primary Button
```jsx
<button className="bg-gradient-to-r from-banana-500 to-banana-600 text-midnight-950 font-bold rounded-xl shadow-lg shadow-banana-500/20 hover:shadow-banana-500/40 transition-all">
  Upgrade Now
</button>
```

### 3. The Page Container
```jsx
<div className="min-h-screen bg-midnight-950 text-white relative overflow-hidden">
   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-banana-500/5 rounded-full blur-[100px] pointer-events-none" />
   {/* Content */}
</div>
```
