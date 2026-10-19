# 🚀 STEMLearn – Gamified STEM Learning Platform
### *Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards in Middle School STEM Education*

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-v3.10%2B-yellow?logo=python)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-v3.1-black?logo=flask)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20v7%2B-emerald?logo=mongodb)](https://www.mongodb.com/)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-Llama%203.3%2070B-orange)](https://groq.com/)
[![License](https://img.shields.io/badge/Academic%20Project-STEMLearn-informational)](#)

---

## 📖 1. Project Overview

**STEMLearn** is a comprehensive, full-stack educational web application designed for middle school students (**Grades 6, 7, 8, and 9**) in **Science, Technology, Engineering, and Mathematics (STEM)**. 

The primary research objective of this platform is to experimentally investigate and evaluate the pedagogical impact of **Competitive vs. Collaborative gamified learning mechanics**:
- **Condition A (Competitive Solo Mode)**: Students take quizzes individually, earn personal mastery points and speed bonuses, and compete on individual class leaderboards.
- **Condition B (Collaborative Squad Mode)**: Students belong to peer squads (teams), take quizzes where scores are aggregated/averaged, and rank on collaborative squad leaderboards.
- **Research Telemetry & ANOVA Engine**: The system records exact time-on-task, attempt velocity, mastery thresholds, and anti-cheat telemetry, providing automated one-way **ANOVA (Analysis of Variance)** calculations and **SPSS-compatible CSV/Excel exports**.
- **Dual AI Studio**: 
  - **Teacher AI Quiz Generator**: Generates Bloom-taxonomy-calibrated questions with one click using **Groq (Llama 3.3 70B)** or **Google Gemini 2.0 Flash**.
  - **Student AI Study Tutor**: Context-aware STEM tutor providing interactive, encouraging guidance with markdown formula rendering, blocked automatically during active exams.


🌐 **Website Link:** [https://stemlearn-frontend.onrender.com/](https://stemlearn-frontend.onrender.com/)
---

## 🏛️ 2. Architecture & Technology Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        STEMLearn Architecture                          │
├────────────────────────────────────────────────────────────────────────┤
│  Frontend (Port 5173)                                                  │
│  ├── React 19 + Vite 8 + Tailwind CSS v4                               │
│  ├── React Router v7 (Strict Role Isolation & Guards)                  │
│  ├── Recharts (Telemetry & Analytics Charts)                           │
│  ├── React-Markdown + Remark-GFM (AI Math & Text Rendering)            │
│  └── Axios Service Layer (with JWT Bearer Auto-Injection)              │
│                                │                                       │
│                                ▼ (/api Proxy)                          │
│  Backend (Port 5000)                                                   │
│  ├── Python 3.10+ / Flask RESTful API                                  │
│  ├── Flask-JWT-Extended (Stateless Token Authentication)               │
│  ├── Flask-Limiter & Security Middlewares                              │
│  ├── Pillow (Child Avatar EXIF Stripping & Square Thumbnailing)        │
│  └── APScheduler (Audit Log Archival & Automated Maintenance)          │
│                                │                                       │
│                                ▼                                       │
│  Database Layer                                                        │
│  └── MongoDB (Local Community Server OR MongoDB Atlas Cloud Cluster)   │
│                                │                                       │
│                                ▼                                       │
│  AI Engine Layer                                                       │
│  ├── Groq Cloud API (Llama 3.3 70B Versatile / Llama 3.1 8B)           │
│  └── Google Gemini API (Gemini 2.0 Flash) with Auto-Failover           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 3. Directory Structure

```text
STEMLearn/
├── backend/                           # Python Flask REST API
│   ├── app.py                         # App factory, blueprints & index setup
│   ├── config.py                      # Development & production configs
│   ├── wsgi.py                        # WSGI production server entry point
│   ├── seed.py                        # Master database seeder (Grades 6–9, curriculum, users)
│   ├── seed_all_questions.py          # Complete STEM question bank seeder
│   ├── verify_all.py                  # Automated end-to-end API verification suite
│   ├── inspect_db.py                  # Quick database summary report utility
│   ├── requirements.txt               # Python package dependencies
│   ├── .env                           # Environment secret keys & DB URI
│   ├── .env.example                   # Example configuration template
│   ├── middleware/                    # Auth guards, role checks, error handlers
│   ├── models/                        # Data schemas & validators
│   ├── routes/                        # REST API endpoints:
│   │   ├── auth_routes.py             # Universal login, register, password reset
│   │   ├── admin_routes.py            # Superuser actions, teachers, audit logs
│   │   ├── student_routes.py          # Dashboard, subjects, quizzes, teams, progress
│   │   ├── teacher_routes.py          # Class rosters, quiz authoring, review
│   │   ├── video_routes.py            # Subject → Category → Chapter video lessons (Grade isolated)
│   │   ├── ai_routes.py               # Groq & Gemini quiz generator & study tutor
│   │   ├── quiz_routes.py             # Secure exam engine, grading & points logic
│   │   ├── leaderboard_routes.py      # Solo & Squad leaderboards
│   │   ├── research_routes.py         # ANOVA telemetry & CSV data export
│   │   └── page_content_routes.py     # Public CMS page editor
│   ├── services/                      # AI LLM drivers, mail service, telemetry
│   ├── utils/                         # Password hashing, JWT helpers, generators
│   ├── tests/                         # PyTest automated unit & integration tests
│   └── uploads/                       # User profile avatars (EXIF stripped)
│
├── frontend/                          # React + Vite Single Page Application
│   ├── index.html                     # HTML5 entry point
│   ├── package.json                   # Dependencies & npm scripts
│   ├── vite.config.js                 # Vite proxy & Tailwind CSS configuration
│   └── src/
│       ├── main.jsx                   # React root entry point
│       ├── App.jsx                    # Application routes & ProtectedRoute guards
│       ├── context/                   # AuthContext (state, JWT session storage)
│       ├── layouts/                   # PublicLayout, StudentLayout, TeacherLayout, AdminLayout
│       ├── components/                # Reusable UI widgets (Navbar, Footer, Modals, Cards)
│       ├── pages/
│       │   ├── public/                # Home, About, Leaderboard, Research, ResetPassword
│       │   ├── student/               # Dashboard, Subjects, Quizzes, QuizTake, Videos, Results,
│       │   │                          # Leaderboard, Team, Progress, AiAssistant, Profile
│       │   ├── teacher/               # Dashboard, Classes, Students, Quizzes, QuizCreate, Videos,
│       │   │                          # Questions, Performance, Teams, Profile
│       │   └── admin/                 # Dashboard, Teachers, Students, Classes, Subjects,
│       │                              # Categories, Chapters, LoginLogs, Settings, OtherPages
│       └── services/
│           └── api.js                 # Axios API client with automatic token injection
│
├── .gitignore                         # Comprehensive Git exclusion rules
├── my requirement.md                  # Original academic project specification
└── README.md                          # Complete project documentation & guide
```

---

## ⚡ 4. Prerequisites

Before installing the project, verify that your machine has the following tools installed:

1. **Node.js**: `v18.x`, `v20.x`, or higher ([Download Node.js](https://nodejs.org/))
2. **Python**: `3.10.x`, `3.11.x`, or `3.12.x` ([Download Python](https://python.org/)) *(Make sure to check "Add Python to PATH" on Windows during installation)*
3. **MongoDB**:
   - **Option A (Recommended for Local Dev)**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) + [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (default URI: `mongodb://localhost:27017/stem_learning`).
   - **Option B (Cloud Hosting)**: Free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas/database) account.
4. **Git**: ([Download Git](https://git-scm.com/))

---

## 🛠️ 5. Step-by-Step Setup Guide

### 🗄️ Step 1: Database Setup

#### Option A: Local MongoDB (Fastest & Offline)
1. Install and start MongoDB Community Server on your system.
2. Ensure MongoDB service is running on `mongodb://localhost:27017`.
3. You can verify the connection by opening **MongoDB Compass** and clicking **Connect** on `mongodb://localhost:27017`.
4. Your connection URI will be:
   ```env
   MONGO_URI=mongodb://localhost:27017/stem_learning
   ```

#### Option B: MongoDB Atlas (Cloud Database)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a free **M0 Sandbox** cluster.
3. Under **Security → Database Access**, create a user (e.g., username `admin_user`, secure password).
4. Under **Security → Network Access**, add IP Address `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect → Drivers** and copy your connection string:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/stem_learning?retryWrites=true&w=majority
   ```

---

### 🐍 Step 2: Backend Setup (Python Flask)

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a Python Virtual Environment:
   ```bash
   # Windows (PowerShell or CMD)
   python -m venv venv

   # macOS / Linux
   python3 -m venv venv
   ```

3. Activate the Virtual Environment:
   ```bash
   # Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   # (If script execution is disabled in PowerShell, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

   # Windows (Command Prompt)
   venv\Scripts\activate.bat

   # macOS / Linux
   source venv/bin/activate
   ```

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure the `.env` file in `backend/`:
   Create or edit the `.env` file inside the `backend/` folder:
   ```env
   FLASK_ENV=development
   SECRET_KEY=stemlearn_secret_key_change_in_production_2024
   JWT_SECRET_KEY=stemlearn_jwt_secret_key_change_in_production_2024

   # MongoDB Connection URI (Local or Atlas)
   MONGO_URI=mongodb://localhost:27017/stem_learning

   # AI Provider Keys (Optional: can also be configured via Admin Settings in the web UI)
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.0-flash

   # File Uploads Configuration
   UPLOAD_FOLDER=uploads
   MAX_CONTENT_LENGTH=5242880
   ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

   # Rate Limiting
   RATELIMIT_DEFAULT=100/hour
   LOGIN_RATELIMIT=5/minute
   ```

6. Seed the Database with Curriculum & Demo Users:
   Run the idempotent seeding script to populate all grades, divisions, subjects, chapters, and demo user accounts:
   ```bash
   python seed.py
   ```
   *(Optional) To populate rich question banks for all grades:*
   ```bash
   python seed_all_questions.py
   ```

7. Run System Verification:
   Run the built-in end-to-end verification suite to ensure all databases, endpoints, authentication, and AI services are healthy:
   ```bash
   python verify_all.py
   ```
   *Expected output: `ALL API ENDPOINTS AND SYSTEM CHECKS PASSED!`*

8. Start the Flask Backend Server:
   ```bash
   python app.py
   ```
   The backend API is now live at **`http://localhost:5000`**.  
   Health check endpoint: **`http://localhost:5000/api/health`**.

---

### ⚛️ Step 3: Frontend Setup (React + Vite)

1. Open a **new terminal window** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the required Node packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   *Vite automatically proxies all `/api` and `/uploads` requests directly to Flask on `http://localhost:5000`.*

---

## 🔑 6. Default Demo Credentials

All portals use **Username + Password** authentication. You can sign in immediately using any of the pre-configured accounts:

| Portal | Role | Username | Password | Notes |
|---|---|---|---|---|
| **Admin Portal** | System Admin | `admin` | `admin123` | Full administrative control, approvals, settings |
| **Teacher Portal** | Faculty Instructor | `teacher` | `teacher123` | Assigned to Grades 6, 7, 8 & 9 (Dr. Rahul Sharma) |
| **Student Portal** | Grade 6 (Competitive) | `student6a1` | `student123` | Grade 6 Division A (Competitive Mode) |
| **Student Portal** | Grade 6 (Collaborative) | `student6b1` | `student123` | Grade 6 Division B (Collaborative Mode) |
| **Student Portal** | Grade 7 (Competitive) | `student1` | `student123` | Grade 7 Division A (Competitive Solo) |
| **Student Portal** | Grade 7 (Collaborative) | `student5` | `student123` | Grade 7 Division B (Squad Collaborator) |
| **Student Portal** | Grade 8 (Competitive) | `student7` | `student123` | Grade 8 Division A (Competitive Mode) |
| **Student Portal** | Grade 9 (Competitive) | `student9a1` | `student123` | Grade 9 Division A (Competitive Mode) |
| **Student Portal** | Grade 9 (Collaborative) | `student9b1` | `student123` | Grade 9 Division B (Quantum Squad) |

> 💡 *Note: You can also register a new student account instantly via the [Student Registration](http://localhost:5173/student/register) page, or register as a Teacher and approve the application via the Admin Panel.*

---

## 🌟 7. Key Features & Role Portals

### 🎓 1. Student Portal (`/student/*`)
- **Interactive Dashboard**: Real-time stats on completed quizzes, accuracy, rank within class, points, and current squad status.
- **Prerequisite Learning Paths**: Chapter progression locked until passing scores (70%) are earned on preceding modules.
- **Adaptive STEM Quizzes**: Unlimited practice attempts with instant feedback, time tracking, and detailed explanations upon passing.
- **Dual Leaderboards**:
  - **Solo Competitive Leaderboard**: Filtered by class & division with gold/silver/bronze badges and speed bonuses.
  - **Collaborative Squads**: Unified dropdown menu for *All Squad Teams*, *Join a Squad*, and *My Squad Team* with shared squad points.
- **Comprehensive Progress Analytics**: Visualized radar charts, topic-level accuracy bars, attempt timeline, and unlock status.
- **STEM Video Lessons Classroom**: Structured YouTube educational lectures mapped by **Subject → Category → Chapter** with theater-mode player, completion tracking, and quiz shortcuts.
- **24/7 AI STEM Assistant**: Powered by Groq LLM with full Markdown formula formatting and friendly explanations.

### 👩‍🏫 2. Teacher Portal (`/teacher/*`)
- **Cohort & Class Management**: Manage Grade 6–9 classes, student rosters, and assign competitive/collaborative learning modes.
- **Curriculum & Quiz Builder**: Create timed quizzes with custom passing criteria, points per question, and prerequisite sequencing.
- **AI Quiz Generator**: One-click quiz question generation using Groq / Gemini with difficulty calibration and instant saving into item banks.
- **YouTube Video Lessons Management**: Link educational YouTube video lectures mapped by **Subject → Category → Chapter**, with live URL validation, duration tags, and student publishing.
- **Anti-Cheat Supervisor & Audit**: Detects fullscreen exits, tab switches, and suspicious timestamps with options to *Accept*, *Invalidate*, or *Permit Retake*.
- **Squad Teams Allocation**: Create squads, generate unique squad join codes, and select score calculation policies (Average vs. Top Score).
- **ANOVA Telemetry & SPSS Export**: Review descriptive statistics and download anonymized CSV datasets for academic research.

### 🛡️ 3. Admin Superuser Portal (`/admin/*`)
- **Executive Telemetry Dashboard**: Platform-wide metrics, active learners, total quizzes completed, and system health status.
- **Faculty Approval Workflow**: Review pending teacher registrations, approve accounts, and assign classes.
- **Student Master Directory**: View, edit, filter, search, block, or delete any student across all grades.
- **Curriculum Architecture Engine**: Full CRUD for Classes, STEM Subjects, Categories, and Chapters.
- **Security & Audit Logs**: Real-time security events, IP tracking, failed login lockout detection, and automatic log cleanup.
- **Dynamic Content CMS**: In-browser content editor for Home, About Us, Leaderboard, and Footer sections.
- **Settings & API Key Management**: Live configuration of Groq and Gemini API keys with in-app test verification.

---

## 📺 8. Curriculum Video Lessons & Multimedia Hub

The platform features a structured multimedia classroom for curated educational video lessons:

### 🏛️ 1. Three-Tier Taxonomy Architecture
Every video lesson is strictly cataloged under:
$$\mathbf{Subject} \longrightarrow \mathbf{Category} \longrightarrow \mathbf{Chapter}$$

- **Science (🔬)**: Physics, Chemistry, Biology (Motion, Electricity, Cells, Atoms, Heat, Work-Energy).
- **Technology (💻)**: Programming, Digital Literacy (Coding Logic, Python Basics, Data Structures).
- **Mathematics (📐)**: Algebra, Geometry (Linear Equations, Quadrilaterals, Mensuration, Triangles).
- **English (📚)**: Grammar & Vocabulary, Reading Comprehension & Literature, Writing & Communication Skills.
*(Note: Engineering has been completely removed across the database and user interfaces to match middle school curriculum standards).*

### 🔒 2. Strict Role-Based Grade Isolation
- **Student Grade Enforcement**: Students exclusively receive videos, chapters, and quizzes corresponding to their enrolled grade (Grade 6, 7, 8, or 9). Any attempt to request other grades or `?grade=all` is blocked at the backend API gateway.
- **Teacher Assignment Enforcement**: Teachers only see and can publish videos for classes/grades explicitly assigned by the Administrator.
- **Distraction-Free In-App Player**: Videos play in a responsive, modal-based theater iframe using `youtube-nocookie.com`. External *"Open in YouTube"* links have been eliminated to prevent student distraction.

---

## 🎯 9. Gamified Point System & Leaderboards

STEMLearn employs an automated gamification engine that rewards student performance and drives engagement across both Competitive and Collaborative study conditions:

### 📐 1. Points Calculation Formula
Points are awarded upon quiz completion based on mastery accuracy:

$$\mathbf{Points\ Earned} = \text{Score Percentage} \times 10 \quad (\text{Applicable when Passed}, \ge 70\%)$$

| Quiz Performance | Outcome | Points Awarded | Progression Impact |
| :--- | :--- | :--- | :--- |
| **100% Score** | Passed | **+1000 Points** | Maximum mastery bonus, unlocks next chapter |
| **90% Score** | Passed | **+900 Points** | High mastery bonus, unlocks next chapter |
| **80% Score** | Passed | **+800 Points** | Standard passing score, unlocks next chapter |
| **70% Score** | Passed | **+700 Points** | Minimum passing threshold, unlocks next chapter |
| **< 70% Score** | Failed | **0 Points** | Prerequisite locked, retake required |

*(Note: In the event of an automated timer expiration/auto-submit, students receive partial participation credit of $\text{Score \%} \times 5$).*

### 🏆 2. Where Points Are Utilized
1. **Student Dashboard & Profile**: Tracks cumulative mastery XP and overall student level.
2. **Competitive Solo Leaderboard (Condition A)**: Ranks students within their class division by individual point totals.
3. **Collaborative Squads (Condition B)**: Aggregates all squad members' points into a collective Team Score to determine squad rankings.
4. **Achievement Badges**: Unlocks gamified milestone awards (e.g., Century Club, STEM Pioneer).

---

## 🤖 10. AI Configuration (Groq & Gemini)

STEMLearn integrates high-speed inference for AI Quiz Generation and the Student Study Tutor:

1. **Groq Cloud (Recommended)**:
   - Create a free account at [console.groq.com](https://console.groq.com).
   - Generate an API Key under **API Keys**.
   - Model used: `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`.
2. **Google Gemini**:
   - Create a free key at [Google AI Studio](https://aistudio.google.com).
   - Model used: `gemini-2.0-flash`.
3. **Where to set the keys**:
   - In `backend/.env`: `GROQ_API_KEY=gsk_...`
   - **OR** directly in the browser via the **Admin Portal → Settings → AI Provider Keys** tab!

---

## 📊 11. Research ANOVA Telemetry & Data Export

The platform is purpose-built to facilitate academic studies evaluating gamified learning mechanisms:
- **Independent Variable**: Learning Condition (Competitive Solo vs. Collaborative Squad).
- **Dependent Variables**: Quiz accuracy (%), completion time (seconds), attempt velocity (number of re-attempts), and participation rate.
- **Data Export**:
   - Navigate to **Teacher Portal → ANOVA Telemetry** or **Admin Portal → Settings**.
   - Click **Export SPSS CSV** to download a standardized dataset formatted with participant IDs, condition labels, timestamps, and scores.

---

## ❓ 12. Frequently Asked Questions & Troubleshooting

### Q1: `ModuleNotFoundError: No module named 'flask'`
> **Fix**: Ensure your virtual environment is active before running commands:
> - Windows: `.\venv\Scripts\Activate.ps1`
> - Linux/Mac: `source venv/bin/activate`

### Q2: MongoDB connection error (`ServerSelectionTimeoutError`)
> **Fix**: 
> - If using Local MongoDB: Check that the MongoDB service is running (`net start MongoDB` on Windows or check MongoDB Compass).
> - If using MongoDB Atlas: Verify your IP address is whitelisted (`0.0.0.0/0`) under **Network Access** in the Atlas dashboard and that your username/password in `MONGO_URI` are correct.

### Q3: Student AI Assistant returns "API rate limit reached" or "Invalid Model"
> **Fix**: Log in as `admin` (`admin123`), navigate to **Settings**, enter your Groq API key, select `llama-3.3-70b-versatile`, and click **Save Settings**. The platform will immediately switch to the active model.

### Q4: Port 5000 or 5173 is already in use
> **Fix**: 
> - Check running processes: `netstat -ano | findstr :5000`
> - Terminate the process: `taskkill /PID <PID> /F` (or choose another port in `config.py` and `vite.config.js`).

---

## 🏆 13. Production Build & Deployment

To create an optimized production bundle:

```bash
# 1. Build the React frontend
cd frontend
npm run build
# Output will be generated in frontend/dist/

# 2. Run backend behind a production WSGI server
cd ../backend
# Windows:
waitress-serve --port=5000 wsgi:app
# Linux / Production Server:
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

---

## 📜 14. Authors & Acknowledgements

- **Research Project**: Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards in Middle School STEM Learning.
- **Client & Academic Team**: Anushka Patare & Project Guide.
- **Platform**: STEMLearn Middle School Educational Suite.
