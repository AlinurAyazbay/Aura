# Aura Optima

**Aura Optima** is a dual-track civic and institutional micro-investment platform funding air purification towers across Almaty, Kazakhstan. Citizens and businesses invest any amount starting from $1, and every dollar goes directly toward building HEPA-grade outdoor air filtration towers in Almaty's most polluted districts.

The platform provides real-time investment tracking, live AQI monitoring via OpenWeatherMap, community district voting for tower placement, an AI assistant powered by Google Gemini, and a full admin dashboard. Built on Next.js with Firebase for auth and real-time data, Aura Optima is designed for production — fully responsive, i18n-ready in Kazakh and English, with secure session cookies and role-based access control.

---

## Features

- **Dual investor tracks** — Civic Backers (individuals) and Institutional Investors (businesses)
- **Live AQI widget** — real-time Almaty air quality from OpenWeatherMap, cached 30 min
- **Investment impact calculator** — real-time m³/day and tree equivalents as you choose an amount
- **Badge system** — 🌱 Civic Backer / 🌿 Green Partner / 🏛️ Tower Founder
- **Community voting** — vote for the next tower district, with live AQI from all 8 Almaty districts
- **Interactive Leaflet map** — color-coded AQI markers for all districts
- **AI Assistant** — Aura-ly, powered by Google Gemini (3 free messages for guests)
- **Dream Almaty** — animated 2026–2030 vision carousel
- **Admin dashboard** — manage ticker, pollution alerts, investments, voting, users
- **Kazakh / English i18n** — toggle via cookie, persists across visits
- **Framer Motion animations** — page entries, staggered cards, animated counters
- **Firebase Auth** — email/password with server-side httpOnly session cookies
- **Pollution Alert Banner** — real-time from Firestore, dismissable per session

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Auth + DB | Firebase Auth + Firestore |
| Animations | Framer Motion |
| Map | Leaflet + react-leaflet |
| i18n | next-intl (KK/EN) |
| AI | Google Gemini (@google/generative-ai) |
| Icons | lucide-react |
| Charts | recharts |
| Confetti | canvas-confetti |

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd aura-optima
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in your Firebase credentials (see Firebase Setup below).

### 3. Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name
3. Click **Add app** → Web → register the app
4. Copy the `firebaseConfig` values into `.env.local`:
   - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `measurementId` → `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
5. Go to **Authentication** → Sign-in method → Enable **Email/Password**
6. Go to **Firestore Database** → Create database → Start in **test mode**
7. Go to **Firestore → Rules** → paste the rules below

### 4. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == "a_alinur@kbtu.kz";
    }
    match /users/{uid} {
      allow read: if request.auth.uid == uid || isAdmin();
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid || isAdmin();
    }
    match /investments/{id} {
      allow read: if isAdmin() || resource.data.uid == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
    match /globalStats/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /districts/{districtId} {
      allow read: if true;
      allow update: if request.auth != null;
    }
  }
}
```

### 5. Initialize Firestore Data

After setting up Firebase, create these documents in Firestore:

**`globalStats/investmentData`**
```json
{
  "totalRaised": 0,
  "backerCount": 0,
  "towersCompleted": 0,
  "towersInProgress": 1
}
```

**`globalStats/pollutionAlert`**
```json
{
  "message": "",
  "active": false
}
```

**`districts/turksib`** (repeat for all 8 districts)
```json
{
  "name": "Turksib",
  "nameKk": "Түрксіб",
  "votes": 0,
  "lat": 43.3019,
  "lng": 77.0619
}
```

All 8 districts:
| ID | Name | Name KK | Lat | Lng |
|----|------|---------|-----|-----|
| turksib | Turksib | Түрксіб | 43.3019 | 77.0619 |
| medeu | Medeu | Медеу | 43.1720 | 76.9506 |
| alatau | Alatau | Алатау | 43.3167 | 76.8500 |
| bostandyk | Bostandyk | Бостандық | 43.2165 | 76.8695 |
| almaly | Almaly | Алмалы | 43.2567 | 76.9286 |
| nauryzbai | Nauryzbai | Наурызбай | 43.2500 | 76.7833 |
| zhetysu | Zhetysu | Жетісу | 43.2894 | 76.9856 |
| narikbai | Narikbai | Нариқбай | 43.2333 | 76.7167 |

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase measurement ID (optional) |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | OpenWeatherMap API key for AQI data |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin email(s) |
| `GEMINI_API_KEY` | Google AI Studio API key for Aura-ly |
| `SESSION_SECRET` | Secret for HMAC-signing admin cookie |

---

## Deployment to Firebase Hosting

```bash
# 1. Build the app
npm run build

# 2. Install Firebase CLI
npm install -g firebase-tools

# 3. Login to Firebase
firebase login

# 4. Initialize hosting (select your project)
firebase init hosting

# 5. Deploy
firebase deploy
```

Update `.firebaserc` with your actual project ID before deploying.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing / Dashboard (guest + auth states)
│   ├── about/                # About page
│   ├── dream-almaty/         # 2030 vision page
│   ├── assistant/            # AI chat page
│   ├── invest/               # Investment flow
│   ├── profile/              # User profile
│   ├── vote/                 # District voting + map
│   ├── admin/                # Admin dashboard
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   └── api/
│       ├── auth/session/     # Session cookie management
│       ├── chat/             # Gemini AI proxy
│       └── locale/           # i18n locale switching
├── components/
│   ├── Header.tsx            # Sticky header (guest/auth states)
│   ├── AQIWidget.tsx         # Live AQI badge
│   ├── PollutionAlertBanner.tsx
│   └── SkeletonLoader.tsx
├── lib/
│   ├── firebase.ts           # Firebase app init + setup comments
│   ├── badges.ts             # Badge calculation logic
│   └── impact.ts             # Air impact math
├── middleware.ts             # Auth route protection
├── proxy.ts                  # Middleware implementation
└── i18n/request.ts           # next-intl server config
messages/
├── en.json                   # English translations
└── kk.json                   # Kazakh translations
```

---

## Architecture Notes

- **Session auth**: Firebase Auth (client) → `idToken` → `/api/auth/session` → httpOnly cookies → middleware reads cookies for route protection
- **AQI caching**: All AQI data cached 30 min in `localStorage` to avoid rate limits on the free OpenWeatherMap tier
- **Middleware**: `src/proxy.ts` contains the logic; `src/middleware.ts` re-exports it (Next.js requirement)
- **Map**: Loaded via `next/dynamic` with `ssr: false` (Leaflet is browser-only)
- **Confetti**: Dynamically imported on investment success to avoid SSR issues
- **Firestore writes**: All multi-document updates use `writeBatch` for atomicity

---

## License

MIT — built for Almaty. 🌱
# Aura
