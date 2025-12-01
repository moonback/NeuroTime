<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configurez vos variables d'environnement dans `.env.local`:
   - `GEMINI_API_KEY` : Votre clé API Gemini
   - `VITE_SUPABASE_URL` : L'URL de votre projet Supabase
   - `VITE_SUPABASE_ANON_KEY` : La clé anonyme de votre projet Supabase
3. Créez la table dans Supabase :
   - Allez dans l'éditeur SQL de votre projet Supabase
   - Exécutez le script `supabase_setup.sql`
4. Run the app:
   `npm run dev`
