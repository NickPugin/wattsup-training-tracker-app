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
We use a monorepo approach where the frontend, backend, and documentation coexist in the same root, simplifying local orchestration via Docker:
```
CycleTraining/
├── frontend/          # React (Vite) client, Vanilla CSS for mobile-first styles
├── backend/           # Node.js Express server + API
├── docs/              # Project documentation (PROJECT_PLAN.md)
└── docker-compose.yml # For spinning up local dev environment (App + DB)
```

### Tech Stack Recommendation
* **Frontend:** **React (powered by Vite)** for fast loading and a dynamic interface.
* **Styling:** **Vanilla CSS** with a mobile-first approach (CSS Grid/Flexbox). We will design rich interactive components, ensuring the app scales perfectly down to mobile screens.
* **Backend:** **Node.js (Express)** handling API routes and business logic.
* **Database:** **PostgreSQL** to handle relationships (Users <-> Sessions) robustly.

### Hosting & Deployment Strategy
* **Frontend:** **Vercel** or **Netlify** (Not GitHub pages. GH pages struggles with "Single Page Application" routing. Vercel is free, optimized for React/Vite, and handles mobile optimizations superbly.)
* **Backend:** **Render.com** (Free tier cloud hosting) for our Node instance + PostgreSQL database. 
  *(Alternative Local Setup if preferred: We can run it in a Docker container on your local server, but we will use **Cloudflare Tunnels** to expose it safely to the internet without opening router ports, ensuring your teammates can access it securely from their own homes.)*

## 5. Step-by-Step Plan of Action

### Phase 1: Planning and Architecture
1. **Initialize Project:** Create folder structure (`frontend`, `backend`, `docs`).
2. **Setup Dev Environment:** Create the local `docker-compose.yml` for database testing, and initialize vite frontend.

... (Proceed to Phases 2-4 of implementation)
