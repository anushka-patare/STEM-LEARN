import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data?.success) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      // If server unreachable or token invalid
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (roleOrEmail, credentialsOrPassword, optionalRole) => {
    let targetRole = 'student';
    let payload = {};

    if (typeof roleOrEmail === 'string' && typeof credentialsOrPassword === 'object') {
      // Called as: login('student', { email, password })
      targetRole = roleOrEmail;
      payload = credentialsOrPassword;
    } else if (typeof roleOrEmail === 'string' && typeof credentialsOrPassword === 'string') {
      // Called as: login(identifier, password, optionalRole)
      payload = { username: roleOrEmail, password: credentialsOrPassword };
      if (optionalRole) {
        targetRole = optionalRole;
      } else {
        const path = window.location.pathname;
        if (path.includes('teacher')) targetRole = 'teacher';
        else if (path.includes('admin')) targetRole = 'admin';
        else targetRole = 'student';
      }
    } else if (typeof roleOrEmail === 'object') {
      // Called as: login({ username, password })
      payload = roleOrEmail;
      targetRole = optionalRole || 'student';
    }

    let res;
    if (targetRole === 'student') {
      res = await authService.studentLogin(payload);
    } else if (targetRole === 'teacher') {
      res = await authService.teacherLogin(payload);
    } else {
      res = await authService.adminLogin(payload);
    }

    if (res.data?.success) {
      const { access_token, user: userData } = res.data.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (data) => {
    const res = await authService.studentRegister(data);
    if (res.data?.success) {
      const { access_token, user: userData } = res.data.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return userData;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const requestOtp = async (email, role = 'student') => {
    const res = await authService.requestOtp({ email, role });
    if (res.data?.success) {
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to request OTP');
  };

  const verifyOtp = async (email, otp, role = 'student') => {
    const res = await authService.verifyOtp({ email, otp, role });
    if (res.data?.success) {
      const { access_token, user: userData } = res.data.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true, user: userData };
    }
    throw new Error(res.data?.message || 'OTP verification failed');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore logout network errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updated) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updated };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const isAuthenticated = !!token && !!user;
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        requestOtp,
        verifyOtp,
        register,
        logout,
        fetchUser,
        updateUser,
        isAuthenticated,
        isStudent,
        isTeacher,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
