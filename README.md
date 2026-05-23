# 🚀 BrevetBoost

Une PWA (Progressive Web App) pour réviser le brevet des collèges et booster ta culture générale.

**286 questions** réparties sur **51 chapitres** dans 5 matières :
- 📐 Mathématiques (52 questions)
- 📖 Français (46 questions)
- 🏛️ Histoire-Géo-EMC (61 questions)
- 🔬 Sciences SVT/Physique/Techno (70 questions)
- 🌍 Culture Générale (57 questions)

## ✨ Fonctionnalités

- **Quiz QCM** avec score, correction et explication
- **Flashcards** pour mémoriser question → réponse
- **Suivi de progression** par matière et par chapitre
- **Stats globales** : questions jouées, % réussite, chapitres vus
- **Installable sur iPhone** (et Android) comme une vraie app
- **100 % local** : pas de compte, pas de serveur — tes stats sont sur ton téléphone

## 🛠️ Stack technique

- **React 19** + **TypeScript** — composants modernes typés
- **Vite** — bundler ultra rapide
- **React Router** — navigation entre les écrans
- **vite-plugin-pwa** — service worker + manifest
- **localStorage** — sauvegarde de la progression

## 🚀 Lancer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173

## 📦 Build de production

```bash
npm run build
npm run preview
```

## 📱 Installer sur ton iPhone

### Étape 1 : Mettre l'app en ligne (gratuit)

**Option A — Vercel (recommandé, 2 minutes) :**

1. Crée un compte sur [vercel.com](https://vercel.com) avec ton GitHub
2. Pousse ce projet sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TON_USERNAME/brevet-boost.git
   git push -u origin main
   ```
3. Sur Vercel, clique **"Add New Project"** → choisis ton repo `brevet-boost`
4. Laisse les réglages par défaut, clique **"Deploy"**
5. Tu obtiens une URL en HTTPS du genre `brevet-boost.vercel.app`

**Option B — Netlify :** même principe sur [netlify.com](https://netlify.com)

### Étape 2 : Installer sur iPhone

1. Ouvre ton URL Vercel dans **Safari** (pas Chrome) sur ton iPhone
2. Touche le bouton **Partager** (le carré avec la flèche en bas)
3. Descends et touche **"Sur l'écran d'accueil"**
4. Donne-lui un nom (par défaut "BrevetBoost") et touche **"Ajouter"**

🎉 L'icône apparaît sur ton écran d'accueil et l'app s'ouvre en plein écran comme une vraie app !

## 📁 Structure du code

```
src/
├── data/                     # Contenu (questions JSON par matière)
│   ├── maths.json
│   ├── francais.json
│   ├── histoire-geo.json
│   ├── sciences.json
│   ├── culture-g.json
│   └── index.ts              # Charge toutes les matières
├── pages/                    # Écrans de l'app
│   ├── HomePage.tsx          # Accueil avec les matières
│   ├── SubjectPage.tsx       # Liste des chapitres
│   ├── QuizPage.tsx          # QCM avec score
│   ├── FlashcardsPage.tsx    # Cartes question/réponse
│   └── StatsPage.tsx         # Statistiques
├── storage/
│   └── progress.ts           # Sauvegarde dans localStorage
├── types.ts                  # Types TypeScript partagés
├── App.tsx                   # Routes
├── main.tsx                  # Point d'entrée
├── index.css                 # Variables CSS / reset
└── App.css                   # Styles des composants
```

## ✏️ Ajouter / modifier des questions

Édite les fichiers dans `src/data/`. Format :

```json
{
  "id": "maths",
  "label": "Mathématiques",
  "emoji": "📐",
  "color": "#3b82f6",
  "chapters": [
    {
      "id": "mon-chapitre",
      "title": "Mon chapitre",
      "questions": [
        {
          "question": "...",
          "choices": ["A", "B", "C", "D"],
          "correctIndex": 0,
          "explanation": "..."
        }
      ]
    }
  ]
}
```

L'app se met à jour automatiquement (hot reload en dev, ou redéploiement sur Vercel).

## ⚠️ Note importante

Le contenu a été généré par IA. **Vérifie toujours les questions importantes** avec ton cours ou ton manuel avant ton brevet, surtout les dates précises et les définitions techniques.

Bon courage pour le brevet ! 💪
