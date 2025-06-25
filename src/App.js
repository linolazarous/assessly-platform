// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import AdminDashboard from './pages/Admin/Dashboard';
import AssessorPortal from './pages/Assessor/Portal';
import CandidateTests from './pages/Candidate/Tests';
import NotFoundPage from './pages/Error/NotFoundPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<MainLayout />}>
            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={['Admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Assessor Routes */}
            <Route element={<ProtectedRoute roles={['Assessor']} />}>
              <Route path="/assessor" element={<AssessorPortal />} />
            </Route>

            {/* Candidate Routes */}
            <Route element={<ProtectedRoute roles={['Candidate']} />}>
              <Route path="/tests" element={<CandidateTests />} />
            </Route>

            {/* Common Error Pages */}
            <Route path="/unauthorized" element={<div>Access Denied</div>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;