# CycleTeam Tracker

## 1. Project Overview
A web application designed for cycling teams to log, track, and compare their training sessions. The core gamification and tracking metric is the total energy produced, measured in **kilowatt-hours (kWh)**. The platform fosters team accountability, allows riders to visualize their own progress, and provides a comparative leaderboard of team efforts.

## 2. Core Features & Requirements

### User Authentication & Profiles
* **Secure Login:** Unique username and password per rider.
* **Personal Data:** Profile picture (optional), Type of bike (Road, TT, Mountain, Smart Trainer), and Estimated FTP.
* **Calculated Statistics (Auto-generated):** Total number of training hours logged and total kWh produced.
* **Profile Viewing:** Profiles can be viewed by teammates via a modal pop-up on the Dashboard, containing a required close button at the bottom.

### Dashboard Page (Team Overview)
* **Leaderboard/Totals:** Displays a comparative view of the entire team, showing the aggregated total kWh and training hours for each individual.
* **Interactive Elements:** Clicking on a rider's name opens their detailed Profile Pop-up.

### Training Sessions Page (Data Log)
* **Session Table:** Tabular view of all sessions displaying Date, Time spent (minutes), Average wattage, and Calculated kWh.
* **Add Session:** A "Plus (+)" icon in the top right corner opens a window to input new session details.
* **Session Ownership & Deletion:** Riders can only delete their own sessions via a click-to-delete confirmation flow.

## 3. Mathematical Calculations
* **Kilowatt-hours (kWh):** `(Average Wattage * (Minutes / 60)) / 1000`

---

## 4. Technical Architecture & Hosting Strategy

### File Structure Strategy
We used a clean frontend monorepo approach, utilizing serverless functions and a hosted database backend:
```
CycleTraining/
├── WattsUp/          # Root React (Vite) application directory
│   ├── src/          # React components, pages, context, and Vanilla CSS
│   ├── public/       # Static assets and PWA manifest
│   └── api/          # Vercel Serverless Functions (Strava OAuth, Webhooks)
├── docs/             # Project documentation and SQL schema migrations
└── README.md         # Full project documentation
```

### Final Tech Stack
* **Frontend:** **React (powered by Vite)** for fast loading and dynamic interfaces.
* **Styling:** **Vanilla CSS** with a mobile-first glassmorphism design system.
* **Backend API & Database:** **Supabase (PostgreSQL)** handling real-time API routes (PostgREST), Row Level Security, and complex relational data.
* **Authentication:** **Supabase Auth** (Email & Password + Security verification flows).
* **Hosting:** **Vercel** handling the seamless edge deployment of the React app and serverless `api/` endpoints.

---

## 5. Execution Record: Step-by-Step Plan of Action

### Phase 1: Planning and Setup (Foundation)
* Initial Requirements Gathering and Architecture selection (Supabase + Vercel).
* Initialized React frontend using Vite.
* Created basic `.env` setup instructions for Supabase keys.

### Phase 2: Supabase (Backend/DB) Setup
* Created `profiles` and `sessions` table schemas.
* Built and attached fundamental Row Level Security (RLS) policies.
* Setup Supabase Authentication (Email/Password).

### Phase 3: Frontend Core Settings
* Installed dependencies (React Router DOM, Supabase JS client, Lucide Icons).
* Built global CSS & CSS variable design system (Mobile-first, Premium aesthetics).
* Setup Supabase Auth Client context provider.

### Phase 4: Frontend Development (UI & Integration)
* Built protected Authentication UI (Login / Register flows).
* Built Dashboard Interface (Responsive Grid Layout & Global Leaderboard Table).
* Built interactive Sessions Table UI with secure delete permissions.
* Implemented the "Add Session" modal & background `kWh` Calculation logic.
* Developed User Profile Pop-ups with custom picture, bike, edit, and catchphrase fields.
* Generated and integrated the initial core batch of generic vector mascot avatars.

### Phase 5: Groups & Advanced Profiles
* Wrote SQL migrations for `groups` and `group_members` tables.
* Added `is_public` boolean architecture to restrict global leaderboard visibility.
* Created `Groups` UI tab (Create Group, Join via unique 8-char codes).
* Updated Dashboard and Sessions pages to fetch dynamically filtered DB data based on Group dropdown selections.

### Phase 6: Nationality & UI Polish
* Created SQL migration adding `nationality` text field to `profiles`.
* Built out a massive Nationality flag dropdown selector in the Profile UI.
* Parsed and injected Nationality Emojis into the live dashboard leaderboard.
* Added QoL `Copy to Clipboard` functionality for Group Invite Codes.

### Phase 7: Leaderboard Scroll & UX Polish
* Refined active rider highlighting away from simple badges to styled table rows.
* Applied explicit `max-height` constraints with sticky headers to leaderboard tables.
* Engineered a React `useRef` `scrollIntoView` system to auto-scroll the user to their rank via a sticky pill button.

### Phase 8: Expanded Avatar Roster
* Standardized an official `AVATAR_STYLE_GUIDE.md` targeting a "Sporty/Competitive" aesthetic with die-cut sticker outlines and cel-shading.
* Prompted, generated, and saved an expansive 29-character roster of highly polished Chibi profile avatars.
* Hand-tuned legacy generic avatars to match the new dynamic style system.
* Engineered a horizontally scrolling, snap-assisted Profile Modal carousel containing the full 29 avatars.

### Phase 9: Profile Onboarding Flow
* Streamlined the `Login.tsx` pipeline by stripping out native profile insert actions.
* Configured `Dashboard.tsx` to trap newly authenticated users without complete profiles.
* Passed an `isOnboarding` lock prop into `ProfileModal.tsx` forcing users to establish a username, nationality, and avatar prior to viewing team data.

### Phase 10: Strava API Auto-Sync Integration
* Expanded `profiles` and `sessions` database schemas to accept OAuth keys and `strava_activity_id` bigints to prevent duplication.
* Registered API App in Strava dev portal and supplied Client ID/Secrets to Vercel environment.
* Built Vercel serverless `api/strava/callback` for OAuth code-for-token exchanges.
* Built Vercel serverless `api/strava/webhook` for endpoint subscription challenges and POST event handlers.
* Programmed rigorous data filtering to guarantee payloads contained cycling activities, moving time, and positive `average_watts` prior to performing `kWh` calculations and DB inserts.
* Implemented automatic, silent backend token refreshment logic bypassing frontend states.

### Phase 11: Privacy & Account Settings
* Secured Strava OAuth controls by hiding them from unauthorized profile viewers.
* Developed an internal "Account Settings" accordion directly inside the Profile Modal.
* Constructed a "Change Email" flow requiring secondary `signInWithPassword` identity verification checks before pushing updates.
* Connected "Initiate Password Reset" button to Supabase magic link OTP dispatchers.
* Standardized app-wide async UI error and success Toast handling.
