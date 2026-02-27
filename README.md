<div align="center">
  <img src="./WattsUp/public/favicon_transparent_640.png" alt="WattsUp Logo" width="120" />

  <h1>WattsUp | CycleTeam Tracker</h1>
  <p>A highly-polished, gamified dashboard web application designed specifically for cycling teams to log, track, and internally compete on their training energy output.</p>
</div>

<br />

## ⚡ Overview

WattsUp is a modern, serverless web application that goes beyond simple ride times by calculating a normalized **Energy Score (kWh)**. This system authentically rewards *both* the intense track sprinters and the long-distance endurance riders on your team. 

Built with an aggressive, neon-accented "Sporty/Competitive" aesthetic, the app makes training logging fun, highly competitive, and seamlessly automatic through Strava integrations.

---

## 🚀 Key Features

### 🏅 Gamified Live Leaderboards
*   **Dynamic Ranking:** Real-time generation of Gold, Silver, and Bronze badges for podium spots.
*   **Scalable UI:** Fully scrollable leaderboards with an auto-locate "Your Rank" sticky pill feature to jump straight to your position.
*   **National Pride:** Emoji-based nationality flags integrated securely into user profiles and leaderboard displays.

### 🚲 Team & Group Filtering
*   **Private Squads:** Create and join distinct Teams within the platform via unique 8-character invite codes.
*   **Granular Filtering:** Filter all session data and the main leaderboard to only show members of your specific racing team or local club.
*   **Public/Private Toggles:** Opt-out of the global platform leaderboard without dropping out of your private team's leaderboard.

### 🤖 Strava OAuth Auto-Sync
*   **Frictionless Logging:** Direct OAuth 2.0 integration with the Strava API.
*   **Serverless Webhooks:** Vercel API routes intercept incoming activity creations directly from Strava in real-time.
*   **Strict Activity Verification:** Automatically confirms the activity is a valid Ride/e-Ride and guarantees a non-zero Power (`average_watts`) payload before silently registering the `kWh` score.
*   **Background Maintenance:** Intelligent, background automated refreshing of short-lived access tokens via refresh tokens.

### 🎨 Premium "Sticker" Avatar Roster
*   **Massive Array:** A highly-curated, bespoke roster of 29 different vector chibi mascots (from Cheetahs to Dynamite to Rockets).
*   **Unified Aesthetic:** Every avatar was rigorously engineered to an exacting "sporty/competitive" style guide featuring thick die-cut sticker outlines, dynamic characteristic posing, and vibrant cel-shading.
*   **Interactive Selection:** A polished horizontal scrolling carousel with magnetic snapping and distance-based depth algorithms directly inside the Profile modal.

### 📱 Progressive Web App (PWA)
*   Fully installable on Android and iOS devices.
*   Engineered with custom Web App Manifests (`manifest.json`) targeting high-res transparent icons for gorgeous, seamless dark-mode splash screens upon launch.

---

## 🛠️ Tech Stack & Architecture

We utilized a strictly modern, fully-managed serverless environment. There are no local Docker containers to maintain or Node/Express servers to provision.

*   **Frontend UI:** React + Vite
*   **Routing:** React Router DOM (fully protected routes & forced onboarding flows)
*   **Styling:** Mobile-first Vanilla CSS (Custom glassmorphism logic, complex variable theming)
*   **Backend & Database:** Supabase (PostgreSQL with highly secured Row Level Security policies)
*   **Authentication:** Supabase Auth (Email & Password + Security verification for profile edits)
*   **Hosting & APIs:** Vercel & Vercel Serverless Functions

---

## 📐 The "Energy Score" (kWh) Equation

To level the playing field between someone producing 350 Watts for 20 minutes and someone producing 150 Watts for 3 hours, the core aggregation metric used across all leaderboards is the kilowatt-hour.

`Score (kWh) = (Average Watts / 1000) * (Ride Minutes / 60)`

---

## 💻 Local Development Setup

### 1. Requirements
*   Node.js (v18+)
*   A Supabase Project
*   A Strava API Application (for Client ID & Secret)

### 2. Environment Variables
Create a `.env` file within the `/WattsUp` directory:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
# For Vercel Serverless Strava Routes:
STRAVA_CLIENT_ID=your_id
STRAVA_CLIENT_SECRET=your_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=your_custom_secure_string
```

### 3. Run the App
```bash
cd WattsUp
npm install
npm run dev
```

### 4. Database Setup
Ensure you run the included SQL migration files found in the `/docs` folder within your Supabase SQL Editor to properly build the required tables (`profiles`, `sessions`, `groups`, `group_members`) and attach their necessary Row Level Security policies.
