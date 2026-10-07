## Project Title

**STEMLearn – Evaluating the Effectiveness of Competitive vs. Collaborative Leaderboards in Middle School STEM Learning**

Build a complete, production-ready, responsive web application for a research project that evaluates the effectiveness of **competitive vs. collaborative leaderboards** among middle-school students in STEM learning.

The application is a **STEM quiz-based learning platform for students in Grades 6, 7, and 8**.

The system must support three completely separated roles:

1. **Student**
2. **Teacher**
3. **Admin**

Technology stack:

* Frontend: **React.js**
* Backend: **Python Flask**
* Database: **MongoDB**
* API architecture: **REST API**
* Authentication: **JWT**
* Password security: **bcrypt/secure password hashing**
* Charts: **Recharts or Chart.js**
* UI: **modern responsive UI using Tailwind CSS or Bootstrap**
* AI providers:

  * **Groq API**
  * **Google Gemini API**

---

# 1. CORE RESEARCH OBJECTIVE

The platform must experimentally compare:

### Competitive Mode

Students participate individually.

Each student receives an individual score and appears on an individual leaderboard.

### Collaborative Mode

Students participate as teams.

Teams receive scores based on the configured team scoring method and appear on a team leaderboard.

### Critical Research Requirement

The quiz content must remain identical between competitive and collaborative conditions whenever the same research quiz is used.

The following should remain consistent:

* Questions
* Difficulty
* Marks
* Time limit
* Passing percentage
* Quiz sequence
* Learning content

Only the participation/leaderboard condition should change.

The system must collect research data without automatically declaring one mode better than the other.

---

# 2. APPLICATION STRUCTURE

The application must have four completely separate experiences:

```text
PUBLIC WEBSITE
STUDENT PANEL
TEACHER PANEL
ADMIN PANEL
```

Do not mix sidebars, navigation items, permissions, or dashboards between roles.

---

# 3. PUBLIC WEBSITE

Main URL:

```text
/
```

Navbar:

```text
LOGO

Home
About Us
Contact Us

Login ▼
    Student Login
    Teacher Login
```

Do NOT show Admin Login in the public navbar.

Admin is accessible only through a dedicated protected URL.

Example:

```text
/admin/login
```

The public website must have:

* Responsive header
* Responsive footer
* Hero section
* About section
* STEM subjects section
* Competitive vs Collaborative explanation
* How it works
* Research objective
* Features
* Call to action
* Contact section

Design must be:

* Modern
* Attractive
* Clean
* Educational
* Child-friendly
* Professional
* Mobile responsive
* Tablet responsive
* Desktop responsive
* Accessible

---

# 4. LOGIN SYSTEM

All login systems must be separate.

## Student

```text
/student/login
/student/register
```

Student can register and login.

Registration fields:

* Full Name
* Student ID
* Class/Grade
* Division
* Roll Number
* Email/Username
* Mobile Number
* Password
* Profile Photo

Admin should also be able to create student accounts.

---

## Teacher

```text
/teacher/login
```

Teachers cannot publicly register.

Teacher accounts are created by Admin.

Teacher information:

* Teacher ID
* Name
* Photo
* Education
* Email
* Mobile
* Username
* Password
* Subject specialization
* Assigned classes
* Status

---

## Admin

```text
/admin/login
```

Admin account must be created securely during deployment/initial setup.

Admin must have the highest authorization level.

---

# 5. LOGIN PAGE UI

Student and Teacher login pages must be standalone.

When a user enters:

```text
/student/login
```

or

```text
/teacher/login
```

do NOT display the public website header/footer.

Show only:

```text
Logo

Welcome Back

Username / Email
Password

[ Login ]

Forgot Password?

Back to Website
```

---

# 6. ROLE-BASED ACCESS CONTROL

Use JWT authentication and backend authorization.

Roles:

```text
student
teacher
admin
```

Every protected Flask API must verify:

1. JWT
2. User identity
3. User role
4. Resource ownership/permission

Do not rely only on frontend route protection.

A student must never gain teacher/admin access by manually changing the URL.

A teacher must never gain admin access by manually changing the URL.

---

# 7. SEPARATE SIDEBARS

Every panel must have its own sidebar.

## Student Sidebar

```text
Dashboard
Learning
Subjects
My Quizzes
My Results
Leaderboard
My Team
My Progress
AI Study Assistant
Profile
Change Password
Logout
```

Student must NOT see:

```text
Teacher Management
Admin
System Settings
All Students
All Teachers
```

---

## Teacher Sidebar

```text
Dashboard
My Classes
Students
Learning Paths
Subjects
Quizzes
Questions
Teams
Leaderboard
Research Data
AI Quiz Generator
Profile
Change Password
Logout
```

Teacher must only see assigned classes/students.

Teacher must NOT see:

```text
Admin Dashboard
Global User Management
All Teachers
System Settings
```

---

## Admin Sidebar

```text
Dashboard

Teacher Management
Student Management
Class Management
Subject Management
Category Management
Chapter Management
Learning Path Management
Quiz Management
Question Management
Team Management

Research Data
Performance Analytics

AI Configuration
Login Logs

Profile
Change Password
System Settings

Logout
```

Admin sidebar is visible only inside the authenticated Admin panel.

---

# 8. ADMIN SECURITY

Admin must NOT be accessible through the public website sidebar/navbar.

Use:

```text
/admin/login
```

or another configurable secret route.

Important:

Hiding the Admin URL is not sufficient security.

The backend must enforce Admin authorization on every Admin API.

Implement:

* JWT
* Role-based access control
* Password hashing
* Login rate limiting
* Failed login tracking
* Secure session/token handling
* HTTPS-ready configuration
* API authorization
* Input validation
* Audit logging
* Secure environment variables
* Optional 2FA-ready architecture

Never expose:

* Passwords
* JWT secrets
* API keys
* Database credentials
* Internal system prompts

to the React frontend.

---

# 9. STUDENT DASHBOARD

After login:

```text
Welcome, [Student Name]
```

Dashboard cards:

```text
Available Learning
My Points
My Progress
My Rank
My Team
Current Learning Path
```

Show:

* Current subject
* Current chapter
* Current quiz
* Progress percentage
* Recently completed quiz
* Latest score
* Accuracy
* Points
* Rank

---

# 10. STUDENT LEARNING PATH

Students must NOT be allowed to randomly select any quiz.

The system must use a controlled step-by-step learning path.

Structure:

```text
Class
 ↓
Subject
 ↓
Category
 ↓
Chapter
 ↓
Quiz 1
 ↓
Quiz 2
 ↓
Quiz 3
 ↓
Final Exam
```

Example:

```text
Grade 7
 └── Science
      └── Physics
           └── Force and Motion
                ├── Quiz 1 – Basic Concepts
                ├── Quiz 2 – Force
                ├── Quiz 3 – Motion
                ├── Quiz 4 – Advanced Concepts
                └── Final Exam
```

The teacher controls the complete sequence.

---

# 11. QUIZ LOCKING

Initially:

```text
Quiz 1 = UNLOCKED

Quiz 2 = LOCKED
Quiz 3 = LOCKED
Quiz 4 = LOCKED
Final Exam = LOCKED
```

Student can only start the currently unlocked quiz.

Student must not be able to open a locked quiz by:

* Changing URL
* Changing quiz ID
* Calling API manually
* Editing frontend state
* Using browser developer tools

The Flask backend must independently validate quiz eligibility.

---

# 12. PASSING RULE

Teacher decides the passing percentage.

Example:

```text
Passing Percentage = 70%
```

If student scores:

```text
80%
```

then:

```text
PASS
```

Next quiz becomes unlocked.

If student scores:

```text
55%
```

then:

```text
FAIL
```

Next quiz remains locked.

Student must pass the current quiz before continuing.

---

# 13. FAILED QUIZ RULES

Teacher can configure:

```text
Allow Retry
Retry Limit
Retry Delay
Manual Teacher Unlock
```

Possible settings:

```text
Retry immediately
Retry after 1 hour
Retry next day
Teacher approval required
Maximum attempts
```

Do not unlock the next quiz until the configured passing condition is satisfied.

---

# 14. FINAL EXAM

Final Exam remains locked until all required previous quizzes are completed/passed.

Example:

```text
Quiz 1 ✅
Quiz 2 ✅
Quiz 3 ✅
Quiz 4 ✅
Final Exam 🔓
```

Teacher controls:

* Final Exam questions
* Duration
* Marks
* Passing percentage
* Maximum attempts
* Security settings
* Question randomization
* Result visibility

---

# 15. STUDENT QUIZ INTERFACE

Before starting:

```text
Quiz Instructions

Quiz:
Force and Motion – Quiz 2

Questions:
10

Time:
10 minutes

Total Marks:
10

Passing:
70%

Security:
Fullscreen required

[ Start Quiz ]
```

After clicking Start:

```text
Request Fullscreen
        ↓
Start Quiz
```

---

# 16. SECURE QUIZ MODE

Implement a secure assessment mode.

When quiz starts:

* Request fullscreen
* Start timer
* Disable normal navigation
* Detect fullscreen exit
* Detect tab switching
* Detect page visibility changes
* Detect window focus loss
* Detect page refresh
* Detect navigation attempts
* Record security violations
* Optionally disable copy/paste
* Optionally disable right click
* Warn student

Do NOT claim that the application can monitor every application running on the student's computer.

Browser-based security should use events that web applications can actually detect.

---

# 17. SECURITY VIOLATION SYSTEM

Teacher can configure:

```text
Require Fullscreen
ON/OFF

Tab Switch Detection
ON/OFF

Window Focus Detection
ON/OFF

Refresh Protection
ON/OFF

Copy Protection
ON/OFF

Paste Protection
ON/OFF

Right Click
ON/OFF

Maximum Violations
3

Violation Action:
Warning
Auto Submit
Lock Test
```

Example:

```text
Violation 1
Warning

Violation 2
Warning

Violation 3
Auto Submit
```

---

# 18. QUIZ SECURITY EVENTS

Create:

```text
quiz_security_events
```

Store:

```text
student_id
quiz_id
attempt_id
event_type
timestamp
violation_number
action_taken
```

Event types:

```text
FULLSCREEN_EXIT
TAB_SWITCH
WINDOW_BLUR
PAGE_REFRESH
NAVIGATION_ATTEMPT
COPY_ATTEMPT
PASTE_ATTEMPT
```

Teacher should be able to see security events for their assigned students.

Admin can see all security events.

---

# 19. TIMER

Quiz timer must be controlled by the backend.

Do not rely only on React/browser timer.

Store:

```text
started_at
expires_at
submitted_at
```

The server should determine whether the attempt is still valid.

If the timer expires:

```text
Automatically submit quiz
```

---

# 20. QUESTION TYPES

Support initially:

```text
Multiple Choice
True / False
```

Architecture should allow future support for:

```text
Fill in the Blank
Short Answer
Image Question
Matching
```

---

# 21. RESULT PAGE

After submission:

```text
🎉 Quiz Completed!

Score: 8 / 10

Correct Answers: 8
Wrong Answers: 2
Accuracy: 80%

Points Earned: +80

Previous Score: 70%
Current Score: 80%
Improvement: +10%
```

Show:

```text
PASS ✅
```

or:

```text
FAIL ❌
```

Then:

```text
[ View Result ]

[ View Leaderboard ]

[ Continue Learning ]
```

If failed:

```text
Next Quiz: LOCKED
```

---

# 22. COMPETITIVE MODE

Students participate individually.

Example:

```text
Rank | Student | Score | Accuracy | Points
1       A         95%      95%       950
2       B         90%      90%       900
3       C         85%      85%       850
```

Track:

* Score
* Accuracy
* Points
* Number of quizzes completed
* Participation
* Improvement
* Rank
* Completion rate

---

# 23. COLLABORATIVE MODE

Students participate as teams.

Example:

```text
Team Alpha

Student A
Student B
Student C
Student D
```

Teacher/Admin must configure the team scoring formula.

Possible formula:

```text
Average member score
```

or:

```text
Sum of valid member points
```

The selected formula must be stored and consistently applied.

Example:

```text
Rank | Team | Score | Points
1       Alpha    92%     920
2       Beta     87%     870
3       Gamma    81%     810
```

---

# 24. LEADERBOARD SETTINGS

Teacher can enable/disable:

```text
Competitive Leaderboard
Collaborative Leaderboard
```

Teacher can configure displayed metrics.

Avoid exposing unnecessary personal information.

---

# 25. STUDENT PROGRESS

Show:

```text
Quizzes Attempted
Average Score
Accuracy
Points
Current Rank
Improvement
Learning Path Progress
```

Charts:

* Score trend
* Accuracy trend
* Subject performance
* Quiz performance
* Points trend

Example:

```text
Quiz 1 → 60%
Quiz 2 → 68%
Quiz 3 → 72%
Quiz 4 → 80%
```

---

# 26. TEACHER DASHBOARD

Teacher sees only assigned classes.

Cards:

```text
Assigned Classes
Students
Active Quizzes
Average Score
Participation
Completion Rate
```

Charts:

* Class performance
* Subject performance
* Quiz performance
* Student performance
* Competitive participation
* Collaborative participation

---

# 27. TEACHER STUDENT MANAGEMENT

Teacher can:

* View assigned students
* View scores
* View accuracy
* View quiz attempts
* View progress
* View team
* View participation
* View security violations
* Filter data

Filters:

```text
Class
Division
Subject
Chapter
Quiz
Mode
Date
Student
```

Teacher cannot manage students outside assigned classes unless Admin grants permission.

---

# 28. TEACHER QUIZ MANAGEMENT

Teacher can:

```text
Create Quiz
Edit Quiz
Delete Quiz
Publish Quiz
Unpublish Quiz
Duplicate Quiz
Reorder Quiz
```

Quiz fields:

```text
Title
Class
Subject
Category
Chapter
Description
Difficulty
Duration
Marks
Passing Percentage
Sequence Number
Learning Path
Final Exam
```

---

# 29. TEACHER QUESTION MANAGEMENT

Fields:

```text
Question
Option A
Option B
Option C
Option D
Correct Answer
Explanation
Marks
Difficulty
Topic
```

Teacher must be able to preview the quiz before publishing.

---

# 30. TEACHER LEARNING PATH BUILDER

Create a drag-and-drop or ordered sequence:

```text
Subject
 ↓
Category
 ↓
Chapter
 ↓
Quiz 1
 ↓
Quiz 2
 ↓
Quiz 3
 ↓
Final Exam
```

Teacher can:

* Add quiz
* Remove quiz
* Reorder quiz
* Set passing percentage
* Set prerequisite
* Set retry rules
* Set final exam
* Publish learning path

---

# 31. AI QUIZ GENERATOR

Add:

```text
Teacher → AI Quiz Generator
```

Teacher selects:

```text
Class
Subject
Category
Chapter
Topic
Difficulty
Number of Questions
Question Type
Marks
```

Example:

```text
Class: 7
Subject: Science
Category: Physics
Chapter: Force and Motion
Topic: Gravity
Difficulty: Medium
Questions: 10
```

Button:

```text
[ Generate Quiz ]
```

AI generates:

```text
Question
Options
Correct Answer
Explanation
Difficulty
Topic
Marks
```

---

# 32. AI QUESTION REVIEW

AI-generated quizzes must NOT automatically become published quizzes.

Workflow:

```text
AI Generate
     ↓
Draft Questions
     ↓
Teacher Review
     ↓
Edit if required
     ↓
Approve
     ↓
Save Quiz
     ↓
Publish
```

Teacher must approve the final content.

---

# 33. AI PROVIDERS

Support both:

```text
Groq
Google Gemini
```

Create an AI provider abstraction:

```text
AIProvider
   |
   +── GeminiProvider
   |
   +── GroqProvider
```

This makes it possible to switch providers without changing the rest of the application.

---

# 34. AI API KEY SECURITY

API keys must NEVER be exposed to React.

Do not write:

```text
VITE_GROQ_API_KEY
VITE_GEMINI_API_KEY
```

or any API secret into client-side code.

Use Flask backend environment variables/secure secret storage.

Example:

```text
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

If teacher-specific API keys are supported, encrypt them at rest.

---

# 35. TEACHER AI SETTINGS

Teacher can configure AI if Admin allows teacher-level API configuration.

Fields:

```text
AI Provider
Gemini API Key
Groq API Key
Primary Provider
Fallback Provider
```

Buttons:

```text
Test Connection
Save
```

Admin can globally control whether teachers are allowed to configure their own keys.

---

# 36. STUDENT PERSONAL AI ASSISTANT

Add a dedicated feature:

```text
Student Sidebar
     ↓
🤖 AI Study Assistant
```

The assistant is an educational assistant specifically for the student's STEM learning.

Example:

```text
🤖 STEM Study Assistant

Hello!

I can help you understand your current STEM topics.

Ask:
"Explain gravity in simple words."
```

---

# 37. STUDENT AI CONTEXT

The AI assistant should receive limited educational context:

```text
Student Grade
Current Subject
Current Category
Current Chapter
Current Topic
Current Learning Path
```

Example:

```text
Grade: 7
Subject: Science
Category: Physics
Chapter: Force and Motion
Topic: Gravity
```

This allows age-appropriate explanations.

---

# 38. STUDENT AI DATA ISOLATION

Student AI must NEVER reveal:

* Other student information
* Other student's scores
* Teacher private information
* Admin information
* Database records
* API keys
* Internal prompts
* JWT tokens
* System configuration
* Other users' personal information

The AI assistant is only for the authenticated student's learning experience.

---

# 39. STUDENT AI TOPIC RESTRICTION

The assistant should focus on:

* STEM learning
* Current curriculum
* Assigned subjects
* Assigned chapters
* Quiz preparation
* Concept explanations
* Educational examples
* Study guidance

For unrelated questions, return a friendly scope message such as:

> I can help you with your STEM learning, current subjects, chapters, and quiz preparation. Please ask me a related question.

Do not expose internal filtering rules to the student.

---

# 40. STUDENT AI USAGE LIMITS

Admin controls:

```text
Student AI Enabled
Daily Requests
Maximum Message Length
Maximum Response Length
Primary Provider
Fallback Provider
```

Example:

```text
Daily Requests: 30
Maximum Message: 500 characters
Maximum Response: 1000 tokens
```

---

# 41. STUDENT AI CONVERSATION STORAGE

Create:

```text
ai_conversations
```

and:

```text
ai_usage_logs
```

Store only necessary data.

Example:

```text
student_id
conversation_id
timestamp
subject
chapter
provider
usage
status
```

Do not store API keys or sensitive authentication data.

---

# 42. ADMIN AI CONFIGURATION

Admin:

```text
Admin
 ↓
Settings
 ↓
AI Configuration
```

Settings:

```text
Student AI
ON/OFF

Gemini API Key
**************

Groq API Key
**************

Primary Provider
Gemini

Fallback Provider
Groq

Daily Student Request Limit
30

Maximum Tokens
1000
```

Admin controls student AI availability globally.

---

# 43. ADMIN DASHBOARD

Cards:

```text
Total Students
Total Teachers
Total Classes
Total Subjects
Total Categories
Total Chapters
Total Quizzes
Total Teams
Total Quiz Attempts
Active Learning Paths
```

Charts:

```text
Overall Class Performance
Student Performance
Subject Performance
Quiz Performance
Competitive vs Collaborative
Participation
Completion
Score Distribution
```

---

# 44. ADMIN STUDENT MANAGEMENT

Admin can:

* Add student
* Edit student
* Delete student
* Suspend student
* Activate student
* Reset password
* Assign class
* Assign division
* Assign roll number
* Assign team
* View performance
* View quiz history

Student creation:

```text
Photo
Student ID
Name
Class
Division
Roll Number
Email
Mobile
Username
Password
Team
Status
```

Student ID and roll number can be automatically generated.

---

# 45. ADMIN TEACHER MANAGEMENT

Admin can:

* Add teacher
* Edit teacher
* Delete teacher
* Suspend teacher
* Activate teacher
* Reset password
* Assign subject
* Assign class
* View teacher profile

Fields:

```text
Photo
Teacher ID
Name
Education
Email
Mobile
Username
Password
Subject
Classes
Status
```

---

# 46. ADMIN CLASS MANAGEMENT

Admin can:

* Create class
* Edit class
* Delete class
* Assign teacher
* View students
* View class performance

Example:

```text
Grade 7
Division A
Teacher: Rahul Sharma
Students: 32
```

---

# 47. ADMIN SUBJECT/CATEGORY/CHAPTER MANAGEMENT

Hierarchy:

```text
Subject
 ↓
Category
 ↓
Chapter
 ↓
Topic
```

Example:

```text
Science
 └── Physics
      └── Force and Motion
           ├── Gravity
           ├── Friction
           └── Motion
```

Admin can CRUD all levels.

---

# 48. ADMIN RESEARCH DATA

Admin can view aggregated research data.

Filters:

```text
Class
Subject
Category
Chapter
Quiz
Mode
Date Range
```

Metrics:

```text
Average Score
Average Accuracy
Participation
Completion Rate
Average Improvement
Average Time
Quiz Attempts
```

Separate views:

```text
Competitive Group
Collaborative Group
```

Do not automatically label one group as superior.

Present the measurements neutrally.

---

# 49. RESEARCH DATA COLLECTION

For every quiz attempt store:

```text
Student ID
Class
Subject
Category
Chapter
Quiz ID
Learning Path
Mode
Team ID
Score
Total Marks
Accuracy
Points
Time Taken
Attempt Number
Passed/Failed
Completion Status
Security Violations
Started At
Submitted At
```

This data will support later statistical analysis.

---

# 50. LOGIN LOGS

Store:

```text
User ID
Role
Login Time
Logout Time
IP Address
Browser
Device
Login Status
```

Login logs should automatically be deleted after **24 hours**, as requested.

Create a scheduled cleanup job:

```text
Delete login_logs where created_at < current_time - 24 hours
```

Do not retain unnecessary logs indefinitely.

---

# 51. PROFILE

Student:

```text
Profile
Edit Profile
Change Password
```

Teacher:

```text
Profile
Edit Profile
Change Password
```

Admin:

```text
Profile
Edit Profile
Change Password
```

Never display passwords.

---

# 52. DATABASE COLLECTIONS

Use MongoDB collections:

```text
users
students
teachers
admins
classes
subjects
categories
chapters
topics
learning_paths
quizzes
questions
quiz_attempts
answers
teams
team_members
leaderboards
research_data
quiz_security_events
ai_settings
ai_conversations
ai_usage_logs
login_logs
notifications
system_settings
```

Use appropriate indexes for:

```text
student_id
teacher_id
class_id
quiz_id
subject_id
learning_path_id
mode
created_at
```

---

# 53. BACKEND STRUCTURE

Use this structure:

```text
backend/
│
├── app.py
├── config.py
├── requirements.txt
├── .env.example
│
├── routes/
│   ├── auth_routes.py
│   ├── student_routes.py
│   ├── teacher_routes.py
│   ├── admin_routes.py
│   ├── quiz_routes.py
│   ├── question_routes.py
│   ├── subject_routes.py
│   ├── category_routes.py
│   ├── chapter_routes.py
│   ├── class_routes.py
│   ├── learning_path_routes.py
│   ├── team_routes.py
│   ├── leaderboard_routes.py
│   ├── research_routes.py
│   ├── security_routes.py
│   ├── ai_routes.py
│   └── profile_routes.py
│
├── services/
│   ├── auth_service.py
│   ├── quiz_service.py
│   ├── progression_service.py
│   ├── leaderboard_service.py
│   ├── research_service.py
│   ├── security_service.py
│   ├── ai_service.py
│   ├── gemini_provider.py
│   └── groq_provider.py
│
├── models/
│   ├── user_model.py
│   ├── student_model.py
│   ├── teacher_model.py
│   ├── class_model.py
│   ├── subject_model.py
│   ├── category_model.py
│   ├── chapter_model.py
│   ├── learning_path_model.py
│   ├── quiz_model.py
│   ├── question_model.py
│   ├── attempt_model.py
│   ├── team_model.py
│   ├── research_model.py
│   ├── security_event_model.py
│   └── ai_model.py
│
├── middleware/
│   ├── auth_middleware.py
│   ├── role_middleware.py
│   ├── validation.py
│   └── error_handler.py
│
├── utils/
│   ├── jwt_helper.py
│   ├── password.py
│   ├── validators.py
│   ├── generators.py
│   └── security.py
│
├── jobs/
│   └── cleanup_login_logs.py
│
└── uploads/
    ├── students/
    └── teachers/
```

---

# 54. REACT STRUCTURE

```text
frontend/
│
├── src/
│
├── assets/
│
├── components/
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── Sidebar.jsx
│   ├── ProtectedRoute.jsx
│   ├── RoleRoute.jsx
│   ├── Loading.jsx
│   ├── Modal.jsx
│   ├── DataTable.jsx
│   ├── Charts.jsx
│   ├── QuizTimer.jsx
│   ├── QuizSecurity.jsx
│   ├── ProgressBar.jsx
│   └── AIChat.jsx
│
├── layouts/
│   ├── PublicLayout.jsx
│   ├── StudentLayout.jsx
│   ├── TeacherLayout.jsx
│   └── AdminLayout.jsx
│
├── pages/
│   ├── public/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   └── LoginSelection.jsx
│   │
│   ├── student/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Learning.jsx
│   │   ├── Subjects.jsx
│   │   ├── Chapters.jsx
│   │   ├── Quizzes.jsx
│   │   ├── QuizInstructions.jsx
│   │   ├── QuizAttempt.jsx
│   │   ├── Result.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Team.jsx
│   │   ├── Progress.jsx
│   │   ├── AIAssistant.jsx
│   │   └── Profile.jsx
│   │
│   ├── teacher/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Classes.jsx
│   │   ├── Students.jsx
│   │   ├── LearningPaths.jsx
│   │   ├── Subjects.jsx
│   │   ├── Quizzes.jsx
│   │   ├── Questions.jsx
│   │   ├── Teams.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── ResearchData.jsx
│   │   ├── AIGenerator.jsx
│   │   ├── AISettings.jsx
│   │   └── Profile.jsx
│   │
│   └── admin/
│       ├── Login.jsx
│       ├── Dashboard.jsx
│       ├── Teachers.jsx
│       ├── Students.jsx
│       ├── Classes.jsx
│       ├── Subjects.jsx
│       ├── Categories.jsx
│       ├── Chapters.jsx
│       ├── LearningPaths.jsx
│       ├── Quizzes.jsx
│       ├── Questions.jsx
│       ├── Teams.jsx
│       ├── ResearchData.jsx
│       ├── Performance.jsx
│       ├── AIConfiguration.jsx
│       ├── LoginLogs.jsx
│       ├── Settings.jsx
│       └── Profile.jsx
│
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── quizService.js
│   ├── studentService.js
│   ├── teacherService.js
│   ├── adminService.js
│   ├── researchService.js
│   └── aiService.js
│
├── context/
│   └── AuthContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useQuizSecurity.js
│   └── useQuizTimer.js
│
├── utils/
│   ├── constants.js
│   ├── validators.js
│   └── permissions.js
│
├── App.jsx
└── main.jsx
```

---

# 55. REST API

Authentication:

```text
POST /api/auth/student/register
POST /api/auth/student/login
POST /api/auth/teacher/login
POST /api/auth/admin/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
```

Student:

```text
GET /api/student/dashboard
GET /api/student/learning-path
GET /api/student/subjects
GET /api/student/quizzes
GET /api/student/progress
GET /api/student/team
GET /api/student/profile
```

Quiz:

```text
GET    /api/quizzes
GET    /api/quizzes/:id
POST   /api/quizzes
PUT    /api/quizzes/:id
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/publish
```

Attempts:

```text
POST /api/quiz-attempts/start
POST /api/quiz-attempts/save
POST /api/quiz-attempts/security-event
POST /api/quiz-attempts/submit
GET  /api/quiz-attempts/:id
```

Leaderboard:

```text
GET /api/leaderboard/competitive
GET /api/leaderboard/collaborative
```

AI:

```text
POST /api/teacher/ai/generate-quiz
POST /api/teacher/ai/test-provider
POST /api/student/ai/chat
GET  /api/student/ai/history
```

Research:

```text
GET /api/research/summary
GET /api/research/competitive
GET /api/research/collaborative
GET /api/research/comparison
```

---

# 56. CRITICAL QUIZ START API

When student calls:

```text
POST /api/quiz-attempts/start
```

Flask must verify:

```text
Authenticated?
        ↓
Student role?
        ↓
Student active?
        ↓
Quiz exists?
        ↓
Quiz published?
        ↓
Student belongs to correct class?
        ↓
Quiz belongs to student's learning path?
        ↓
Previous quiz passed?
        ↓
Attempt limit available?
        ↓
YES → Create attempt
NO → Reject
```

Never allow the frontend alone to determine whether a quiz is unlocked.

---

# 57. QUIZ ATTEMPT SECURITY

At quiz start create:

```text
attempt_id
student_id
quiz_id
started_at
expires_at
status
```

The backend determines the actual expiration time.

When submitted:

```text
server_time <= expires_at
```

If expired:

```text
Auto submit
```

---

# 58. AI ARCHITECTURE

Use:

```text
React
 ↓
Flask
 ↓
AI Service
 ↓
Provider Manager
 ├── Gemini
 └── Groq
```

Do not call AI providers directly from React.

---

# 59. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Example:

```text
FLASK_ENV=development
SECRET_KEY=change_me
JWT_SECRET_KEY=change_me

MONGO_URI=mongodb://localhost:27017/stemlearn

GROQ_API_KEY=
GEMINI_API_KEY=

UPLOAD_FOLDER=uploads
```

Never commit real secrets.

Add `.env` to `.gitignore`.

---

# 60. SECURITY REQUIREMENTS

Implement:

* Password hashing
* JWT authentication
* Role-based access control
* API authorization
* Input validation
* MongoDB query validation
* Rate limiting
* CORS configuration
* Secure HTTP headers
* File upload validation
* File type restrictions
* File size limits
* API key protection
* Error handling
* No sensitive information in errors
* No password logging
* No API key logging
* No JWT logging
* Audit trail for important Admin actions

---

# 61. FILE UPLOAD SECURITY

For student/teacher photos:

Allow only:

```text
JPG
JPEG
PNG
WEBP
```

Validate:

* MIME type
* Extension
* File size
* Filename
* Image content

Generate safe server-side filenames.

Do not trust uploaded filenames.

---

# 62. ERROR HANDLING

API response format:

```json
{
  "success": false,
  "message": "Quiz is locked",
  "error_code": "QUIZ_LOCKED"
}
```

Success:

```json
{
  "success": true,
  "message": "Quiz started successfully",
  "data": {}
}
```

Never return:

* Stack traces
* Database credentials
* API keys
* Internal paths
* Sensitive server information

to users.

---

# 63. RESPONSIVE DESIGN

Must work on:

```text
320px+
768px+
1024px+
1440px+
```

Mobile sidebar:

```text
Hamburger Menu
```

Desktop:

```text
Permanent Sidebar
```

Quiz interface must also work on tablets.

---

# 64. UI DESIGN

Use a modern educational dashboard.

Use:

* Rounded cards
* Clean typography
* Clear status badges
* Progress bars
* Charts
* Icons
* Hover effects
* Loading states
* Empty states
* Confirmation dialogs
* Toast notifications
* Skeleton loaders

Use separate visual identity for:

```text
Student
Teacher
Admin
```

but maintain a common brand identity.

---

# 65. QUIZ STATUS COLORS/INDICATORS

Use clear status labels:

```text
AVAILABLE
LOCKED
IN PROGRESS
PASSED
FAILED
COMPLETED
FINAL EXAM
```

Do not rely only on color; include text/icons for accessibility.

---

# 66. ADMIN PERFORMANCE ANALYTICS

Admin should be able to filter:

```text
Class
Division
Subject
Category
Chapter
Quiz
Mode
Date
Student
Teacher
```

Charts:

```text
Average Score
Average Accuracy
Participation
Completion Rate
Improvement
Time Taken
```

Research comparison:

```text
Competitive
vs
Collaborative
```

Display actual measurements and sample sizes.

Do not automatically generate a "winner".

---

# 67. TEACHER RESEARCH DASHBOARD

Teacher only sees assigned classes.

Display:

```text
Competitive Group
Average Score
Average Accuracy
Participation
Completion
Improvement

Collaborative Group
Average Score
Average Accuracy
Participation
Completion
Improvement
```

Allow data export for research analysis.

---

# 68. EXPORT

Admin/Teacher should be able to export permitted research data as:

```text
CSV
Excel
```

Do not export confidential fields such as:

* Password hashes
* API keys
* JWT secrets
* Internal credentials

---

# 69. NOTIFICATIONS

Support notifications for:

```text
Quiz unlocked
Quiz passed
Quiz failed
Final exam unlocked
Teacher announcement
Team assignment
```

Student can see notifications in their dashboard.

---

# 70. PROJECT DEVELOPMENT ORDER

Build in this exact order:

### Phase 1

Project setup:

```text
React
Flask
MongoDB
Environment
Git
```

### Phase 2

Authentication:

```text
Student Register/Login
Teacher Login
Admin Login
JWT
RBAC
```

### Phase 3

Public website:

```text
Home
About
Contact
Login selection
```

### Phase 4

Admin:

```text
Students
Teachers
Classes
Subjects
Categories
Chapters
```

### Phase 5

Teacher:

```text
Classes
Students
Quiz
Questions
Learning Paths
Teams
```

### Phase 6

Student:

```text
Dashboard
Learning Path
Subjects
Chapters
Quiz
Result
Progress
```

### Phase 7

Secure Quiz:

```text
Fullscreen
Tab detection
Focus detection
Timer
Violation system
Auto submission
```

### Phase 8

Leaderboards:

```text
Competitive
Collaborative
```

### Phase 9

Research analytics:

```text
Performance
Participation
Comparison
Export
```

### Phase 10

AI:

```text
Teacher AI Quiz Generator
Gemini
Groq
Student AI Assistant
AI limits
AI usage logs
```

### Phase 11

Security hardening.

### Phase 12

Testing.

### Phase 13

Production deployment.

---

# 71. TESTING REQUIREMENTS

Create tests for:

### Authentication

* Valid login
* Invalid login
* Student registration
* Role access
* Token expiration

### Quiz

* Quiz start
* Locked quiz
* Passed quiz
* Failed quiz
* Retry
* Timer
* Auto-submit
* Final exam unlock

### Security

* Fullscreen exit
* Tab switch
* Focus loss
* Refresh
* Multiple violations
* Auto-submit

### Authorization

Test that:

```text
Student → Admin API = 403
Student → Teacher API = 403
Teacher → Admin API = 403
Teacher → Another Teacher's class = 403
```

### AI

* Gemini
* Groq
* Provider fallback
* Invalid API key
* Usage limits
* Student scope
* Prompt injection resistance
* API key protection

---

# 72. IMPORTANT BUSINESS LOGIC

Implement these rules exactly:

```text
1. Student cannot access arbitrary quizzes.

2. Student can only access quizzes assigned to their learning path.

3. Quiz 1 is unlocked initially.

4. Student must pass Quiz 1 to unlock Quiz 2.

5. Student must pass Quiz 2 to unlock Quiz 3.

6. Continue sequentially.

7. If student fails, the next quiz remains locked.

8. Teacher controls passing percentage.

9. Teacher controls retry rules.

10. Teacher controls the final exam.

11. Backend must enforce all progression rules.

12. React must never be the only security layer.

13. Competitive and collaborative modes must use the same research quiz content.

14. AI-generated quizzes must be reviewed by teachers before publishing.

15. Student AI must only expose appropriate educational content.

16. Admin controls global AI configuration.

17. API keys must never be exposed to students or client-side code.

18. Login logs automatically expire after 24 hours.

19. Admin panel must remain separate from Student and Teacher panels.

20. Teacher can only access assigned classes and students.

21. Admin can access all authorized system data.

22. Research analytics must display measurements neutrally.
```

---

# 73. EXPECTED FINAL PROJECT

Deliver a fully working application with:

```text
✅ Public Website
✅ Student Registration
✅ Student Login
✅ Teacher Login
✅ Admin Login
✅ Separate Dashboards
✅ Separate Sidebars
✅ Role-Based Access
✅ Student Management
✅ Teacher Management
✅ Class Management
✅ Subject Management
✅ Category Management
✅ Chapter Management
✅ Learning Path
✅ Sequential Quiz Unlocking
✅ Pass/Fail System
✅ Retry System
✅ Final Exam
✅ Secure Quiz Mode
✅ Fullscreen Detection
✅ Tab Switch Detection
✅ Focus Detection
✅ Security Violation Logs
✅ Timer
✅ Auto Submit
✅ Competitive Leaderboard
✅ Collaborative Leaderboard
✅ Team Management
✅ Student Progress
✅ Teacher Analytics
✅ Admin Analytics
✅ Research Data
✅ CSV/Excel Export
✅ AI Quiz Generator
✅ Gemini Support
✅ Groq Support
✅ Student AI Assistant
✅ AI Usage Limits
✅ AI Usage Logs
✅ Secure API Key Management
✅ Login Logs
✅ 24-Hour Login Log Cleanup
✅ Responsive UI
✅ Mobile UI
✅ Error Handling
✅ Loading States
✅ Validation
✅ Security Hardening
```

---

# 74. FINAL IMPLEMENTATION INSTRUCTION

Do not create only static frontend screens.

Build the **actual full-stack application**.

The React frontend must communicate with Flask REST APIs.

Flask must communicate with MongoDB.

All important business rules must be enforced server-side.

Create:

```text
frontend/
backend/
README.md
.env.example
.gitignore
```

Provide:

1. Complete source code
2. MongoDB database setup
3. Seed data
4. Admin creation process
5. API documentation
6. Installation instructions
7. Environment configuration
8. Development commands
9. Production deployment instructions
10. Testing instructions

Create sample seed data for:

```text
Grade 6
Grade 7
Grade 8

Science
Technology
Mathematics

Sample categories
Sample chapters
Sample quizzes
Sample questions
Sample teachers
Sample students
Sample teams
```

Create at least one complete demonstration learning path:

```text
Grade 7
→ Science
→ Physics
→ Force and Motion
→ Quiz 1
→ Quiz 2
→ Quiz 3
→ Final Exam
```

Demonstrate:

```text
Quiz 1 PASS
→ Quiz 2 unlocks

Quiz 1 FAIL
→ Quiz 2 remains locked

Competitive Mode
→ Individual leaderboard

Collaborative Mode
→ Team leaderboard

Teacher
→ Creates learning path

Teacher
→ Generates quiz using Gemini/Groq

Teacher
→ Reviews and publishes quiz

Student
→ Uses restricted STEM AI Assistant

Admin
→ Controls AI settings

Admin
→ Views research analytics
