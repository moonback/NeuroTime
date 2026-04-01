NeuroTime — UI/UX Audit & Refactoring Plan
Aesthetic Direction: "Dark Chronograph"
Think luxury pilot's instrument panel meets premium financial terminal. Every number rendered like it was machined — crisp, weighted, intentional. The aurora blobs stay, but they breathe rather than shout. Glass surfaces gain depth. Data visualization becomes the hero.

Part 1 — Current UI/UX Debt
Critical Issues
#	Area	Debt	Location
1	Feedback	confirm() native browser dialog still present	PaymentsView.tsx:148
2	Design System	Tailwind 4 config still uses the old extend JS object pattern instead of native @theme {} CSS variables	tailwind.config.js, index.css
3	Typography	Inter everywhere — functional but generic, kills the "premium" positioning	index.css:3,17
4	Charts	Default Recharts tooltips (white box) clash with the dark glass theme; no entrance animations on bars/pies	StatsView.tsx:80+
5	Animation coherence	12 keyframes in index.css with inconsistent easing/duration values; no shared animation token system	index.css:58-250
6	Numbers	Financial figures (€ 1,234.50) rendered in the same prop font as body copy — no monospace data type	All view components
7	Glass inconsistency	5 glass variants (.glass, .glass-light, .glass-strong, .glass-card, .glass-premium) with hardcoded rgba values not linked to a single source of truth	index.css:350+
8	Page transitions	Route changes have no exit animation — content simply replaces content	App.tsx:363-410
9	PWA colors	Theme color #008CFF doesn't match the app's actual primary #6366f1	vite.config.ts
10	Accessibility	No prefers-contrast: more media query override; focus rings use outline-none in several places	Multiple components
Medium Issues
SplashScreen.tsx (540 lines) has inline SVG circuit animation that could be a standalone CSS-only component
MissionsList.tsx and MissionForm.tsx are each 1500+ lines — needs breaking up
Aurora blobs use float-soft (20s CSS animation) running on all pages simultaneously — a performance concern on low-end devices
DashboardStats.tsx / DashboardGoals.tsx placed side-by-side but have no visual hierarchy differentiation from other cards
Part 2 — Proposed Design System
2.1 Typography
Replace Inter with a two-font system:


Display / Headings: "Syne" (geometric, unique, excellent at large scale)
Body copy: "Figtree" (warmer, more readable than Inter at small sizes)
Numbers / Data: "DM Mono" (precision instrument feel for financial values)
This trio is already on Google Fonts, zero bundle cost.

2.2 Color System → Tailwind 4 @theme block
Move from JS config to native CSS variables that Tailwind 4 can read directly:


@theme {
  /* Backgrounds */
  --color-void:     oklch(10% 0.02 270);   /* #080b14 equivalent */
  --color-surface:  oklch(14% 0.025 270);
  --color-surface-2:oklch(18% 0.028 270);
  --color-border:   oklch(28% 0.03 270);

  /* Primary — electric violet (richer than plain indigo) */
  --color-primary:      oklch(62% 0.22 280);   /* ~#7C5AF6 */
  --color-primary-glow: oklch(72% 0.22 280);

  /* Gold accent — for earnings, money, achievements */
  --color-gold:     oklch(78% 0.14 85);    /* ~#F5B731 */
  --color-gold-dim: oklch(65% 0.12 85);

  /* Teal — for time slots, hours */
  --color-teal:     oklch(72% 0.14 195);   /* ~#2DD4BF */

  /* Semantic */
  --color-success:  oklch(70% 0.16 155);   /* emerald */
  --color-warning:  oklch(78% 0.14 65);    /* amber */
  --color-danger:   oklch(65% 0.20 25);    /* red */

  /* Animation tokens */
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:         cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:      cubic-bezier(0.4, 0, 0.2, 1);
}
Key differentiation: The gold accent for financial data is the memorable design decision. When a user sees € 2,400 in gold DM Mono, it registers as "value" at a subconscious level — much more satisfying than the same number in white Inter.

2.3 Glass System — Single Source of Truth
All 5 glass variants derive from one set of CSS variables:


:root {
  --glass-bg:      oklch(14% 0.025 270 / 72%);
  --glass-border:  oklch(100% 0 0 / 8%);
  --glass-blur:    16px;
  --glass-shadow:  0 8px 32px oklch(0% 0 0 / 40%);
}
2.4 Premium Chart Styling
Custom <GlassTooltip> component for Recharts with:

Glass background matching the card system
Gold text for values, DM Mono font
Animated scale-in entrance
Custom active bar with a violet top-cap gradient
Part 3 — Refactoring Checklist (Prioritized)
These are the files I will touch, in order of impact-to-effort ratio:

Phase 1 — Design Foundation (highest leverage, touches everything)
Priority	File	Change
🔴 P1	src/index.css	Migrate to @theme {} tokens, add Syne + Figtree + DM Mono, consolidate 12 keyframes with shared easing variables, fix glass system
🔴 P1	tailwind.config.js	Remove JS extend duplicating what @theme now owns; keep only plugin-required config
🔴 P1	vite.config.ts	Fix theme color to match --color-primary
Phase 2 — User Feedback & Interactions
Priority	File	Change
🔴 P1	src/components/PaymentsView.tsx:148	Replace confirm() with useConfirmDialog hook
🟠 P2	src/App.tsx:363-410	Add <AnimatePresence> (Framer Motion) or CSS View Transitions API for route changes
🟠 P2	src/components/ConfirmDialog.tsx	Polish to match new glass system, add danger variant gradient border
Phase 3 — Charts (Visual Impact)
Priority	File	Change
🟠 P2	src/components/StatsView.tsx	New <GlassTooltip> component, gradient bar fills, animated pie with label connectors, earnings in gold DM Mono
Phase 4 — Typography & Numbers
Priority	File	Change
🟡 P3	All view components	Wrap financial values in <span class="font-mono text-gold"> via a <Price> utility component
🟡 P3	src/components/dashboard/StatCard.tsx	Apply Syne for stat values, DM Mono for numbers
Phase 5 — PWA & Accessibility
Priority	File	Change
🟡 P3	vite.config.ts	Fix PWA theme color, add prefers-color-scheme meta
🟢 P4	src/index.css	Add @media (prefers-contrast: more) block, audit focus rings
Part 4 — New Dependencies Needed
Package	Why	Bundle Cost
framer-motion	Page transitions, staggered list entries, chart bar animations	~47kb gzipped
Everything else (sonner, react-router-dom@7, recharts) is already installed.

Summary of What Will Be Unforgettable
Gold numbers — every euro amount in DM Mono with a subtle gold tint. Feels like Bloomberg Terminal meets Apple Card.
Syne headings — the section titles gain personality; the app stops looking like a generic React SaaS dashboard.
Coherent animation grammar — all transitions share the same 4 easing tokens. The app "feels" physically consistent.
Glass tooltip on charts — the moment the user hovers a bar chart and sees a frosted-glass card pop up instead of a white div, the premium perception spikes.
Ready to execute. Should I start with Phase 1 (the CSS/design foundation in index.css + tailwind.config.js)? That's the highest-leverage change and makes every subsequent phase easier since all components inherit the new tokens automatically.

Or if you'd prefer, I can start with the PaymentsView.tsx confirm() fix (quick win, zero risk) and the Recharts chart upgrade simultaneously.