import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        // Try to get current user with existing token
        const res = await api.get('/auth/me');
        setUser(res.data.user);
        setLoading(false);
      } catch (err) {
        // If token expired but we have refresh token, try to refresh
        if (err.response?.status === 401 && refreshToken) {
          try {
            const refreshRes = await api.post('/auth/refresh-token', { refreshToken });
            localStorage.setItem('access_token', refreshRes.data.accessToken);
            localStorage.setItem('refresh_token', refreshRes.data.refreshToken);

            // Now try to get user again with new token
            const userRes = await api.get('/auth/me');
            setUser(userRes.data.user);
          } catch (refreshErr) {
            // Both token and refresh failed - clear and logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } else {
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', res.data.accessToken);
    localStorage.setItem('refresh_token', res.data.refreshToken);

    // Cache non-sensitive user details
    const userData = {
      id: res.data.user.id,
      email: res.data.user.email,
      name: res.data.user.name,
      role: res.data.user.role,
      initials: res.data.user.initials,
      avatar_color: res.data.user.avatar_color,
    };
    localStorage.setItem('user_cache', JSON.stringify(userData));

    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (name, email, password, teamType) => {
    const res = await api.post('/auth/register', { name, email, password, team_type: teamType });
    localStorage.setItem('access_token', res.data.accessToken);
    localStorage.setItem('refresh_token', res.data.refreshToken);

    // Cache non-sensitive user details
    const userData = {
      id: res.data.user.id,
      email: res.data.user.email,
      name: res.data.user.name,
      role: res.data.user.role,
      initials: res.data.user.initials,
      avatar_color: res.data.user.avatar_color,
    };
    localStorage.setItem('user_cache', JSON.stringify(userData));

    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_cache');
    setUser(null);
  };

  const updateUser = updates => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
