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

### Phase 2: Backend Development (API & Logic)
* **Step 5:** Implement User Authentication (signup, login, JWT/session management, password hashing).
* **Step 6:** Build the `Users/Profiles` API endpoints (GET user, UPDATE user details).
* **Step 7:** Build the `Sessions` API endpoints (POST new session, DELETE session via ownership check, GET all sessions, GET sessions by user).
* **Step 8:** Implement the sorting and aggregation logic on the backend to easily serve the Dashboard totals (summing minutes and calculating total kWh).

### Phase 3: Frontend Development (UI & Integration)
* **Step 9:** Setup the frontend application shell and routing (Login page, Dashboard, Sessions Table layout).
* **Step 10:** Build the Authentication UI (Login and Registration forms) and connect to the backend context/state.
* **Step 11:** Develop the **Dashboard Page**:
  * Fetch and render the team totals.
  * Implement the Profile Pop-up Modal (UI and data fetching).
* **Step 12:** Develop the **Sessions Page**:
  * Render the main data table.
  * Implement the "Add Session" modal triggered by the top-right Plus icon.
  * Ensure the local kWh calculation works securely/correctly before sending to API.
  * Implement the specific "click-to-delete" functionality with a confirmation dialog (ensuring only the owner sees this option).
* **Step 13:** Develop the **User Profile Management**:
  * Allow the logged-in user to upload a picture and update their bike type and FTP.

### Phase 4: Polish, Testing, and Deployment
* **Step 14:** General UI/UX polish (responsive design for mobile and desktop, loading states, error handling notifications).
* **Step 15:** Security and Testing (Test API endpoints, verify session deletion rules, test authentication payload).
* **Step 16:** Final Build and Deployment (Deploy Database, Backend, and Frontend to platforms like Vercel, Render, or Heroku).
