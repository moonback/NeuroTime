# NeuroTime — audit UI et design system premium

## Audit UI

- L'interface utilisait plusieurs effets décoratifs simultanés : aurora, glassmorphism, gradients, glow, shimmer et ombres fortes. Ces couches réduisaient la lisibilité et donnaient une sensation moins native.
- Les composants mélangeaient de nombreuses couleurs d'accent (`indigo`, `purple`, `blue`, `amber`, `emerald`, `red`) sans hiérarchie stricte, ce qui diluait les priorités visuelles.
- La sidebar était dense, avec des libellés trop petits, des effets de scale au hover et une largeur limitée qui nuisait à la lisibilité desktop.
- Le dashboard manquait de respiration : KPIs compacts, tailles numériques insuffisamment hiérarchisées et grille secondaire peu confortable sur mobile.
- Les modales et formulaires reposaient sur des styles hétérogènes, avec focus et états interactifs dispersés.

## Direction artistique retenue

- Approche SaaS premium 2026 inspirée de Linear, Stripe, Notion, Vercel et Raycast : surfaces calmes, bordures subtiles, typographie nette, micro-interactions courtes.
- Suppression des gradients agressifs, auroras décoratives, ombres lourdes et animations de brillance.
- Profondeur volontairement légère : fond principal sombre, surfaces élevées, bordures fines, hover discret.
- Mobile-first : header plus lisible, bottom navigation thumb-friendly, cartes KPI en une colonne sur mobile.

## Design tokens

```css
--bg-primary: #08090b;
--bg-secondary: #0d0f12;
--bg-elevated: #13161a;
--text-primary: #f4f6f8;
--text-secondary: #a8afb9;
--text-muted: #6f7784;
--accent: #7c8cff;
--accent-hover: #94a0ff;
--success: #35c486;
--warning: #f4b740;
--danger: #ff5d5d;
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.11);
```

## Typographie

- `Inter` pour l'interface principale.
- `Geist` pour les titres et zones display.
- Fallbacks natifs : `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `system-ui`.
- Hiérarchie limitée : H1 display, H2/H3 semi-bold, body 14px, captions 10-11px uppercase.

## Composants refondus

- Cards : rayon 12px, bordure `--border-subtle`, surface `--bg-elevated`, ombre minimale, hover uniquement par bordure/fond/translation de 1px.
- Boutons : variantes prêtes à l'emploi `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` avec états hover/active/disabled.
- Inputs : hauteur uniforme 40px, bordures subtiles, focus visible AA avec ring accent.
- Dashboard : header éditorial, barre de période premium, KPIs plus grands, grille responsive, rétrospective plus lisible.
- Sidebar : navigation plus fine, active indicator moderne, badges sobres, spacing augmenté.
- Mobile : header 56px, bottom nav plus confortable, FAB central plus accessible.
