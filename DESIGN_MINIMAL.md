# Design Minimaliste - NeuroTime

## 🎨 Changements appliqués

### 1. **Palette de couleurs simplifiée**
- Suppression des effets glassmorphism complexes
- Palette réduite avec variables CSS claires :
  - `--bg-primary` : #0a0d14 (fond principal)
  - `--bg-secondary` : #0f1218 (cartes)
  - `--bg-tertiary` : #14171f (inputs)
  - `--primary` : #6366f1 (accent principal)
  - Bordures ultra-subtiles (4-8% d'opacité)

### 2. **Typographie épurée**
- Police unique : **Inter** (remplace Syne, Figtree, DM Mono)
- Hiérarchie simplifiée avec moins de variations de poids
- Tailles de police réduites pour un look plus compact
- Espacement des lettres minimal

### 3. **Espacements compacts**
- Padding réduit dans tous les composants
- Sidebar : 56px → 52px (208px)
- Éléments de navigation plus serrés
- Marges entre sections réduites (space-y-4 → space-y-3)

### 4. **Effets visuels minimaux**
- ❌ Suppression des glows et text-shadows
- ❌ Suppression des backdrop-blur
- ❌ Suppression des box-shadows complexes
- ✅ Transitions rapides (120-200ms)
- ✅ Bordures plates et subtiles
- ✅ Aurora blobs très atténués (opacité 15%)

### 5. **Composants simplifiés**

#### Navigation
- Boutons plus petits et compacts
- Icônes 14-15px (desktop) / 18px (mobile)
- Texte 9px avec tracking réduit
- Bordures arrondies réduites (rounded-md vs rounded-xl)

#### Mobile Bottom Nav
- Hauteur réduite
- FAB plus petit et moins proéminent
- Suppression de la ligne de glow supérieure
- 5 items au lieu de 6 (URSSAF retiré du mobile)

#### Inputs & Forms
- Border-radius : 10px → 6px
- Pas de box-shadow au focus
- Transitions plus rapides

### 6. **Performance**
- Moins d'animations coûteuses
- Pas de backdrop-filter (meilleure performance)
- Transitions CSS optimisées
- Durées d'animation réduites

## 📊 Comparaison avant/après

| Élément | Avant | Après |
|---------|-------|-------|
| Sidebar width | 224px (56) | 208px (52) |
| Nav icon size | 15px | 14px |
| Nav text size | 10px | 9px |
| Border radius | 10-12px | 6-8px |
| Transition speed | 150-400ms | 120-300ms |
| Aurora opacity | 35% | 15% |
| Fonts loaded | 3 (Syne, Figtree, DM Mono) | 1 (Inter) |

## 🎯 Principes du design minimaliste

1. **Moins c'est plus** : Suppression des effets superflus
2. **Hiérarchie claire** : Contraste et espacement pour guider l'œil
3. **Performance** : Moins d'effets = meilleure fluidité
4. **Lisibilité** : Typographie simple et cohérente
5. **Espace négatif** : Respiration visuelle malgré la compacité

## 🔧 Variables CSS principales

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0d14;
  --bg-secondary: #0f1218;
  --bg-tertiary: #14171f;
  --bg-elevated: #191c24;
  
  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-default: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.12);
  
  /* Text */
  --text-primary: #e8ecf4;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  
  /* Brand */
  --primary: #6366f1;
  --primary-hover: #5558e3;
  
  /* Timing */
  --dur-fast: 120ms;
  --dur-normal: 200ms;
  --dur-slow: 300ms;
}
```

## 📱 Responsive

Le design reste entièrement responsive avec :
- Mobile-first approach maintenu
- Bottom navigation optimisée
- Sidebar adaptative sur desktop
- Espacements proportionnels sur tous les écrans

## ✨ Prochaines étapes suggérées

1. Appliquer le même style aux composants enfants (DashboardKPIs, MissionsList, etc.)
2. Uniformiser les border-radius à 6-8px partout
3. Réduire les espacements dans les cartes
4. Simplifier les animations d'entrée
5. Optimiser les icônes (taille uniforme)
