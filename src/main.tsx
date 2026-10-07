import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import VolunteerScanPage from './components/VolunteerScanPage';
import LiveEntriesPage from './components/LiveEntriesPage';
import AdminDashboardPage from './components/AdminDashboardPage';
import { useRole } from './hooks/roleCheck';

const isVolunteerPage = window.location.pathname === '/scan';
const isLivePage = window.location.pathname === '/live';
const isAdminPage = window.location.pathname === '/admin';

// Neutral screen shown while we work out who just logged in, so nobody sees
// the public homepage flash before their dashboard.
function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0C0C0C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <style>{`@keyframes mosaic-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: '#D7E2EA', fontFamily: 'Kanit, sans-serif', fontWeight: 900, letterSpacing: '0.2em', fontSize: 14 }}>
        MOSAIC-2K26
      </span>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          border: '2px solid rgba(215,226,234,0.15)',
          borderTopColor: '#E3A24C',
          animation: 'mosaic-spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function RootRoute() {
  const { info, pending } = useRole();

  if (pending) return <Splash />;
  // Admin takes priority over volunteer.
  if (info?.isAdmin) return <AdminDashboardPage />;
  if (info?.isVolunteer) return <VolunteerScanPage />;
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