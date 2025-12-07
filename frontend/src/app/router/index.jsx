/**
 * Main Router Component
 * Handles all application routing with lazy loading support
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import { publicRoutes, protectedRoutes, getCurrentPage } from './routes';
import { SuspenseLoader } from '@/shared/components/PageLoader/SuspenseLoader';

/**
 * Router Content (must be inside Router context to use useLocation)
 */
function RouterContent() {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);

  return (
    <Suspense fallback={<SuspenseLoader />}>
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
    </Suspense>
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

