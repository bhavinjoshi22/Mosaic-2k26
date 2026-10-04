import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import VolunteerScanPage from './components/VolunteerScanPage';
import LiveEntriesPage from './components/LiveEntriesPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import { supabase } from './components/supabase';
import { useAuth } from './hooks/useAuth';

const isVolunteerPage = window.location.pathname === '/scan';
const isLivePage = window.location.pathname === '/live';
const isAdminPage = window.location.pathname === '/admin';

function RootRoute() {
  const { user, loading } = useAuth();
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setIsVolunteer(false);
      setIsAdmin(false);
      setRoleChecked(true);
      return;
    }

    let cancelled = false;
    supabase.functions.invoke('check-volunteer').then(({ data }) => {
      if (cancelled) return;
      setIsVolunteer(data?.isVolunteer === true);
      setIsAdmin(data?.isAdmin === true);
      setRoleChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  // While we're still checking who this logged-in user is, hold off on
  // rendering the public site — otherwise the admin/volunteer would see a
  // flash of the normal homepage before being swapped to their dashboard.
  if (user && !roleChecked) return null;

  // Admin takes priority: the moment the owner's account (is_admin=true)
  // logs in anywhere on the site, they land on the admin dashboard
  // instead of the public homepage.
  if (isAdmin) return <AdminDashboardPage />;
  if (isVolunteer) return <VolunteerScanPage />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminPage ? (
      <AdminDashboardPage />
    ) : isLivePage ? (
      <LiveEntriesPage />
    ) : isVolunteerPage ? (
      <VolunteerScanPage />
    ) : (
      <RootRoute />
    )}
  </StrictMode>
);