import { useEffect, useState } from 'react';
import HeroSection from './components/HeroSection';
import MarqueeSection from './components/MarqueeSection';
import AboutSection from './components/AboutSection';
import ProjectsSection from './components/Event';
import ContactSection from './components/ContactSection';
import RegisterSection from './components/RegisterSection';
import SideNav from './components/SideNav';
import SocialSidebar from './components/SocialSidebar';
import AdminDashboardPage from './components/AdminDashboardPage';
import { useAuth } from './hooks/useAuth';
import { supabase } from './components/supabase';

function App() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin';
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncAdminView = () => {
      setShowAdmin(window.location.hash === '#admin' || window.location.pathname === '/admin');
    };

    syncAdminView();
    window.addEventListener('hashchange', syncAdminView);
    window.addEventListener('popstate', syncAdminView);

    return () => {
      window.removeEventListener('hashchange', syncAdminView);
      window.removeEventListener('popstate', syncAdminView);
    };
  }, []);

  useEffect(() => {
    if (loading || !user) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    supabase.functions.invoke('check-volunteer').then(({ data }) => {
      if (!cancelled) setIsAdmin(data?.isAdmin === true);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (showAdmin || isAdmin) {
    return <AdminDashboardPage />;
  }

  return (
    <div className="min-h-screen bg-[#0C0C0C] pb-20 lg:pb-0" style={{ overflowX: 'clip' }}>
      <SideNav onRegisterClick={() => setShowRegister(true)} />
      <SocialSidebar />
      <HeroSection onRegisterClick={() => setShowRegister(true)} />
      <MarqueeSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
      <RegisterSection isOpen={showRegister} onClose={() => setShowRegister(false)} />
    </div>
  );
}

export default App;