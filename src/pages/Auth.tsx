import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, BarChart3, Mail, Lock, User, ArrowRight, KeyRound, AtSign, X, Delete } from 'lucide-react';

type Tab = 'signin' | 'passcode' | 'signup' | 'reset';

const Auth = () => {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<Tab>('signin');

  // Passcode login state
  const [passcodeUsername, setPasscodeUsername] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState<string[]>([]);
  const PASSCODE_LENGTH = 5;

  // Signup passcode state
  const [signupPasscode, setSignupPasscode] = useState<string[]>(Array(5).fill(''));
  const [signupConfirmPasscode, setSignupConfirmPasscode] = useState<string[]>(Array(5).fill(''));
  const passcodeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    password: '',
    username: '',
    full_name: '',
  });

  if (user) return <Navigate to="/" replace />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Password Sign In ───
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(formData.identifier, formData.password);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "Signed in successfully." });
    }
    setLoading(false);
  };

  // ─── Sign Up (with 5-digit passcode as password) ───
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = signupPasscode.join('');
    const confirm = signupConfirmPasscode.join('');

    if (code.length !== PASSCODE_LENGTH) {
      toast({ title: "Error", description: "Please enter all 5 digits for your passcode", variant: "destructive" });
      return;
    }
    if (code !== confirm) {
      toast({ title: "Error", description: "Passcodes do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await signUp(formData.email, code, {
      username: formData.username,
      full_name: formData.full_name
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
    }
    setLoading(false);
  };

  // ─── Reset Password ───
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(formData.email);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "Password reset link sent." });
    }
    setLoading(false);
  };

  // ─── Passcode Modal Flow ───
  const openPasscodeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeUsername.trim()) {
      toast({ title: "Error", description: "Please enter your username or email", variant: "destructive" });
      return;
    }
    setPasscode([]);
    setShowPasscodeModal(true);
  };

  const handlePasscodeDigit = async (digit: string) => {
    if (loading) return;
    const next = [...passcode, digit];
    setPasscode(next);

    if (next.length === PASSCODE_LENGTH) {
      setLoading(true);
      const code = next.join('');
      const { error } = await signIn(passcodeUsername, code);
      if (error) {
        toast({ title: "Incorrect passcode", description: "Please try again.", variant: "destructive" });
        setPasscode([]);
      } else {
        toast({ title: "Welcome back!", description: "Signed in successfully." });
        setShowPasscodeModal(false);
      }
      setLoading(false);
    }
  };

  const handlePasscodeDelete = () => {
    if (!loading) setPasscode(prev => prev.slice(0, -1));
  };

  // ─── Signup Passcode Input Handlers ───
  const handleDigitInput = (
    index: number,
    value: string,
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...arr];
    updated[index] = value;
    setArr(updated);
    if (value && index < PASSCODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const tabs: [Tab, string][] = [
    ['signin', 'Password'],
    ['passcode', 'Passcode'],
    ['signup', 'Sign Up'],
    ['reset', 'Reset'],
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Bg accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute -bottom-1/2 -left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 mb-3">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Just Tracker</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {tab === 'signin' && 'Sign in with your credentials'}
            {tab === 'passcode' && 'Quick sign in with passcode'}
            {tab === 'signup' && 'Create your account'}
            {tab === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-border/50 shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50 overflow-x-auto">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 min-w-0 py-2.5 sm:py-3 text-[11px] sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                  tab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {tab === id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* ─── Password Sign In ─── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5 animate-fade-in">
                <InputField
                  icon={<AtSign className="h-4 w-4" />}
                  name="identifier"
                  type="text"
                  placeholder="Email or username"
                  value={formData.identifier}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<Lock className="h-4 w-4" />}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  suffix={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setTab('reset')} className="text-[11px] sm:text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                    Forgot password?
                  </button>
                  <button type="button" onClick={() => setTab('passcode')} className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> Use passcode
                  </button>
                </div>
                <SubmitButton loading={loading} label="Sign In" />
                <SwitchLink text="Don't have an account?" action="Sign up" onClick={() => setTab('signup')} />
              </form>
            )}

            {/* ─── Passcode Sign In ─── */}
            {tab === 'passcode' && (
              <form onSubmit={openPasscodeModal} className="space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mx-auto mb-1">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Enter your username or email, then type your 5-digit passcode.
                </p>
                <InputField
                  icon={<AtSign className="h-4 w-4" />}
                  name="passcode-username"
                  type="text"
                  placeholder="Email or username"
                  value={passcodeUsername}
                  onChange={(e) => setPasscodeUsername(e.target.value)}
                />
                <SubmitButton loading={false} label="Enter Passcode" />
                <SwitchLink text="Prefer a text password?" action="Sign in with password" onClick={() => setTab('signin')} />
              </form>
            )}

            {/* ─── Sign Up ─── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5 animate-fade-in">
                <InputField icon={<User className="h-4 w-4" />} name="full_name" type="text" placeholder="Full name" value={formData.full_name} onChange={handleInputChange} />
                <InputField icon={<AtSign className="h-4 w-4" />} name="username" type="text" placeholder="Username" value={formData.username} onChange={handleInputChange} />
                <InputField icon={<Mail className="h-4 w-4" />} name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} />

                {/* 5-digit passcode */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Set your 5-digit passcode</label>
                  <PasscodeBoxes
                    values={signupPasscode}
                    refs={passcodeRefs}
                    onChange={(i, v) => handleDigitInput(i, v, signupPasscode, setSignupPasscode, passcodeRefs)}
                    onKeyDown={(i, e) => handleDigitKeyDown(i, e, signupPasscode, setSignupPasscode, passcodeRefs)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Confirm passcode</label>
                  <PasscodeBoxes
                    values={signupConfirmPasscode}
                    refs={confirmRefs}
                    onChange={(i, v) => handleDigitInput(i, v, signupConfirmPasscode, setSignupConfirmPasscode, confirmRefs)}
                    onKeyDown={(i, e) => handleDigitKeyDown(i, e, signupConfirmPasscode, setSignupConfirmPasscode, confirmRefs)}
                  />
                </div>

                <SubmitButton loading={loading} label="Create Account" />
                <SwitchLink text="Already have an account?" action="Sign in" onClick={() => setTab('signin')} />
              </form>
            )}

            {/* ─── Reset ─── */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-3.5 animate-fade-in">
                <p className="text-xs sm:text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
                <InputField icon={<Mail className="h-4 w-4" />} name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                <SubmitButton loading={loading} label="Send Reset Link" />
                <SwitchLink text="Remember your password?" action="Sign in" onClick={() => setTab('signin')} />
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] sm:text-[11px] text-muted-foreground/60 mt-5">Just Tracker v2.1.0</p>
      </div>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <PasscodeModal
          username={passcodeUsername}
          passcode={passcode}
          length={PASSCODE_LENGTH}
          loading={loading}
          onDigit={handlePasscodeDigit}
          onDelete={handlePasscodeDelete}
          onClose={() => { setShowPasscodeModal(false); setPasscode([]); }}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Passcode Modal (phone-style PIN pad)
   ═══════════════════════════════════════════════ */
function PasscodeModal({
  username, passcode, length, loading, onDigit, onDelete, onClose,
}: {
  username: string; passcode: string[]; length: number;
  loading: boolean; onDigit: (d: string) => void; onDelete: () => void; onClose: () => void;
}) {
  const digits = ['1','2','3','4','5','6','7','8','9','','0','del'];

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) onDigit(e.key);
      else if (e.key === 'Backspace') onDelete();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDigit, onDelete, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[340px] mx-0 sm:mx-4 animate-scale-in">
        <div className="glass rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="pt-6 sm:pt-8 pb-3 sm:pb-4 px-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground truncate max-w-[200px] mx-auto">{username}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Enter your 5-digit passcode</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 sm:gap-3.5 py-4 sm:py-5">
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full transition-all duration-200 ${
                  i < passcode.length
                    ? 'bg-primary scale-110'
                    : 'bg-muted-foreground/20 border border-border/50'
                } ${loading && i < passcode.length ? 'animate-pulse' : ''}`}
              />
            ))}
          </div>

          {/* Number Pad */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-1 sm:pt-2">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {digits.map((d, i) => {
                if (d === '') return <div key={i} />;
                if (d === 'del') {
                  return (
                    <button
                      key={i}
                      onClick={onDelete}
                      disabled={loading}
                      className="h-12 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-95 transition-all disabled:opacity-40"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                  );
                }
                return (
                  <button
                    key={i}
                    onClick={() => onDigit(d)}
                    disabled={loading}
                    className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-muted/30 border border-border/30 text-lg sm:text-xl font-semibold text-foreground hover:bg-muted/60 active:scale-95 active:bg-primary/20 transition-all disabled:opacity-40"
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center pb-5 sm:pb-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Signup Passcode Boxes (inline 5-digit input)
   ═══════════════════════════════════════════════ */
function PasscodeBoxes({
  values, refs, onChange, onKeyDown
}: {
  values: string[];
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
}) {
  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {values.map((v, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════ */
function InputField({
  icon, name, type, placeholder, value, onChange, suffix
}: {
  icon: React.ReactNode;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        className="w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-9 sm:pr-10 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      />
      {suffix && <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-10 sm:h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{label}<ArrowRight className="h-4 w-4" /></>}
    </button>
  );
}

function SwitchLink({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <p className="text-center text-[11px] sm:text-xs text-muted-foreground pt-1.5">
      {text}{' '}
      <button type="button" onClick={onClick} className="text-primary font-medium hover:text-primary/80 transition-colors">{action}</button>
    </p>
  );
}

export default Auth;
