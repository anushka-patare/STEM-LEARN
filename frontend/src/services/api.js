import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Endpoints where 401 must NEVER trigger logout or redirect
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/student/login') ||
        url.includes('/auth/teacher/login') ||
        url.includes('/auth/admin/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/student/register') ||
        url.includes('/auth/teacher/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/verify-reset-token') ||
        url.includes('/auth/reset-password') ||
        url.includes('/auth/contact') ||
        url.includes('/auth/request-otp') ||
        url.includes('/auth/verify-otp') ||
        url.includes('/login') ||
        url.includes('/register') ||
        url.includes('/forgot-password') ||
        url.includes('/reset-password') ||
        url.includes('/verify-reset-token');

      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const pathname = window.location.pathname;
        const isAlreadyOnAuthPage =
          pathname === '/student/login' ||
          pathname === '/student/register' ||
          pathname === '/teacher/login' ||
          pathname === '/admin/login' ||
          pathname === '/login' ||
          pathname === '/reset-password';

        if (!isAlreadyOnAuthPage) {
          if (pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else if (pathname.startsWith('/teacher')) {
            window.location.href = '/teacher/login';
          } else if (pathname.startsWith('/student')) {
            window.location.href = '/student/login';
          } else {
            window.location.href = '/student/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH SERVICES ──────────────────────────────────────────
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  studentLogin: (credentials) => api.post('/auth/student/login', credentials),
  studentRegister: (data) => api.post('/auth/student/register', data),
  teacherLogin: (credentials) => api.post('/auth/teacher/login', credentials),
  teacherRegister: (data) => api.post('/auth/teacher/register', data),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPasswordDirect: (data) => api.post('/auth/reset-password-direct', data),
  verifyResetToken: (token) => api.get('/auth/verify-reset-token', { params: { token } }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  uploadPhoto: (formData) => api.post('/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: () => api.delete('/profile/photo'),
};

// ─── ADMIN SERVICES ─────────────────────────────────────────
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getTeachers: (params) => api.get('/admin/teachers', { params }),
  getPendingTeachers: () => api.get('/admin/teachers/pending'),
  approveTeacher: (id, data) => api.post(`/admin/teachers/${id}/approve`, data),
  rejectTeacher: (id, data) => api.post(`/admin/teachers/${id}/reject`, data),
  createTeacher: (data) => api.post('/admin/teachers', data),
  updateTeacher: (id, data) => api.put(`/admin/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  resetTeacherPassword: (id, new_password) => api.post(`/admin/teachers/${id}/reset-password`, { new_password }),
  getStudents: (params) => api.get('/admin/students', { params }),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  resetStudentPassword: (id, new_password) => api.post(`/admin/students/${id}/reset-password`, { new_password }),
  bulkImportStudents: (data) => api.post('/admin/students/bulk-import', data),
  getLoginLogs: (params) => api.get('/admin/login-logs', { params }),
  clearLoginLogs: () => api.delete('/admin/login-logs'),
  deleteLoginLog: (id) => api.delete(`/admin/login-logs/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getSmtpSettings: () => api.get('/admin/settings/smtp'),
  updateSmtpSettings: (data) => api.put('/admin/settings/smtp', data),
  testSmtpConnection: (data) => api.post('/admin/settings/smtp/test', data),
  getSubjects: (params) => api.get('/subjects', { params }),
  getCategories: (params) => api.get('/categories', { params }),
  getChapters: (params) => api.get('/chapters', { params }),
};

// ─── ACADEMIC / CURRICULUM SERVICES ─────────────────────────
export const academicService = {
  getClasses: () => api.get('/classes'),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  getSubjects: (params) => api.get('/subjects', { params }),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  getCategories: (params) => api.get('/categories', { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  getChapters: (params) => api.get('/chapters', { params }),
  createChapter: (data) => api.post('/chapters', data),
  updateChapter: (id, data) => api.put(`/chapters/${id}`, data),
  deleteChapter: (id) => api.delete(`/chapters/${id}`),
};

// Class service alias
export const classService = {
  getAll: () => api.get('/classes'),
  getClasses: () => api.get('/classes'),
  create: (data) => api.post('/classes', data),
  createClass: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  deleteClass: (id) => api.delete(`/classes/${id}`),
};

// Learning Path service
export const learningPathService = {
  getAll: () => api.get('/learning-paths'),
  getLearningPaths: () => api.get('/learning-paths'),
  createLearningPath: (data) => api.post('/learning-paths', data),
  deleteLearningPath: (id) => api.delete(`/learning-paths/${id}`),
};

// ─── STUDENT SERVICES ───────────────────────────────────────
export const studentService = {
  getDashboard: () => api.get('/student/dashboard'),
  getLearningPaths: () => api.get('/student/learning-path'),
  getSubjects: () => api.get('/student/subjects'),
  getProgress: () => api.get('/student/progress'),
  getResults: () => api.get('/student/progress'),
  getMyTeam: () => api.get('/student/team'),
  getQuizzes: (params) => api.get('/student/quizzes', { params }),
};

// ─── TEACHER SERVICES ───────────────────────────────────────
export const teacherService = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getAll: () => api.get('/admin/teachers'),
  getMyClasses: () => api.get('/teacher/classes'),
  getStudents: (classId) => api.get('/teacher/students', { params: { class_id: classId } }),
  getMyStudents: (classId) => api.get('/teacher/students', { params: { class_id: classId } }),
  getLearningPaths: () => api.get('/learning-paths'),
  createLearningPath: (data) => api.post('/learning-paths', data),
  deleteLearningPath: (id) => api.delete(`/learning-paths/${id}`),
  getPerformanceOverview: () => api.get('/teacher/performance'),
  getStudentDetailedPerformance: (studentId) => api.get(`/teacher/students/${studentId}/performance`),
  getTeamsOverview: (params) => api.get('/teacher/teams', { params }),
  getTeamDetailedPerformance: (teamId) => api.get(`/teacher/teams/${teamId}/performance`),
};

// ─── QUIZ SERVICES ──────────────────────────────────────────
export const quizService = {
  getAll: (params) => api.get('/quizzes', { params }),
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  publishQuiz: (id) => api.post(`/quizzes/${id}/publish`),
  unpublishQuiz: (id) => api.post(`/quizzes/${id}/unpublish`),
  toggleStatus: (id) => api.post(`/quizzes/${id}/toggle-status`),
  duplicateQuiz: (id) => api.post(`/quizzes/${id}/duplicate`),
  startAttempt: (quizId) => api.post('/quizzes/attempts/start', { quiz_id: quizId }),
  submit: (attemptId, answers) => api.post('/quizzes/attempts/submit', { attempt_id: attemptId, answers }),
  submitAnswer: (attemptId, data) => api.post('/quizzes/attempts/save-answer', { attempt_id: attemptId, ...data }),
  saveAnswer: (attemptId, questionId, answer) => api.post('/quizzes/attempts/save-answer', { attempt_id: attemptId, question_id: questionId, answer }),
  heartbeat: (attemptId) => api.post('/quizzes/attempts/heartbeat', { attempt_id: attemptId }),
  logViolation: (attemptId, eventType, details) => api.post('/quizzes/attempts/log-violation', { attempt_id: attemptId, event_type: eventType, details }),
  reviewAttempt: (attemptId, action, comment) => api.post(`/quizzes/attempts/${attemptId}/review`, { action, comment }),
  completeAttempt: (attemptId, data) => api.post('/quizzes/attempts/submit', { attempt_id: attemptId, ...data }),
  getAttemptResult: (attemptId) => api.get(`/quizzes/attempts/${attemptId}`),
  getMyResults: () => api.get('/student/progress'),
};

// ─── QUESTION SERVICES ──────────────────────────────────────
export const questionService = {
  getAll: (params) => api.get('/questions', { params }),
  getQuestions: (params) => api.get('/questions', { params }),
  createQuestion: (data) => api.post('/questions', data),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  bulkCreate: (data) => api.post('/questions/bulk', data),
};

// ─── TEAM SERVICES ──────────────────────────────────────────
export const teamService = {
  getMyTeam: () => api.get('/student/team'),
  getTeams: (params) => api.get('/teacher/teams', { params }),
  getTeamPerformance: (teamId) => api.get(`/teacher/teams/${teamId}/performance`),
  createTeam: (data) => api.post('/teams', data),
  updateTeam: (id, data) => api.put(`/teams/${id}`, data),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  addMember: (teamId, studentId) => api.post(`/teams/${teamId}/members`, { student_id: studentId }),
  removeMember: (teamId, studentId) => api.delete(`/teams/${teamId}/members/${studentId}`),
  getAvailableStudents: (params) => api.get('/teams/available-students', { params }),
  joinTeam: (data) => api.post('/teams/join', data),
  leaveTeam: () => api.post('/teams/leave'),
  getAllSquads: (params) => api.get('/teams', { params }),
};

// ─── LEADERBOARD SERVICES ───────────────────────────────────
export const leaderboardService = {
  getIndividual: (params) => api.get('/leaderboard/competitive', { params }),
  getTeam: (params) => api.get('/leaderboard/collaborative', { params }),
  getCompetitive: (params) => api.get('/leaderboard/competitive', { params }),
  getCollaborative: (params) => api.get('/leaderboard/collaborative', { params }),
  getPublicOverview: (params) => api.get('/leaderboard/public-overview', { params }),
  getStudentDetails: (studentId) => api.get(`/leaderboard/student/${studentId}`),
  getAdminSettings: () => api.get('/leaderboard/admin-settings'),
  updateAdminSettings: (data) => api.put('/leaderboard/admin-settings', data),
  adjustPoints: (studentId, points) => api.post('/leaderboard/admin-adjust-points', { student_id: studentId, points }),
};

// ─── RESEARCH SERVICES ──────────────────────────────────────
export const researchService = {
  getOverview: () => api.get('/research/overview'),
  getAnova: () => api.get('/research/overview'),
  exportData: () => api.get('/research/export', { responseType: 'blob' }),
};

// ─── SECURITY VIOLATION SERVICES ────────────────────────────
export const securityService = {
  recordViolation: (data) => api.post('/quizzes/attempts/log-violation', data),
  logAntiCheatEvent: (data) => api.post('/quizzes/attempts/log-violation', data),
  getLogs: (params) => api.get('/admin/login-logs', { params }),
};

// ─── AI SERVICES ────────────────────────────────────────────
export const aiService = {
  chatTutor: (data) => api.post('/ai/student/chat', data),
  generateQuiz: (data) => api.post('/ai/teacher/generate-quiz', data),
  generateQuestions: (data) => api.post('/ai/teacher/generate-quiz', data),
};

// ─── PROFILE SERVICES ───────────────────────────────────────
export const profileService = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  uploadPhoto: (formData) => api.post('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removePhoto: () => api.delete('/profile/photo'),
  adminRemoveUserPhoto: (userId) => api.delete(`/profile/admin/users/${userId}/photo`),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── CONFIG SERVICES ────────────────────────────────────────
export const configService = {
  getGrades: () => api.get('/config/grades'),
};

// ─── PUBLIC SERVICES ────────────────────────────────────────
export const publicService = {
  submitContact: (data) => api.post('/auth/contact', data),
};

// ─── PAGE CMS SERVICES ──────────────────────────────────────
export const pageService = {
  getAllPages: () => api.get('/pages'),
  getPageContent: (pageKey) => api.get(`/pages/${pageKey}`),
  updatePageContent: (pageKey, data) => api.put(`/pages/${pageKey}`, data),
};

// ─── VIDEO LESSON SERVICES ──────────────────────────────────
export const videoService = {
  getAll: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  create: (data) => api.post('/videos', data),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
  getHierarchy: (params) => api.get('/videos/hierarchy', { params }),
};

export default api;
