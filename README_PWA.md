# 🚀 Guide d'installation PWA - NeuroTime

NeuroTime est maintenant une Progressive Web App (PWA) complète ! Cela signifie que vous pouvez l'installer sur votre téléphone, tablette ou ordinateur pour un accès rapide et une utilisation hors ligne.

## 📱 Installation sur Mobile

### Android (Chrome/Edge)

1. Ouvrez NeuroTime dans votre navigateur Chrome ou Edge
2. Une bannière d'installation apparaîtra automatiquement
3. Appuyez sur **"Installer"** ou **"Ajouter à l'écran d'accueil"**
4. L'application sera installée et apparaîtra comme une app native

**Ou manuellement :**
- Appuyez sur le menu (⋮) dans le navigateur
- Sélectionnez **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**

### iOS (Safari)

1. Ouvrez NeuroTime dans Safari
2. Appuyez sur le bouton **Partage** (square avec arrow)
3. Faites défiler et sélectionnez **"Sur l'écran d'accueil"**
4. Personnalisez le nom si vous le souhaitez
5. Appuyez sur **"Ajouter"**

## 💻 Installation sur Desktop

### Windows (Edge/Chrome)

1. Ouvrez NeuroTime dans Edge ou Chrome
2. Cliquez sur l'icône d'installation dans la barre d'adresse (ou dans le menu)
3. Cliquez sur **"Installer"**
4. L'application s'ouvrira dans sa propre fenêtre

### macOS (Safari/Chrome)

**Safari :**
1. Ouvrez NeuroTime dans Safari
2. Cliquez sur **"Partage"** > **"Ajouter à l'écran d'accueil"**

**Chrome/Edge :**
1. Ouvrez NeuroTime dans Chrome ou Edge
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Cliquez sur **"Installer"**

## ✨ Fonctionnalités PWA

### Mode Hors Ligne
- Les données sont mises en cache pour une utilisation hors ligne
- Vous pouvez consulter vos missions même sans connexion internet
- Les modifications seront synchronisées quand vous retrouvez une connexion

### Accès Rapide
- Raccourcis dans le menu contextuel (clic droit sur l'icône)
  - Nouvelle mission
  - Tableau de bord

### Performance
- Chargement plus rapide grâce à la mise en cache
- Utilisation réduite des données mobiles

## 🔧 Configuration Technique

### Icônes
Les icônes PWA sont générées automatiquement lors du build. Pour créer des icônes personnalisées :

1. Ouvrez `scripts/generate-icons.html` dans un navigateur
2. Téléchargez les icônes dans différentes tailles
3. Placez-les dans le dossier `public/` :
   - `icon-192x192.png`
   - `icon-512x512.png`
   - `apple-touch-icon.png`

### Service Worker
Le service worker est automatiquement généré par `vite-plugin-pwa` et gère :
- La mise en cache des assets statiques
- La mise en cache des ressources externes (polices, API)
- Les stratégies de cache pour différentes ressources

### Manifest
Le fichier `manifest.json` contient toutes les métadonnées de l'application :
- Nom et description
- Couleurs du thème
- Icônes
- Raccourcis

## 🐛 Dépannage

### L'option d'installation n'apparaît pas
- Assurez-vous que vous utilisez un navigateur compatible (Chrome, Edge, Safari)
- Vérifiez que l'application est servie en HTTPS (ou localhost pour le dev)
- Essayez de recharger la page

### Les mises à jour ne se chargent pas
- Le service worker se met à jour automatiquement
- Si nécessaire, videz le cache dans les paramètres du navigateur

### Problèmes de cache
- Dans Chrome : DevTools > Application > Storage > Clear site data
- Les mises à jour sont automatiques grâce à `registerType: 'autoUpdate'`

## 📝 Notes

- Les données sont toujours synchronisées avec Supabase
- Le mode hors ligne permet la consultation, mais certaines fonctionnalités nécessitent une connexion
- L'installation est optionnelle - l'app fonctionne aussi dans le navigateur

---

Pour plus d'informations, consultez le [ROADMAP.md](./ROADMAP.md)

