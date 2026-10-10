# 🚀 STEMLearn – शून्य ते Render Live संपूर्ण मार्गदर्शक (Complete Zero-to-Production Guide)

हा मार्गदर्शक नवीन लॅपटॉप, नवीन GitHub अकाउंट, नवीन MongoDB Atlas क्लाउड डेटाबेस आणि Render वर Frontend + Backend लाइव्ह करण्यासाठी **शून्यापासून (Step-by-Step)** तयार केला आहे.

---

## 📑 अनुक्रमणिका (Table of Contents)
1. [प्रोजेक्ट आर्किटेक्चर (System Architecture)](#-१-प्रोजेक्ट-आर्किटेक्चर)
2. [नवीन लॅपटॉपवर सॉफ्टवेअर इन्स्टॉलेशन (Laptop Prerequisites)](#-२-नवीन-लॅपटॉपवर-सॉफ्टवेअर-इन्स्टॉलेशन)
3. [MongoDB Atlas वर मोफत क्लाउड डेटाबेस तयार करणे](#-३-mongodb-atlas-वर-मोफत-क्लाउड-डेटाबेस-तयार-करणे)
4. [GitHub वर नवीन रिपॉझिटरी व कोड पुश करणे](#-४-github-वर-नवीन-रिपॉझिटरी-व-कोड-पुश-करणे)
5. [लोकल टेस्टिंग आणि डेटाबेस सीडिंग (Local Run & Seed)](#-५-लोकल-टेस्टिंग-आणि-डेटाबेस-सीडिंग)
6. [Render वर Backend (Web Service) Live करणे](#-६-render-वर-backend-web-service-live-करणे)
7. [Render वर Frontend (Static Site) Live करणे](#-७-render-वर-frontend-static-site-live-करणे)
8. [अतिशय महत्त्वाचे: Page Refresh "Not Found" Fix (SPA Rewrite Rule)](#-८-अतिशय-महत्त्वाचे-page-refresh-not-found-fix)
9. [डिफॉल्ट लॉगिन क्रेडेंशियल्स व चाचणी (Verification)](#-९-डिफॉल्ट-लॉगिन-क्रेडेंशियल्स-व-चाचणी)
10. [नेहमी विचारले जाणारे प्रश्न व समस्या निवारण (Troubleshooting FAQ)](#-१०-नेहमी-विचारले-जाणारे-प्रश्न-व-समस्या-निवारण)

---

## 🏗️ १. प्रोजेक्ट आर्किटेक्चर

```
┌────────────────────────────────┐         ┌────────────────────────────────┐
│   Render Static Site           │         │   Render Web Service           │
│   (React 19 + Vite Frontend)   │ ──────> │   (Python Flask + Gunicorn)    │
│   https://stem-frontend...     │  CORS   │   https://stem-backend...      │
└────────────────────────────────┘         └────────────────────────────────┘
                                                           │
                                                           │ PyMongo
                                                           ▼
                                           ┌────────────────────────────────┐
                                           │   MongoDB Atlas Cloud (M0)     │
                                           │   Database: stem_learn         │
                                           └────────────────────────────────┘
```

---

## 💻 २. नवीन लॅपटॉपवर सॉफ्टवेअर इन्स्टॉलेशन

नवीन लॅपटॉपवर खालील सॉफ्टवेअर्स अधिकृत वेबसाईटवरून डाउनलोड करून इन्स्टॉल करा:

### १. Python (Version 3.11 किंवा 3.12)
- लिंक: [python.org/downloads](https://www.python.org/downloads/)
- ⚠️ **महत्त्वाचे:** इन्स्टॉलेशन करताना **"Add python.exe to PATH"** या पर्यायावर आवर्जून टिक करा.

### २. Node.js (LTS Version 20+)
- लिंक: [nodejs.org](https://nodejs.org/)
- LTS व्हर्जन डाउनलोड करून नेक्स्ट-नेक्स्ट करून इन्स्टॉल करा (यासोबत `npm` आपोआप येतो).

### ३. Git for Windows
- लिंक: [git-scm.com/download/win](https://git-scm.com/download/win)
- डीफॉल्ट सेटींग्स ठेवून इन्स्टॉल करा.

### ४. VS Code (किंवा आवडीचा कोड एडिटर)
- लिंक: [code.visualstudio.com](https://code.visualstudio.com/)

### इन्स्टॉलेशन तपासण्यासाठी (PowerShell / Terminal उघडा):
```powershell
python --version
node -v
npm -v
git --version
```
*(चारही कमांड्सना एरर न येता व्हर्जन नंबर दिसला पाहिजे).*

---

## 🍃 ३. MongoDB Atlas वर मोफत क्लाउड डेटाबेस तयार करणे

Render वर मोफत persistent डेटाबेस नसतो, त्यामुळे MongoDB Atlas (कायमस्वरूपी मोफत 512MB M0 Cluster) वापरणे सर्वोत्तम आहे:

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) वर जा आणि **Try Free** / **Sign Up** करा.
2. **Create a Deployment / Cluster:**
   - **M0 Sandbox (Free Tier)** निवडा.
   - Provider: **AWS** किंवा **Google Cloud**.
   - Region: भारताजवळचे निवडा (उदा. `Mumbai (ap-south-1)` किंवा `Singapore (ap-southeast-1)`).
   - **Create Cluster** बटणावर क्लिक करा.
3. **डेटाबेस युझर तयार करा (Database Access):**
   - डाव्या मेन्यूमध्ये **Database Access** वर जा $\rightarrow$ **Add New Database User**.
   - **Authentication Method:** Password
   - **Username:** `stem_admin`
   - **Password:** मजबूत पासवर्ड ठेवा (उदा. `StemPass2026!#`) आणि सुरक्षित लिहून ठेवा.
   - **Database User Privileges:** `Read and write to any database`
   - **Add User** वर क्लिक करा.
4. **सर्व ठिकाणाहून अ‍ॅक्सेस उघडा (Network Access):**
   - डाव्या मेन्यूमध्ये **Network Access** वर जा $\rightarrow$ **Add IP Address**.
   - **Allow Access From Anywhere** पर्यायावर क्लिक करा (IP: `0.0.0.0/0`).
   - **Confirm** करा. *(हे न केल्यास Render सर्व्हर डेटाबेसशी कनेक्ट होऊ शकत नाही).*
5. **Connection String कॉपी करा:**
   - डाव्या मेन्यूमध्ये **Database** / **Clusters** वर जा आणि **Connect** वर क्लिक करा.
   - **Drivers** (Python 3.12+) पर्याय निवडा.
   - तुम्हाला असा URL दिसेल:
     ```text
     mongodb+srv://stem_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - यातील `<password>` काढून तुमचा खरा पासवर्ड टाका आणि शेवटी डेटाबेसचे नाव `/stem_learn` टाका:
     ```text
     mongodb+srv://stem_admin:StemPass2026!#@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority
     ```
   *(ही लिंक तुमच्या Backend ला लागणार आहे).*

---

## 🐙 ४. GitHub वर नवीन रिपॉझिटरी व कोड पुश करणे

1. [github.com](https://github.com/) वर लॉगिन करा आणि **New Repository** तयार करा:
   - Repository Name: `STEM` किंवा `STEMLearn`
   - Public किंवा Private (आवडीनुसार)
   - **Do not** add README (प्रोजेक्टमध्ये आधीच आहे).
   - **Create repository** वर क्लिक करा.

2. तुमच्या लॅपटॉपवर प्रोजेक्ट फोल्डरमध्ये Git सेट करा:
   ```powershell
   # युझर नेम व ईमेल सेट करा
   git config --global user.name "Your Name"
   git config --global user.email "your_email@example.com"

   # कोड कमिट व पुश करा
   git add .
   git commit -m "Complete STEMLearn platform ready for deployment"
   git branch -M main
   git remote add origin https://github.com/<your-username>/STEM.git
   git push -u origin main
   ```

---

## 🧪 ५. लोकल टेस्टिंग आणि डेटाबेस सीडिंग

नवीन डेटाबेसमध्ये सर्व Classes, Subjects, Categories आणि Admin/Teacher/Student खाती भरण्यासाठी एकदा seed स्क्रिप्ट रन करावी लागते:

### पायरी १: Backend सुरु करा व डेटाबेस Seed करा
```powershell
# 1. Backend फोल्डरमध्ये जा
cd backend

# 2. व्हर्च्युअल एन्व्हायर्नमेंट तयार करा व अ‍ॅक्टिव्हेट करा
python -m venv venv
venv\Scripts\activate

# 3. लायब्ररी इन्स्टॉल करा
pip install -r requirements.txt

# 4. .env फाईल तयार करा (backend फोल्डरमध्ये)
# खालील माहितीसह .env फाईल सेव्ह करा:
```
**`backend/.env` फाईलचा मजकूर:**
```env
MONGO_URI=mongodb+srv://stem_admin:StemPass2026!#@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority
SECRET_KEY=stem_super_secret_local_dev_key_2026
JWT_SECRET_KEY=jwt_super_secret_local_dev_key_2026
FLASK_ENV=development
```

```powershell
# 5. क्लाउड डेटाबेसमध्ये सुरुवातीचा डेटा भरा (Seed Run):
python seed.py
```
👉 तुम्हाला **`✅ Database seeded successfully!`** असा मेसेज दिसेल. आता तुमच्या MongoDB Atlas क्लाउड डेटाबेसमध्ये सर्व युझर्स, इयत्ता आणि विषय तयार झाले आहेत.

```powershell
# 6. Backend चालू करून तपासा:
python app.py
```
*(ब्राउझरमध्ये `http://localhost:5000/api/health` उघडल्यास `{"status": "healthy"}` दिसेल).*

### पायरी २: Frontend चालू करून तपासा
नवीन टर्मिनल उघडा:
```powershell
cd frontend
npm install
npm run dev
```
*(ब्राउझरमध्ये `http://localhost:5173` उघडल्यास वेब अ‍ॅप सुरळीत चालेल).*

---

## 🚀 ६. Render वर Backend (Web Service) Live करणे

1. [dashboard.render.com](https://dashboard.render.com) वर GitHub द्वारे Sign Up / Log In करा.
2. वर उजव्या कोपऱ्यात **New +** $\rightarrow$ **Web Service** वर क्लिक करा.
3. तुमची GitHub रिपॉझिटरी निवडा (`Connect` वर क्लिक करा).
4. खालीलप्रमाणे अचूक सेटींग्स भरा:

| फील्ड (Field Name) | काय भरायचे? |
| :--- | :--- |
| **Name** | `stemlearn-backend` (किंवा आवडीचे नाव) |
| **Region** | `Singapore` किंवा `Frankfurt` |
| **Branch** | `main` |
| **Root Directory** | `backend` *(अतिशय महत्त्वाचे)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn wsgi:app` |
| **Instance Type** | **Free** |

5. **Environment Variables (खाली स्क्रोल करून Add Environment Variable वर क्लिक करा):**
   - `MONGO_URI` = `mongodb+srv://stem_admin:your_password@cluster0.xxxxx.mongodb.net/stem_learn?retryWrites=true&w=majority`
   - `SECRET_KEY` = `stem_production_super_secret_key_2026_xyz`
   - `JWT_SECRET_KEY` = `jwt_production_super_secure_token_key_2026`
   - `FLASK_ENV` = `production`
   - `PYTHON_VERSION` = `3.12.0`
   - *(पर्यायी)* `GROQ_API_KEY` = तुमचा Groq AI API Key (AI Tutor साठी)
   - *(पर्यायी)* `GEMINI_API_KEY` = तुमचा Google Gemini API Key

6. खाली **Deploy Web Service** वर क्लिक करा.
7. २-३ मिनिटांत स्टेटस **`Live`** होईल.
8. वर डाव्या बाजूला तुम्हाला Backend चा लाइव्ह URL दिसेल:
   👉 **`https://stemlearn-backend.onrender.com`**
   *(हा URL कॉपी करून ठेवा, तो पुढील टप्प्यात Frontend ला द्यावा लागतो).*

---

## 🎨 ७. Render वर Frontend (Static Site) Live करणे

1. Render Dashboard वर पुन्हा वर **New +** $\rightarrow$ **Static Site** वर क्लिक करा.
2. तेच GitHub रिपॉझिटरी सिलेक्ट करा (`Connect`).
3. खालीलप्रमाणे सेटींग्स भरा:

| फील्ड (Field Name) | काय भरायचे? |
| :--- | :--- |
| **Name** | `stemlearn-frontend` (किंवा आवडीचे नाव) |
| **Branch** | `main` |
| **Root Directory** | `frontend` *(अतिशय महत्त्वाचे)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` *(अतिशय महत्त्वाचे)* |

4. **Environment Variables (Add Environment Variable):**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://stemlearn-backend.onrender.com` *(टप्पा ६ मधील Backend चा थेट URL)*

5. खाली **Deploy Static Site** वर क्लिक करा.

---

## 🔄 ८. अतिशय महत्त्वाचे: Page Refresh "Not Found" Fix

React हे Single Page Application (SPA) असल्यामुळे, जर युझरने कोणत्याही पेजवर (उदा. `/student/login` किंवा `/teacher/dashboard`) **Refresh (F5)** केले, तर Render चा सर्व्हर `Not Found` दाखवतो. हा प्रॉब्लेम सोडवण्यासाठी खालील १ नियम लगेच जोडा:

1. Render Dashboard वर तुमच्या Frontend च्या **Static Site** वर क्लिक करा.
2. डाव्या बाजूच्या मेन्यूमध्ये **Redirects/Rewrites** वर क्लिक करा.
3. **Add Rule** (किंवा Add Redirect/Rewrite) वर क्लिक करा.
4. खालीलप्रमाणे भरा:

| फील्ड | व्हॅल्यू |
| :--- | :--- |
| **Action / Type** | **`Rewrite`** *(Redirect नाही, Rewrite निवडा)* |
| **Source** | **`/*`** |
| **Destination** | **`/index.html`** |

5. **Save Changes** वर क्लिक करा.
*(हे सेव्ह केल्यावर पेज रिफ्रेश केल्यावर `Not Found` येणार नाही आणि सर्व पेजेस सुरळीत सुरू राहतील).*

---

## 🔑 ९. डिफॉल्ट लॉगिन क्रेडेंशियल्स व चाचणी

डेटाबेस सीडिंग झाल्यानंतर खालील टेस्ट खात्यांनी थेट लॉगिन करता येते:

| रोल (Role) | Username / Email | Password | काय अ‍ॅक्सेस मिळेल? |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` किंवा `admin@stemlearn.com` | `admin123` | Teachers Approval, Student Management, Analytics, System Settings |
| **Teacher** | `teacher@stemlearn.com` | `Teacher@123` | My Classes, Students, Quiz Creator, Question Bank, Teams |
| **Student (Grade 7)** | `student1@stemlearn.com` | `Student@123` | Video Lessons, Quizzes, Leaderboards, AI Tutor, Badges |
| **Student (Grade 8)** | `student2@stemlearn.com` | `Student@123` | Grade 8 Curriculum |

---

## ❓ १०. नेहमी विचारले जाणारे प्रश्न व समस्या निवारण

### प्रश्न १: पहिली विनंती (First request) पाठवल्यावर ३०-४५ सेकंद लोड होत राहते, का?
- **कारण:** Render चा मोफत वेब सर्व्हर १५ मिनिटे कोणी न वापरल्यास तात्पुरता **Sleep Mode (Spin-down)** मध्ये जातो.
- **उपाय:** पहिल्यांदा साईट उघडल्यावर फक्त ३०-४० सेकंद थांबा, सर्व्हर जागी झाल्यावर संपूर्ण साईट एकदम वेगाने धावते.

### प्रश्न २: लॉगिन करताना "Network Error" का येतो?
- **तपासणी १:** Render Frontend मधील `VITE_API_URL` बरोबर Backend च्या URL ला मॅच होतो का तपासा.
- **तपासणी २:** MongoDB Atlas मधील Network Access मध्ये `0.0.0.0/0` (Allow Access from Anywhere) अ‍ॅक्टिव्ह आहे का तपासा.
- **तपासणी ३:** Render Backend logs मध्ये जाऊन सर्व्हर क्रॅश झाला नाही ना याची खात्री करा.

### प्रश्न ३: नवीन बदल (Changes) लॅपटॉपवर केल्यावर ते Render वर कसे पाठवायचे?
फक्त तुमच्या लॅपटॉपवर Git Push करा:
```powershell
git add .
git commit -m "Added new updates"
git push origin main
```
Render आपोआप नवीन बदल डिटेक्ट करून १-२ मिनिटांत री-डिप्लॉय करतो! 🚀
