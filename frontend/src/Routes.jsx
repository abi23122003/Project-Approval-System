import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import GuideProjectReviewInterface from './pages/guide-project-review-interface';
import StudentDocumentManagement from './pages/student-document-management';
import GuideDashboard from './pages/guide-dashboard';
import StudentProjectProposalForm from './pages/student-project-proposal-form';
import AuthenticationRoleSelection from './pages/authentication-role-selection';
import StudentDashboard from './pages/student-dashboard';
import AdminDashboard from './pages/admin-dashboard';
import HodAnalyticsDashboard from './pages/hod-analytics-dashboard';
import NotificationCenter from './pages/notification-center';
import ReviewerDashboard from './pages/reviewer-dashboard';
import SystemConfigurationPanel from './pages/system-configuration-panel';

const ROLE_KEY = 'aps.role';

const roleHomeRoute = {
  student: '/student-dashboard',
  guide: '/guide-dashboard',
  reviewer: '/reviewer-dashboard',
  hod: '/hod-analytics-dashboard',
  admin: '/admin-dashboard'
};

const getRole = () => {
  try {
    return window.localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
};

const RoleAwareHome = () => {
  const role = getRole();
  if (role && roleHomeRoute?.[role]) {
    return <Navigate to={roleHomeRoute[role]} replace />;
  }
  return <Navigate to="/authentication-role-selection" replace />;
};

const RequireRole = ({ allow, children }) => {
  const role = getRole();
  if (!role) return <Navigate to="/authentication-role-selection" replace />;
  if (Array.isArray(allow) && allow.length > 0 && !allow.includes(role)) {
    return <Navigate to={roleHomeRoute?.[role] || '/authentication-role-selection'} replace />;
  }
  return children;
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<RoleAwareHome />} />
        <Route path="/guide-project-review-interface" element={
          <RequireRole allow={["guide", "reviewer"]}>
            <GuideProjectReviewInterface />
          </RequireRole>
        } />
        <Route path="/student-document-management" element={
          <RequireRole allow={["student"]}>
            <StudentDocumentManagement />
          </RequireRole>
        } />
        <Route path="/guide-dashboard" element={
          <RequireRole allow={["guide"]}>
            <GuideDashboard />
          </RequireRole>
        } />
        <Route path="/student-project-proposal-form" element={
          <RequireRole allow={["student"]}>
            <StudentProjectProposalForm />
          </RequireRole>
        } />
        <Route path="/authentication-role-selection" element={<AuthenticationRoleSelection />} />
        <Route path="/student-dashboard" element={
          <RequireRole allow={["student"]}>
            <StudentDashboard />
          </RequireRole>
        } />
        <Route path="/admin-dashboard" element={
          <RequireRole allow={["admin"]}>
            <AdminDashboard />
          </RequireRole>
        } />
        <Route path="/hod-analytics-dashboard" element={
          <RequireRole allow={["hod"]}>
            <HodAnalyticsDashboard />
          </RequireRole>
        } />
        <Route path="/notification-center" element={
          <RequireRole allow={["student", "guide", "reviewer", "hod", "admin"]}>
            <NotificationCenter />
          </RequireRole>
        } />
        <Route path="/reviewer-dashboard" element={
          <RequireRole allow={["reviewer"]}>
            <ReviewerDashboard />
          </RequireRole>
        } />
        <Route path="/system-configuration-panel" element={
          <RequireRole allow={["admin"]}>
            <SystemConfigurationPanel />
          </RequireRole>
        } />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;

