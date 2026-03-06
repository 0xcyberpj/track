import { useState, useRef, useCallback } from 'react';
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

  // Passcode modal state
  const [passcodeUsername, setPasscodeUsername] = useState('');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState<string[]>([]);
  const PASSCODE_LENGTH = 5;

  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    password: '',
    username: '',
    full_name: '',
    confirmPassword: ''
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, {
      username: formData.username,
      full_name: formData.full_name
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Please check your email to verify your account." });
    }
    setLoading(false);
  };

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
      toast({ title: "Success!", description: "Check your email for password reset instructions." });
    }
    setLoading(false);
  };

  // Passcode flow
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
    const newPasscode = [...passcode, digit];
    setPasscode(newPasscode);

    if (newPasscode.length === PASSCODE_LENGTH) {
      // Auto-submit
      setLoading(true);
      const code = newPasscode.join('');
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
    if (loading) return;
    setPasscode(prev => prev.slice(0, -1));
  };

  const tabs: [Tab, string][] = [['signin', 'Password'], ['passcode', 'Passcode'], ['signup', 'Sign Up'], ['reset', 'Reset']];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Just Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'signin' && 'Sign in with your credentials'}
            {tab === 'passcode' && 'Quick sign in with your passcode'}
            {tab === 'signup' && 'Create your account to get started'}
            {tab === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-border/50 shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-all relative ${
                  tab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {tab === id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Password Sign In */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4 animate-fade-in">
                <InputField
                  icon={<AtSign className="h-4 w-4" />}
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Email or username"
                  value={formData.identifier}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<Lock className="h-4 w-4" />}
                  id="password"
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
                  <button type="button" onClick={() => setTab('reset')} className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                    Forgot password?
                  </button>
                  <button type="button" onClick={() => setTab('passcode')} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    Use passcode
                  </button>
                </div>
                <SubmitButton loading={loading} label="Sign In" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-primary font-medium hover:text-primary/80 transition-colors">Sign up</button>
                </p>
              </form>
            )}

            {/* Passcode Sign In */}
            {tab === 'passcode' && (
              <form onSubmit={openPasscodeModal} className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-2">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Enter your username or email, then type your 5-digit passcode.
                </p>
                <InputField
                  icon={<AtSign className="h-4 w-4" />}
                  id="passcode-username"
                  name="passcode-username"
                  type="text"
                  placeholder="Email or username"
                  value={passcodeUsername}
                  onChange={(e) => setPasscodeUsername(e.target.value)}
                />
                <SubmitButton loading={false} label="Enter Passcode" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Prefer a text password?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">Sign in with password</button>
                </p>
              </form>
            )}

            {/* Sign Up */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4 animate-fade-in">
                <InputField icon={<User className="h-4 w-4" />} id="full_name" name="full_name" type="text" placeholder="Full name" value={formData.full_name} onChange={handleInputChange} />
                <InputField icon={<AtSign className="h-4 w-4" />} id="username" name="username" type="text" placeholder="Username" value={formData.username} onChange={handleInputChange} />
                <InputField icon={<Mail className="h-4 w-4" />} id="signup-email" name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                <InputField icon={<Lock className="h-4 w-4" />} id="signup-password" name="password" type="password" placeholder="Create password" value={formData.password} onChange={handleInputChange} />
                <InputField icon={<Lock className="h-4 w-4" />} id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange} />
                <SubmitButton loading={loading} label="Create Account" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">Sign in</button>
                </p>
              </form>
            )}

            {/* Reset */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
                <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                <InputField icon={<Mail className="h-4 w-4" />} id="reset-email" name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleInputChange} />
                <SubmitButton loading={loading} label="Send Reset Link" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Remember your password?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">Sign in</button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/60 mt-6">Just Tracker v2.1.0</p>
      </div>

      {/* Passcode Modal Overlay */}
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

/* ─── Passcode Modal ─── */
function PasscodeModal({
  username,
  passcode,
  length,
  loading,
  onDigit,
  onDelete,
  onClose,
}: {
  username: string;
  passcode: string[];
  length: number;
  loading: boolean;
  onDigit: (d: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[340px] mx-4 animate-scale-in">
        <div className="glass rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="pt-8 pb-4 px-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{username}</p>
            <p className="text-xs text-muted-foreground mt-1">Enter your 5-digit passcode</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3.5 py-5">
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < passcode.length
                    ? 'bg-primary scale-110'
                    : 'bg-muted-foreground/20 border border-border/50'
                } ${loading && i < passcode.length ? 'animate-pulse' : ''}`}
              />
            ))}
          </div>

          {/* Number Pad */}
          <div className="px-8 pb-8 pt-2">
            <div className="grid grid-cols-3 gap-3">
              {digits.map((d, i) => {
                if (d === '') return <div key={i} />;
                if (d === 'del') {
                  return (
                    <button
                      key={i}
                      onClick={onDelete}
                      disabled={loading}
                      className="h-14 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 active:scale-95 transition-all disabled:opacity-40"
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
                    className="h-14 rounded-2xl bg-muted/30 border border-border/30 text-xl font-semibold text-foreground hover:bg-muted/60 active:scale-95 active:bg-primary/20 transition-all disabled:opacity-40"
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center pb-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */
function InputField({
  icon, id, name, type, placeholder, value, onChange, suffix
}: {
  icon: React.ReactNode;
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
        {icon}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{label}<ArrowRight className="h-4 w-4" /></>}
    </button>
  );
}

export default Auth;
