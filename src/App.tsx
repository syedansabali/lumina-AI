import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Processing } from './pages/Processing';
import { Reader } from './pages/Reader';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { cn } from './lib/utils';

import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const showSidebar = location.pathname.startsWith('/dashboard') || 
                      location.pathname === '/processing';
  
  // Reader view is full screen except for Navbar
  const isReader = location.pathname === '/reader';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="atmosphere" />
      <Navbar />
      <div className="flex-1 flex w-full">
        {showSidebar && <Sidebar />}
        <main className={cn(
          "flex-1",
          showSidebar && "md:ml-64 p-8",
          !showSidebar && !isReader && "w-full",
          isReader && "w-full overflow-hidden"
        )}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
            <Route path="/reader" element={<ProtectedRoute><Reader /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
