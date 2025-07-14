import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { lightTheme, darkTheme } from './styles/theme';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';
import { usePageTracking } from './utils/analytics';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/Auth/RegisterPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/Auth/ResetPasswordPage'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const AdminReports = React.lazy(() => import('./pages/Admin/Reports'));
const UserManagement = React.lazy(() => import('./pages/Admin/UserManagement'));
const AssessorPortal = React.lazy(() => import('./pages/Assessor/Portal'));
const AssessorAssessments = React.lazy(() => import('./pages/Assessor/Assessments'));
const CandidateTests = React.lazy(() => import('./pages/Candidate/Tests'));
const TakeAssessment = React.lazy(() => import('./pages/Candidate/TakeAssessment'));
const OrganizationSelect = React.lazy(() => import('./pages/Organization/Select'));
const ProfilePage = React.lazy(() => import('./pages/Profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/Settings/SettingsPage'));
const BillingPage = React.lazy(() => import('./pages/Billing/BillingPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/Error/UnauthorizedPage'));
const ErrorPage = React.lazy(() => import('./pages/Error/ErrorPage'));
const NotFoundPage = React.lazy(() => import('./pages/Error/NotFoundPage'));

function App() {
  usePageTracking();
  const [darkMode, setDarkMode] = useState(false);

  // Create theme based on dark mode state
  const theme = useMemo(
    () => responsiveFontSizes(darkMode ? darkTheme : lightTheme),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <React.Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Main Application Routes */}
                <Route element={<MainLayout darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />}>
                  {/* Organization Selection */}
                  <Route path="/select-org" element={<OrganizationSelect />} />

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    <Route path="/admin/users" element={<UserManagement />} />
                  </Route>

                  {/* Assessor Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['assessor', 'admin']} />}>
                    <Route path="/assessor" element={<AssessorPortal />} />
                    <Route path="/assessor/assessments" element={<AssessorAssessments />} />
                    <Route path="/assessor/assessments/:id" element={<AssessorAssessmentDetail />} />
                  </Route>

                  {/* Candidate Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
                    <Route path="/assessments" element={<CandidateTests />} />
                    <Route path="/assessments/:id" element={<TakeAssessment />} />
                  </Route>

                  {/* Common Routes */}
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/search" element={<SearchPage />} />

                  {/* Error Pages */}
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/error" element={<ErrorPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
