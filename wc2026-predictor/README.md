# ⚽ World Cup 2026 Predictor

A real-time prediction league for 20 players, built with React + Firebase + Vercel.

---

## 🚀 Deploy in 15 minutes

### Step 1 — Create a Firebase project (5 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `wc2026-predictor` → Create
3. In the left sidebar click **Build → Realtime Database**
4. Click **Create Database** → choose a region → start in **test mode**
5. Click the ⚙️ gear icon → **Project settings** → scroll to **Your apps**
6. Click the `</>` web icon → register app → copy the `firebaseConfig` object

### Step 2 — Add your Firebase config (1 min)

Open `src/lib/firebase.js` and replace the placeholder values with your real config:

```js
const firebaseConfig = {
  apiKey: "your-real-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

### Step 3 — Set Firebase Database rules (1 min)

In Firebase Console → Realtime Database → Rules, paste:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> For production you'd tighten these, but for an office game this is fine.

### Step 4 — Change PINs (optional but recommended)

Open `src/lib/data.js` and update each player's PIN.
The **admin PIN** is also in that file (default: `0000`). Change it!

### Step 5 — Deploy to Vercel (5 min)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Framework: **Vite** (auto-detected)
4. Click **Deploy**
5. Vercel gives you a URL like `wc2026-predictor.vercel.app` — share it with your team!

---

## 📱 How to use

| Who | What they do |
|-----|-------------|
| **Players** | Open the URL → pick their name → enter PIN → submit picks for any match |
| **Admin** | Sign in with Admin → PIN `0000` → go to Admin tab → enter real scores after each match |

### Scoring
- ✅ Correct winner or draw = **+3 points**
- 🎯 Exact scoreline = **+2 bonus points**
- ❌ Wrong result = **0 points**

---

## 🔧 Local development

```bash
npm install
npm run dev
```

---

## 📁 Project structure

```
src/
├── lib/
│   ├── firebase.js   ← your Firebase config goes here
│   └── data.js       ← players, PINs, groups, teams
├── components/
│   ├── LoginScreen.jsx
│   ├── PickTab.jsx
│   ├── LeaderboardTab.jsx
│   ├── ResultsTab.jsx
│   ├── SquadTab.jsx
│   └── AdminTab.jsx
├── App.jsx
├── main.jsx
└── index.css
```
