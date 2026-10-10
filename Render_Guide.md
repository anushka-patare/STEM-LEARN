# STEMLearn - Complete Zero-to-Production Setup & Render Deployment Guide

A comprehensive, step-by-step handbook to setting up **STEMLearn** from scratch on a brand new laptop, provisioning MongoDB Atlas cloud database, configuring GitHub, and deploying both the Flask backend and React Vite frontend to **Render.com**.

---

## Table of Contents
1. [Prerequisites & Laptop Setup](#1-prerequisites--laptop-setup)
2. [GitHub Setup & Repository Cloning](#2-github-setup--repository-cloning)
3. [MongoDB Atlas (Cloud Database) Setup](#3-mongodb-atlas-cloud-database-setup)
4. [Local Project Configuration & Database Seeding](#4-local-project-configuration--database-seeding)
5. [Local Testing & Verification](#5-local-testing--verification)
6. [Render Deployment: Backend (Web Service)](#6-render-deployment-backend-web-service)
7. [Render Deployment: Frontend (Static Site)](#7-render-deployment-frontend-static-site)
8. [Critical: SPA Refresh 404 Fix (Rewrite Rule)](#8-critical-spa-refresh-404-fix-rewrite-rule)
9. [Default Test User Credentials](#9-default-test-user-credentials)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. Prerequisites & Laptop Setup

Before cloning the project on a new laptop, install the following core tools:

### A. Install Git
1. Download Git from [git-scm.com](https://git-scm.com/downloads).
2. Run the installer with default settings.
3. Open your terminal (PowerShell / Command Prompt / Terminal) and verify:
   ```bash
   git --version
   ```
4. Configure your Git identity:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your-email@example.com"
   ```

### B. Install Python (3.11 or 3.12)
1. Download Python from [python.org](https://www.python.org/downloads/).
2. ⚠️ **IMPORTANT during installation**: Check the box that says **"Add python.exe to PATH"**.
3. Verify installation:
   ```bash
   python --version
   pip --version
   ```

### C. Install Node.js (LTS v18+ or v20+)
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/).
2. Run the installer and finish installation.
3. Verify installation:
   ```bash
   node -v
   npm -v
   ```

### D. Code Editor (Optional but recommended)
- Install [Visual Studio Code](https://code.visualstudio.com/).

---

## 2. GitHub Setup & Repository Cloning

### A. Clone the Repository
Open PowerShell or your terminal, navigate to your desired directory, and clone the repository:
```bash
git clone https://github.com/durgeshwagh14/STEM.git
cd STEM
```

### B. Project Structure Overview
```text
STEM/
├── backend/                  # Flask REST API + MongoDB backend
│   ├── app.py                # Application factory & route registration
│   ├── wsgi.py               # Production WSGI entry point (for Gunicorn)
│   ├── requirements.txt      # Python dependencies
│   ├── seed.py               # Database seeder (creates initial records)
│   └── routes/, services/    # Business logic
├── frontend/                 # React 19 + Vite frontend
│   ├── package.json          # Node dependencies & build scripts
│   ├── vite.config.js        # Vite configuration
│   └── src/                  # Components, pages, context, and services
│       └── services/api.js   # Axios instance with dynamic VITE_API_URL
├── README.md                 # Project documentation
└── Render_Guide.md           # This deployment guide
```

---

## 3. MongoDB Atlas (Cloud Database) Setup

Render does not offer a free managed persistent MongoDB instance. Therefore, **MongoDB Atlas (Free M0 Sandbox)** is used.

### Step 1: Create an Account & Cluster
1. Sign up or log in at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** $\rightarrow$ select **M0 (Free Tier)**.
3. Choose a Cloud Provider (AWS or Google Cloud) and a region closest to you (e.g., `Mumbai (ap-south-1)` or `Singapore`).
4. Click **Create Deployment**.

### Step 2: Create a Database User
1. In the left navigation bar, go to **Security** $\rightarrow$ **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** Authentication:
   - **Username**: `stem_admin` (or your preferred username)
   - **Password**: Create a strong password (e.g., `StemLearnSecure2026!#`). **Copy this password down.**
   - **Built-in Role**: `Read and write to any database`.
4. Click **Add User**.

### Step 3: Configure Network Access (IP Whitelist)
1. In the left navigation bar, go to **Security** $\rightarrow$ **Network Access**.
2. Click **Add IP Address**.
3. Click **Allow Access from Anywhere** (this enters `0.0.0.0/0`).
4. Click **Confirm**.
   *(Note: This is mandatory so Render's cloud servers can connect to your database).*

### Step 4: Get Your Connection String
1. Go to **Deployment** $\rightarrow$ **Database**.
2. Click the **Connect** button next to your cluster.
3. Choose **Drivers** (Python).
4. Copy the connection string format:
   ```text
   mongodb+srv://stem_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your user password and specify the database name `stem_learn`:
   ```text
   mongodb+srv://stem_admin:StemLearnSecure2026!#@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority
   ```
   Save this connection string.

---

## 4. Local Project Configuration & Database Seeding

To initialize the new database with subjects, grades (6–9), chapters, categories, and test user accounts, seed it once from your laptop.

### A. Set Up Backend Virtual Environment
```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(If execution policy error occurs: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*
- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

### B. Configure Backend `.env`
Inside the `backend/` folder, create a `.env` file:
```env
FLASK_ENV=development
PORT=5000
SECRET_KEY=stem_super_secret_dev_key_2026
JWT_SECRET_KEY=jwt_super_secret_dev_key_2026
MONGO_URI=mongodb+srv://stem_admin:StemLearnSecure2026!#@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority
```
*(Replace `MONGO_URI` with your actual Atlas connection string).*

### C. Seed Database
Run the seed script:
```bash
python seed.py
```
Expected output:
```text
✅ Connected to MongoDB
✅ Admin created: admin (admin@stemlearn.com)
✅ Classes created (Grades 6, 7, 8, 9)
✅ Subjects, categories, chapters created
✅ Demo teachers and students created
✅ Database seeded successfully!
```

---

## 5. Local Testing & Verification

### A. Run Backend
With the virtual environment active in `backend/`:
```bash
python wsgi.py
```
Open a browser and visit `http://localhost:5000/`. You should see:
```json
{
  "health_check": "/api/health",
  "message": "STEMLearn Backend API is online and running",
  "status": "healthy",
  "success": true,
  "version": "1.0.0"
}
```

### B. Run Frontend
Open a **new** terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
Test logging in with:
- **Admin**: `admin` / `admin123`
- **Student**: `student1@stemlearn.com` / `Student@123`

---

## 6. Render Deployment: Backend (Web Service)

### Step 1: Create Web Service
1. Log in to [dashboard.render.com](https://dashboard.render.com/) with GitHub.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your repository `STEM` (or your fork) and click **Connect**.

### Step 2: Configure Service Details
Fill in the deployment settings:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `stemlearn-backend` | Unique identifier URL on Render |
| **Region** | `Singapore` / `Frankfurt` / `Oregon` | Choose region closest to your users |
| **Branch** | `main` | Production branch |
| **Root Directory** | `backend` | **Critical**: Points to the Flask app folder |
| **Runtime** | `Python 3` | Python runtime environment |
| **Build Command** | `pip install -r requirements.txt` | Installs Gunicorn, Flask, PyMongo, etc. |
| **Start Command** | `gunicorn wsgi:app` | Production WSGI HTTP server |
| **Instance Type** | `Free` | Free tier |

### Step 3: Add Environment Variables
Scroll down to **Environment Variables** and add the following:

| Key | Value |
| :--- | :--- |
| `MONGO_URI` | `mongodb+srv://stem_admin:password@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority` |
| `SECRET_KEY` | `stem_super_secret_production_key_2026` |
| `JWT_SECRET_KEY` | `jwt_super_secure_key_2026_xyz` |
| `FLASK_ENV` | `production` |
| `PYTHON_VERSION` | `3.12.0` |

*(Optional AI Keys: `GROQ_API_KEY`, `GEMINI_API_KEY` if AI Tutor features are enabled).*

### Step 4: Deploy & Verify
1. Click **Create Web Service**.
2. Wait for the build log to complete with `==> Your service is live 🎉`.
3. Copy your live backend URL (e.g. `https://stemlearn-backend.onrender.com`).
4. Test in your browser: `https://stemlearn-backend.onrender.com/`
   You should see:
   ```json
   {
     "health_check": "/api/health",
     "message": "STEMLearn Backend API is online and running",
     "status": "healthy",
     "success": true,
     "version": "1.0.0"
   }
   ```

---

## 7. Render Deployment: Frontend (Static Site)

### Step 1: Create Static Site
1. In Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Connect the same repository `STEM`.

### Step 2: Configure Static Site Details
Fill in the settings:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Name** | `stemlearn-frontend` | Unique identifier URL on Render |
| **Branch** | `main` | Production branch |
| **Root Directory** | `frontend` | **Critical**: Points to Vite React folder |
| **Build Command** | `npm install && npm run build` | Builds production bundle into `dist` |
| **Publish Directory** | `dist` | Production static bundle folder |

### Step 3: Add Environment Variable
Add the backend API URL:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://stemlearn-backend.onrender.com` |

*(Replace with your actual backend URL from Section 6. Do NOT add trailing slashes).*

---

## 8. Critical: SPA Refresh 404 Fix (Rewrite Rule)

Because STEMLearn is a React Single Page Application (SPA), navigating to a path like `/student/register` works in-memory. However, refreshing (F5) causes the browser to request `/student/register` directly from the server. If this rule is not configured, Render returns **`Not Found`**.

### Configure Rewrite in Render:
1. In your **`stemlearn-frontend`** Static Site on Render, go to **Settings** $\rightarrow$ **Redirects/Rewrites** (or select the tab in the left sidebar).
2. Click **Add Rule** (or **Add Redirect/Rewrite**).
3. Set the following:

| Field | Value |
| :--- | :--- |
| **Action / Type** | **`Rewrite`** *(Do not choose Redirect)* |
| **Source** | **`/*`** |
| **Destination** | **`/index.html`** |

4. Click **Save Changes**.
5. Once saved, click **Deploy Static Site** (or **Manual Deploy** $\rightarrow$ **Deploy latest commit**).
6. Your frontend is live at: `https://stemlearn-frontend.onrender.com`!

---

## 9. Default Test User Credentials

After running `seed.py`, the following demo accounts are available:

### Administrator
- **Login URL**: `https://<frontend-url>/admin/login`
- **Username / Email**: `admin` (or `admin@stemlearn.com`)
- **Password**: `admin123`
- **Capabilities**: Full access to user approvals, curriculum, logs, and telemetry.

### Faculty / Teacher
- **Login URL**: `https://<frontend-url>/teacher/login`
- **Email**: `teacher@stemlearn.com`
- **Password**: `Teacher@123`
- **Capabilities**: Manage assigned classes, create quizzes, monitor squads and performance.

### Student Explorer
- **Login URL**: `https://<frontend-url>/student/login`
- **Email**: `student1@stemlearn.com`
- **Password**: `Student@123`
- **Capabilities**: Access video lectures, solve quizzes, track progress, join collaborative squads.

---

## 10. Troubleshooting & FAQs

### Q1: When logging in, I see "Network Error" on the frontend.
- **Cause**: CORS rejection or incorrect `VITE_API_URL`.
- **Fix**:
  1. Check the `VITE_API_URL` environment variable on your Render Static Site. It must match your live backend URL (e.g. `https://stemlearn-backend.onrender.com`).
  2. Verify that your backend is running by opening `https://stemlearn-backend.onrender.com/api/health`.
  3. Clear browser cache and trigger a fresh deployment on Render via **Manual Deploy** $\rightarrow$ **Clear build cache & deploy**.

### Q2: Why does the first request take 30–50 seconds?
- **Explanation**: Render Free Tier Web Services spin down ("sleep") after 15 minutes of inactivity. The first visitor triggers a cold start, which takes 30–50 seconds to wake up the server. Subsequent requests will be fast.

### Q3: When refreshing subpages, I see "Not Found".
- **Fix**: Ensure the **Rewrite** rule (`/*` $\rightarrow$ `/index.html`) is active in Render under **Redirects/Rewrites**.

### Q4: Database connection fails on Render (`ServerSelectionTimeoutError`).
- **Fix**:
  1. Go to MongoDB Atlas $\rightarrow$ **Network Access**.
  2. Ensure IP `0.0.0.0/0` (Allow access from anywhere) is active.
  3. Ensure the database user password in `MONGO_URI` is correct and special characters are URL-encoded if applicable.

### Q5: How do I deploy code updates in the future?
- Simply push commits to GitHub:
  ```bash
  git add .
  git commit -m "Your update description"
  git push origin main
  ```
- Render will automatically trigger a new build and deploy both your backend and frontend.
