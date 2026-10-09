import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import LeaderboardPage from './pages/public/LeaderboardPage';
import ResearchDetail from './pages/public/ResearchDetail';
// Standalone Auth Pages
import StudentLogin from './pages/student/Login';
import StudentRegister from './pages/student/Register';
import TeacherLogin from './pages/teacher/Login';
import AdminLogin from './pages/admin/Login';
import ResetPassword from './pages/public/ResetPassword';

// Student Portal Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentLearning from './pages/student/Learning';
import StudentSubjects from './pages/student/Subjects';
import StudentQuizzes from './pages/student/Quizzes';
import StudentQuizTake from './pages/student/QuizTake';
import StudentResults from './pages/student/Results';
import StudentLeaderboard from './pages/student/Leaderboard';
import StudentTeam from './pages/student/Team';
import StudentProgress from './pages/student/Progress';
import StudentAiAssistant from './pages/student/AiAssistant';
import StudentProfile from './pages/student/Profile';
import StudentVideos from './pages/student/Videos';

// Teacher Portal Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClasses from './pages/teacher/Classes';
import TeacherStudents from './pages/teacher/Students';
import TeacherLearningPaths from './pages/teacher/LearningPaths';
import TeacherQuizzes from './pages/teacher/Quizzes';
import TeacherQuizCreate from './pages/teacher/QuizCreate';
import TeacherQuestions from './pages/teacher/Questions';
import TeacherPerformance from './pages/teacher/Performance';
import TeacherTeams from './pages/teacher/Teams';
import TeacherProfile from './pages/teacher/Profile';
import TeacherVideos from './pages/teacher/Videos';

// Admin Portal Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminTeachers from './pages/admin/Teachers';
import AdminStudents from './pages/admin/Students';
import AdminClasses from './pages/admin/Classes';
import AdminSubjects from './pages/admin/Subjects';
import AdminCategories from './pages/admin/Categories';
import AdminChapters from './pages/admin/Chapters';
import AdminLoginLogs from './pages/admin/LoginLogs';
import AdminSettings from './pages/admin/Settings';
import AdminProfile from './pages/admin/Profile';
import AdminOtherPages from './pages/admin/OtherPages';

// Protected Route Guard
function ProtectedRoute({ children, allowedRole, redirectPath }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ─── 1. Public Website Routes ─── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/curriculum" element={<LeaderboardPage />} />
        <Route path="/research" element={<ResearchDetail />} />
      </Route>

      {/* ─── 2. Standalone Auth Routes (Strictly Isolated Header/Footer) ─── */}
      <Route path="/login" element={<Navigate to="/student/login" replace />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/register" element={<StudentRegister />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ─── 3. Student Portal Routes ─── */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student" redirectPath="/student/login">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="learning" element={<StudentLearning />} />
        <Route path="subjects" element={<Navigate to="/student/learning" replace />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="quiz/:id" element={<StudentQuizTake />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="leaderboard" element={<StudentLeaderboard />} />
        <Route path="team" element={<StudentTeam />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="videos" element={<StudentVideos />} />
        <Route path="ai-assistant" element={<StudentAiAssistant />} />
        <Route path="profile" element={<StudentProfile />} />
      </Route>

      {/* ─── 4. Teacher Faculty Portal Routes ─── */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRole="teacher" redirectPath="/teacher/login">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="learning-paths" element={<TeacherLearningPaths />} />
        <Route path="quizzes" element={<TeacherQuizzes />} />
        <Route path="quizzes/create" element={<TeacherQuizCreate />} />
        <Route path="questions" element={<TeacherQuestions />} />
        <Route path="performance" element={<TeacherPerformance />} />
        <Route path="teams" element={<TeacherTeams />} />
        <Route path="videos" element={<TeacherVideos />} />
        <Route path="leaderboard" element={<Navigate to="/teacher/performance" replace />} />
        <Route path="research" element={<Navigate to="/teacher/performance" replace />} />
        <Route path="ai-generator" element={<Navigate to="/teacher/quizzes/create" replace />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* ─── 5. Admin Superuser Portal Routes ─── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin" redirectPath="/admin/login">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="chapters" element={<AdminChapters />} />
        <Route path="login-logs" element={<AdminLoginLogs />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="other-pages" element={<AdminOtherPages />} />
      </Route>

      {/* ─── 6. Fallback Catch-all Route ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
