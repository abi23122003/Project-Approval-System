import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import GuideProjectReviewInterface from './pages/guide-project-review-interface';
import StudentDocumentManagement from './pages/student-document-management';
import GuideDashboard from './pages/guide-dashboard';
import StudentProjectProposalForm from './pages/student-project-proposal-form';
import AuthenticationRoleSelection from './pages/authentication-role-selection';
import StudentDashboard from './pages/student-dashboard';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<AuthenticationRoleSelection />} />
        <Route path="/guide-project-review-interface" element={<GuideProjectReviewInterface />} />
        <Route path="/student-document-management" element={<StudentDocumentManagement />} />
        <Route path="/guide-dashboard" element={<GuideDashboard />} />
        <Route path="/student-project-proposal-form" element={<StudentProjectProposalForm />} />
        <Route path="/authentication-role-selection" element={<AuthenticationRoleSelection />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
