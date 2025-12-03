/**
 * Main Router Component
 * Handles all application routing
 */

import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import { publicRoutes, protectedRoutes, getCurrentPage } from './routes';

/**
 * Router Content (must be inside Router context to use useLocation)
 */
function RouterContent() {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);

  return (
    <Routes>
      {/* Public routes - no Layout wrapper */}
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={<route.element />} />
      ))}

      {/* Protected routes - wrapped in MainLayout */}
      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <MainLayout currentPageName={route.name}>
              <route.element />
            </MainLayout>
          }
        />
      ))}
    </Routes>
  );
}

/**
 * Main App Router
 */
export default function AppRouter() {
  return (
    <Router>
      <RouterContent />
    </Router>
  );
}

