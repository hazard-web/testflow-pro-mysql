import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import {
  LoginPage,
  SignupPage,
  Dashboard,
  TestCases,
  TestCaseDetail,
  TestRuns,
  Projects,
  Bugs,
  Testers,
  DevConnect,
  Reports,
  Settings,
  PasswordResetPage,
  SecuritySettingsPage,
} from './pages/index';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="test-cases" element={<TestCases />} />
          <Route path="test-cases/:id" element={<TestCaseDetail />} />
          <Route path="runs" element={<TestRuns />} />
          <Route path="projects" element={<Projects />} />
          <Route path="bugs" element={<Bugs />} />
          <Route path="testers" element={<Testers />} />
          <Route path="dev-connect" element={<DevConnect />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="security" element={<SecuritySettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
