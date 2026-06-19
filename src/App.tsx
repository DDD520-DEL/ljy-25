import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HomePage } from '@/pages/HomePage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { RecordsPage } from '@/pages/RecordsPage';
import { ExportPage } from '@/pages/ExportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Navigation } from '@/components/Navigation';
import { useReminders } from '@/hooks/useReminders';
import { useSync } from '@/hooks/useSync';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useRef } from 'react';

function AppInitializer() {
  useReminders();
  const { pullOnStartup } = useSync();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const justLoggedIn = useAuthStore((s) => s.syncStatus.justLoggedIn);
  const validateSession = useAuthStore((s) => s.validateSession);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (isAuthenticated && !justLoggedIn && !hasSyncedRef.current) {
        const valid = await validateSession();
        if (valid) {
          hasSyncedRef.current = true;
          await pullOnStartup();
        }
      }
    };
    init();
  }, [isAuthenticated, justLoggedIn, validateSession, pullOnStartup]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <HomePage />
            </motion.div>
          }
        />
        <Route
          path="/analysis"
          element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisPage />
            </motion.div>
          }
        />
        <Route
          path="/records"
          element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecordsPage />
            </motion.div>
          }
        />
        <Route
          path="/export"
          element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ExportPage />
            </motion.div>
          }
        />
        <Route
          path="/settings"
          element={
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AppInitializer />
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100">
        <AnimatedRoutes />
        <Navigation />
      </div>
    </Router>
  );
}
