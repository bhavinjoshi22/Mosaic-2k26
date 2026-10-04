import { useAuth } from '../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';
import { ACCENT } from '../lib/theme';


// Drop this component wherever the old "Register" button was in your Navbar.
export default function NavAuthSection() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-[#151515] border border-[#D7E2EA]/15" />;
  }

  if (user) {
    return <ProfileDropdown />;
  }

  return (
    <button onClick={signInWithGoogle} className="group relative rounded-full p-[2px]">
      <span
        className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: ACCENT }}
      />
      <span className="relative flex items-center gap-2 rounded-full border border-[#D7E2EA]/20 bg-[#0C0C0C] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#D7E2EA] transition-colors group-hover:border-transparent sm:text-sm">
        Login
      </span>
    </button>
  );
}