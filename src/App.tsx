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

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin';
  });

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

  if (showAdmin) {
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