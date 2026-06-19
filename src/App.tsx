import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HomePage } from '@/pages/HomePage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { RecordsPage } from '@/pages/RecordsPage';
import { ExportPage } from '@/pages/ExportPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Navigation } from '@/components/Navigation';
import { useReminders } from '@/hooks/useReminders';

function AppInitializer() {
  useReminders();
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
