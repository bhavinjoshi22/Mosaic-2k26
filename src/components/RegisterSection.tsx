import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './supabase';
import { useAuth } from '../hooks/useAuth';
import { compressImage } from '../lib/imageCompression';
import { ACCENT } from '../lib/theme';

type Category = 'SFIT' | 'Non-SFIT';

interface Registration {
  ticket_id: string;
  entry_code: string;
  name: string;
  college_email: string;
  mobile: string;
  category: Category;
  college_name?: string | null;
  year?: string | null;
  branch?: string | null;
  division?: string | null;
  college_id_photo_url: string;
  person_photo_url: string;
}

const SFIT_COLLEGE = 'St. Francis Institute of Technology';
const YEARS = [
  { value: 'FE', label: 'FE — First Year' },
  { value: 'SE', label: 'SE — Second Year' },
  { value: 'TE', label: 'TE — Third Year' },
  { value: 'BE', label: 'BE — Final Year' },
];
const BRANCHES = [
  { value: 'AIML', label: 'AIML' },
  { value: 'ECS', label: 'ECS' },
  { value: 'ELEC', label: 'ELEC' },
  { value: 'EXTC', label: 'EXTC' },
  { value: 'IT', label: 'IT' },
  { value: 'CMPN', label: 'CMPN' },
  { value: 'MECH', label: 'MECH' },
];
const DIVISIONS = ['A', 'B', 'C'];

interface RegisterSectionProps {
  isOpen: boolean;
  onClose: () => void;
}


export default function RegisterSection({ isOpen, onClose }: RegisterSectionProps) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState<Category>('SFIT');
  const [collegeName, setCollegeName] = useState(SFIT_COLLEGE);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState<string | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [compressingCollegeId, setCompressingCollegeId] = useState(false);
  const [compressingPerson, setCompressingPerson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setRegistration(null);
    setError(null);

    if (authLoading) return;

    if (!user?.email) {
      setLoadingInitial(false);
      return;
    }

    setLoadingInitial(true);
    supabase
      .from('registrations')
      .select('*')
      .eq('college_email', user.email)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (!fetchError && data) {
          setRegistration(data as Registration);
        }
        setLoadingInitial(false);
      });
  }, [isOpen, user?.email, authLoading]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  function handleCategoryChange(cat: Category) {
    setCategory(cat);
    if (cat === 'SFIT') {
      setCollegeName(SFIT_COLLEGE);
    } else {
      if (collegeName === SFIT_COLLEGE) setCollegeName('');
      setBranch('');
      setDivision('');
    }
  }

  async function handleFileChange(
    e: ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void,
    setCompressing: (b: boolean) => void
  ) {
    const rawFile = e.target.files?.[0] ?? null;
    if (!rawFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(rawFile);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setFile(rawFile);
      setPreview(URL.createObjectURL(rawFile));
    } finally {
      setCompressing(false);
    }
  }

  async function uploadPhoto(file: File, folder: string, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${folder}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('registration-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    return filePath;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user?.email) {
      setError('Please log in with Google first.');
      return;
    }

    if (!name || !mobile || !collegeName.trim() || !year || !collegeIdFile || !personFile) {
      setError('Please fill all fields and upload both photos.');
      return;
    }

    if (category === 'SFIT' && (!branch || !division)) {
      setError('Please select your branch and division.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from('registrations')
        .select('*')
        .eq('college_email', user.email)
        .maybeSingle();

      if (existing) {
        setRegistration(existing as Registration);
        setSubmitting(false);
        return;
      }

      const [collegeIdUrl, personUrl] = await Promise.all([
        uploadPhoto(collegeIdFile, 'college-id', user.id),
        uploadPhoto(personFile, 'person', user.id),
      ]);

      // Insert happens server-side in the `register` Edge Function, which
      // now also generates entry_code — nothing changes here except
      // reading it back from the response.
      const { data, error: fnError } = await supabase.functions.invoke('register', {
        body: {
          name,
          mobile,
          category,
          collegeName: collegeName.trim(),
          year,
          branch: category === 'SFIT' ? branch : null,
          division: category === 'SFIT' ? division : null,
          collegeIdPhotoUrl: collegeIdUrl,
          personPhotoUrl: personUrl,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }
      if (!data?.registration) {
        throw new Error(data?.error ?? 'Registration failed. Please try again.');
      }

      setRegistration(data.registration as Registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const busy = authLoading || loadingInitial;
  const step = !user ? 0 : registration ? 2 : 1;
  const steps = [
    { title: 'Sign in', desc: 'Verify with Google' },
    { title: 'Your details', desc: 'Name, ID & photo' },
    { title: 'Get your pass', desc: 'QR entry ticket' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes regBackdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes regModalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.965); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes regShimmer {
          0% { transform: translateX(-120%) skewX(-18deg); }
          60%, 100% { transform: translateX(260%) skewX(-18deg); }
        }
        @keyframes regSpin { to { transform: rotate(360deg); } }
        @keyframes regPulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
        @keyframes regTicketIn {
          from { opacity: 0; transform: translateY(18px) rotateX(14deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        .reg-backdrop { animation: regBackdrop 0.3s ease-out both; }
        .reg-modal { animation: regModalIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .reg-shimmer { animation: regShimmer 3.6s ease-in-out infinite; }
        .reg-spin { animation: regSpin 0.9s linear infinite; }
        .reg-pulse { animation: regPulse 1.6s ease-in-out infinite; }
        .reg-ticket { animation: regTicketIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; transform-origin: top center; }
        .reg-noscroll { scrollbar-width: none; }
        .reg-noscroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="reg-backdrop absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* gradient hairline border */}
      <div
        className="reg-modal relative w-full max-w-4xl rounded-[24px] p-[1px] shadow-[0_20px_100px_rgba(0,0,0,0.75)]"
        style={{
          background:
            'linear-gradient(135deg, rgba(215,226,234,0.28) 0%, rgba(215,226,234,0.08) 40%, rgba(215,226,234,0.05) 65%, rgba(227,162,76,0.4) 100%)',
        }}
      >
        <div className="relative flex max-h-[92dvh] flex-col overflow-hidden rounded-[23px] bg-[#0C0C0C]">
          {/* terminal-style title bar, echoing the committee cards */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#D7E2EA]/10 bg-[#111113] px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                aria-label="Close"
                className="group flex h-3 w-3 items-center justify-center rounded-full bg-[#D7E2EA]/15 transition-colors hover:bg-[#ff5f57]"
              >
                <span className="text-[8px] leading-none text-black opacity-0 transition-opacity group-hover:opacity-100">
                  ✕
                </span>
              </button>
              <span className="h-3 w-3 rounded-full bg-[#D7E2EA]/15" />
              <span className="h-3 w-3 rounded-full bg-[#D7E2EA]/15" />
              <span className="ml-3 font-mono text-[11px] tracking-wide text-[#D7E2EA]/40">
                ~/mosaic-2k26/register.sh
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#D7E2EA]/30 sm:block">
                esc to close
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#D7E2EA]/40">
                <span className="reg-pulse h-1.5 w-1.5 rounded-full bg-[#E3A24C]" />
                {step + 1}/3
              </span>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-[0.82fr_1.18fr]">
            {/* ─────────── left brand panel ─────────── */}
            <aside className="relative hidden overflow-hidden border-r border-[#D7E2EA]/10 p-8 md:flex md:flex-col md:justify-between">
              {/* faint mosaic grid texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    'linear-gradient(#D7E2EA 1px, transparent 1px), linear-gradient(90deg, #D7E2EA 1px, transparent 1px)',
                  backgroundSize: '34px 34px',
                  maskImage: 'radial-gradient(ellipse at 30% 20%, black 0%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 30% 20%, black 0%, transparent 75%)',
                }}
              />

              <div className="relative">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                  SFIT's Technical Fest
                </p>
                <h2 className="hero-heading mt-3 text-5xl font-black uppercase leading-[0.95] tracking-tight lg:text-6xl">
                  Mosaic
                  <br />
                  2K26
                </h2>
                <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-[#D7E2EA]/50">
                  Many minds. A brighter tomorrow. Grab your pass and be part of it.
                </p>
              </div>

              {/* vertical stepper */}
              <ol className="relative mt-10 space-y-0">
                {steps.map((s, i) => {
                  const done = i < step;
                  const active = i === step;
                  return (
                    <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < steps.length - 1 && (
                        <span
                          className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px"
                          style={{
                            background: done
                              ? '#E3A24C'
                              : 'rgba(215,226,234,0.12)',
                          }}
                        />
                      )}
                      <span
                        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${
                          done
                            ? 'border-transparent text-[#0C0C0C]'
                            : active
                              ? 'border-[#E3A24C]/70 text-[#D7E2EA]'
                              : 'border-[#D7E2EA]/15 text-[#D7E2EA]/35'
                        }`}
                        style={done ? { background: ACCENT } : undefined}
                      >
                        {done ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                      </span>
                      <div className="pt-0.5">
                        <p
                          className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                            active || done ? 'text-[#D7E2EA]' : 'text-[#D7E2EA]/35'
                          }`}
                        >
                          {s.title}
                        </p>
                        <p className="text-xs text-[#D7E2EA]/40">{s.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </aside>

            {/* ─────────── right content ─────────── */}
            <main className="reg-noscroll relative min-h-0 overflow-y-auto p-6 sm:p-8">
              {/* mobile mini-stepper */}
              <div className="mb-6 flex items-center gap-2 md:hidden">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex flex-1 flex-col gap-1.5">
                    <span
                      className="h-[3px] rounded-full transition-all"
                      style={{
                        background: i <= step ? ACCENT : 'rgba(215,226,234,0.12)',
                      }}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-widest ${
                        i === step ? 'text-[#D7E2EA]/80' : 'text-[#D7E2EA]/30'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>

              {busy ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
                  <span
                    className="reg-spin h-10 w-10 rounded-full border-2 border-[#D7E2EA]/10"
                    style={{ borderTopColor: '#E3A24C', borderRightColor: '#E3A24C' }}
                  />
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#D7E2EA]/50">
                    Establishing link…
                  </p>
                </div>
              ) : !user ? (
                /* ── STEP 1: sign in ── */
                <div className="flex min-h-[320px] flex-col justify-center">
                  <span
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D7E2EA]/15 bg-[#131315] text-[#D7E2EA]/80"
                  >
                    <Icon name="lock" className="h-5 w-5" />
                  </span>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                    Step 01 · Authenticate
                  </p>
                  <h3 className="mt-2 text-3xl font-black uppercase tracking-tight text-[#D7E2EA]">
                    Login to Register
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#D7E2EA]/50">
                    Your registration and QR pass are tied to your Google account, so log in first to continue.
                  </p>

                  <button
                    onClick={signInWithGoogle}
                    className="group relative mt-8 flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-3.5 text-sm font-semibold uppercase tracking-widest text-[#0C0C0C] transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99]"
                    style={{ background: ACCENT }}
                  >
                    <span className="reg-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-white">
                      <GoogleG />
                    </span>
                    <span className="relative">Continue with Google</span>
                  </button>
                  <p className="mt-4 flex items-center gap-2 text-xs text-[#D7E2EA]/35">
                    <Icon name="lock" className="h-3.5 w-3.5" /> We only use your Google account to verify who you are.
                  </p>
                </div>
              ) : registration ? (
                /* ── STEP 3: ticket ── */
                <div className="reg-ticket mx-auto w-full max-w-sm" style={{ perspective: '900px' }}>
                  <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                    Step 03 · Confirmed
                  </p>
                  <h3 className="mb-5 mt-2 text-center text-3xl font-black uppercase tracking-tight text-[#D7E2EA]">
                    You're In!
                  </h3>

                  <div
                    className="rounded-3xl p-[1px]"
                    style={{ background: ACCENT }}
                  >
                    <div className="relative overflow-hidden rounded-3xl bg-[#0f0f11]">

                      {/* ticket header */}
                      <div className="relative flex items-start justify-between px-6 pb-5 pt-6">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                            Admit One
                          </p>
                          <p className="hero-heading mt-1 text-2xl font-black uppercase leading-none tracking-tight">
                            Mosaic 2K26
                          </p>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-full border border-[#E3A24C]/30 bg-[#E3A24C]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[#E3A24C]">
                          <span className="reg-pulse h-1.5 w-1.5 rounded-full bg-[#E3A24C]" />
                          Valid
                        </span>
                      </div>

                      <div className="relative grid grid-cols-2 gap-4 px-6 pb-6">
                        <div className="col-span-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D7E2EA]/35">
                            Attendee
                          </p>
                          <p className="mt-1 truncate text-lg font-semibold text-[#D7E2EA]">
                            {registration.name}
                          </p>
                        </div>
                        {registration.college_name && (
                          <div className="col-span-2">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D7E2EA]/35">
                              College
                            </p>
                            <p className="mt-1 truncate text-sm text-[#D7E2EA]/80">
                              {registration.college_name}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D7E2EA]/35">
                            Category
                          </p>
                          <p className="mt-1 text-sm font-medium uppercase tracking-wider text-[#D7E2EA]/80">
                            {registration.category}
                            {registration.year ? ` · ${registration.year}` : ''}
                            {registration.branch ? ` · ${registration.branch}` : ''}
                            {registration.division ? `-${registration.division}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D7E2EA]/35">
                            Ticket
                          </p>
                          <p className="mt-1 truncate font-mono text-sm text-[#D7E2EA]/80">
                            {registration.ticket_id}
                          </p>
                        </div>
                      </div>

                      {/* perforation */}
                      <div className="relative h-0">
                        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0C0C0C]" />
                        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#0C0C0C]" />
                        <div className="mx-6 border-t border-dashed border-[#D7E2EA]/20" />
                      </div>

                      {/* QR stub */}
                      <div className="relative flex flex-col items-center px-6 pb-6 pt-6">
                        <div className="rounded-2xl bg-white p-3.5">
                          <QRCodeSVG value={registration.entry_code} size={168} />
                        </div>
                        <p className="mt-4 font-mono text-base tracking-[0.35em] text-[#D7E2EA]">
                          {registration.entry_code}
                        </p>
                        <div className="mt-4 flex h-6 w-full items-end justify-center gap-[2px] opacity-40">
                          {Array.from(registration.entry_code + registration.ticket_id).map((ch, i) => (
                            <span
                              key={i}
                              className="w-[2px] bg-[#D7E2EA]"
                              style={{ height: `${40 + (ch.charCodeAt(0) % 6) * 10}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-center text-xs uppercase tracking-widest text-[#D7E2EA]/40">
                    Show the QR at entry, or read out the code if scanning fails
                  </p>
                </div>
              ) : (
                /* ── STEP 2: form ── */
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#D7E2EA]/40">
                      Step 02 · Your details
                    </p>
                    <h3 className="mt-2 text-3xl font-black uppercase tracking-tight text-[#D7E2EA]">
                      Register Now
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" icon="user">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="As on your college ID"
                        className={inputClass}
                        required
                      />
                    </Field>
                    <Field label="Mobile number" icon="phone">
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="10-digit number"
                        className={inputClass}
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Google account email" icon="mail">
                    <input
                      type="email"
                      value={user.email ?? ''}
                      readOnly
                      disabled
                      className={`${inputClass} cursor-not-allowed !bg-[#131315]/50 !text-[#D7E2EA]/50`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#E3A24C]/30 bg-[#E3A24C]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#E3A24C]">
                      Verified
                    </span>
                  </Field>

                  {/* category segmented control */}
                  <div>
                    <label className={labelClass}>Category</label>
                    <div className="relative mt-1.5 grid grid-cols-2 rounded-xl border border-[#D7E2EA]/12 bg-[#131315] p-1">
                      <span
                        className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out"
                        style={{
                          background: ACCENT,
                          transform: category === 'SFIT' ? 'translateX(0)' : 'translateX(100%)',
                        }}
                      />
                      {(['SFIT', 'Non-SFIT'] as Category[]).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={`relative z-10 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 ${
                            category === cat ? 'text-[#0C0C0C]' : 'text-[#D7E2EA]/45 hover:text-[#D7E2EA]/80'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* college + year */}
                  <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
                    <Field label="College name" icon="building">
                      <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        placeholder="Your college"
                        className={inputClass}
                        required
                      />
                    </Field>
                    <Field label="Year" icon="cap">
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className={`${inputClass} cursor-pointer appearance-none pr-9 [&>option]:bg-[#131315] [&>option]:text-[#D7E2EA] ${
                          year ? '' : 'text-[#D7E2EA]/30'
                        }`}
                        required
                      >
                        <option value="" disabled>
                          Select year
                        </option>
                        {YEARS.map((y) => (
                          <option key={y.value} value={y.value}>
                            {y.label}
                          </option>
                        ))}
                      </select>
                      <Icon
                        name="chevron"
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D7E2EA]/40"
                      />
                    </Field>
                  </div>

                  {/* branch + division (SFIT only) */}
                  {category === 'SFIT' && (
                    <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
                      <Field label="Branch" icon="branch">
                        <select
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          className={`${inputClass} cursor-pointer appearance-none pr-9 [&>option]:bg-[#131315] [&>option]:text-[#D7E2EA] ${
                            branch ? '' : 'text-[#D7E2EA]/30'
                          }`}
                          required
                        >
                          <option value="" disabled>
                            Select branch
                          </option>
                          {BRANCHES.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                        <Icon
                          name="chevron"
                          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D7E2EA]/40"
                        />
                      </Field>
                      <Field label="Division" icon="users">
                        <select
                          value={division}
                          onChange={(e) => setDivision(e.target.value)}
                          className={`${inputClass} cursor-pointer appearance-none pr-9 [&>option]:bg-[#131315] [&>option]:text-[#D7E2EA] ${
                            division ? '' : 'text-[#D7E2EA]/30'
                          }`}
                          required
                        >
                          <option value="" disabled>
                            Select div
                          </option>
                          {DIVISIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <Icon
                          name="chevron"
                          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D7E2EA]/40"
                        />
                      </Field>
                    </div>
                  )}

                  {/* uploads */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <UploadBox
                      label="College ID photo"
                      hint="Front of your ID card"
                      icon="id"
                      preview={collegeIdPreview}
                      compressing={compressingCollegeId}
                      onChange={(e) =>
                        handleFileChange(e, setCollegeIdFile, setCollegeIdPreview, setCompressingCollegeId)
                      }
                    />
                    <UploadBox
                      label="Your photo"
                      hint="Clear, face visible"
                      icon="camera"
                      preview={personPreview}
                      compressing={compressingPerson}
                      onChange={(e) => handleFileChange(e, setPersonFile, setPersonPreview, setCompressingPerson)}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-xs uppercase tracking-wider text-red-300">
                      <Icon name="alert" className="mt-px h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || compressingCollegeId || compressingPerson}
                    className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl py-3.5 text-sm font-semibold uppercase tracking-widest text-[#0C0C0C] transition-transform duration-200 hover:scale-[1.015] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: ACCENT }}
                  >
                    <span className="reg-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    {submitting && <span className="reg-spin relative h-4 w-4 rounded-full border-2 border-black/20 border-t-black" />}
                    <span className="relative">{submitting ? 'Registering…' : 'Get my pass'}</span>
                    {!submitting && <span className="relative transition-transform group-hover:translate-x-1">→</span>}
                  </button>
                </form>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

const labelClass = 'text-[11px] font-medium uppercase tracking-[0.2em] text-[#D7E2EA]/45';

const inputClass =
  'w-full rounded-xl border border-[#D7E2EA]/12 bg-[#131315] py-3 pl-10 pr-3 text-sm text-[#D7E2EA] outline-none transition placeholder:text-[#D7E2EA]/25 focus:border-[#E3A24C]/70 focus:shadow-[0_0_0_3px_rgba(227,162,76,0.15)]';

const ICONS: Record<string, string> = {
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  phone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  id: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2 M14 9h5 M14 13h5',
  camera:
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  check: 'M20 6L9 17l-5-5',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z M8 11V7a4 4 0 0 1 8 0v4',
  alert:
    'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  building:
    'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4h6v4 M9 10h.01 M15 10h.01 M9 13h.01 M15 13h.01',
  cap: 'M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 2 9 2 12 0v-5',
  chevron: 'M6 9l6 6 6-6',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  branch: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
};

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative mt-1.5">
        <Icon
          name={icon}
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D7E2EA]/35"
        />
        {children}
      </div>
    </div>
  );
}

interface UploadBoxProps {
  label: string;
  hint: string;
  icon: string;
  preview: string | null;
  compressing: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function UploadBox({ label, hint, icon, preview, compressing, onChange }: UploadBoxProps) {
  const done = !compressing && !!preview;
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <label
        className={`group relative mt-1.5 flex h-[104px] cursor-pointer items-center gap-3.5 overflow-hidden rounded-xl border border-dashed px-3.5 transition-all duration-200 focus-within:border-[#E3A24C]/70 ${
          done
            ? 'border-[#E3A24C]/40 bg-[#E3A24C]/[0.04]'
            : 'border-[#D7E2EA]/20 bg-[#131315] hover:border-[#E3A24C]/60 hover:bg-[#E3A24C]/[0.04]'
        }`}
      >
        <input type="file" accept="image/*" onChange={onChange} className="sr-only" />

        {compressing ? (
          <>
            <span
              className="reg-spin h-8 w-8 shrink-0 rounded-full border-2 border-[#D7E2EA]/10"
              style={{ borderTopColor: '#E3A24C' }}
            />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#D7E2EA]/50">Compressing…</span>
          </>
        ) : preview ? (
          <>
            <img src={preview} alt={`${label} preview`} className="h-[76px] w-[76px] shrink-0 rounded-lg border border-[#D7E2EA]/15 object-cover" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E3A24C]">
                <Icon name="check" className="h-3.5 w-3.5" /> Uploaded
              </p>
              <p className="mt-1 text-[11px] text-[#D7E2EA]/40 transition-colors group-hover:text-[#D7E2EA]/70">
                Tap to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D7E2EA]/12 bg-[#0C0C0C] text-[#D7E2EA]/50 transition-colors group-hover:text-[#E3A24C]">
              <Icon name={icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D7E2EA]/70">Upload</p>
              <p className="mt-0.5 text-[11px] text-[#D7E2EA]/35">{hint}</p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}