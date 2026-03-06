import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, BarChart3, Mail, Lock, User, ArrowRight, KeyRound, AtSign } from 'lucide-react';

type Tab = 'signin' | 'otp' | 'signup' | 'reset';

const Auth = () => {
  const { user, signIn, signUp, signInWithOtp, verifyOtp, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<Tab>('signin');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
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
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signInWithOtp(formData.email);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOtpStep('code');
      setOtpCode(['', '', '', '', '']);
      toast({ title: "Code sent!", description: "Check your email for the 5-digit code." });
    }
    setLoading(false);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);

    // Auto-focus next input
    if (value && index < 4) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(d => d !== '') && newCode.join('').length === 5) {
      handleVerifyOtp(newCode.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (pasted.length === 5) {
      const newCode = pasted.split('');
      setOtpCode(newCode);
      otpRefs.current[4]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    const { error } = await verifyOtp(formData.email, code);
    if (error) {
      toast({ title: "Invalid code", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
      setOtpCode(['', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } else {
      toast({ title: "Welcome!", description: "You have successfully signed in." });
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

  const tabs: [Tab, string][] = [['signin', 'Password'], ['otp', 'OTP Code'], ['signup', 'Sign Up'], ['reset', 'Reset']];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
        <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'hsl(var(--primary))' }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Just Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'signin' && 'Sign in with email or username'}
            {tab === 'otp' && (otpStep === 'email' ? 'Get a one-time code to sign in' : 'Enter the code sent to your email')}
            {tab === 'signup' && 'Create your account to get started'}
            {tab === 'reset' && 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-border/50 shadow-card overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-border/50">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setTab(id); if (id === 'otp') setOtpStep('email'); }}
                className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-all relative ${
                  tab === id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
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
            {/* Sign In with Password */}
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
                  <button
                    type="button"
                    onClick={() => setTab('reset')}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('otp')}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" />
                    Use OTP instead
                  </button>
                </div>
                <SubmitButton loading={loading} label="Sign In" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-primary font-medium hover:text-primary/80 transition-colors">
                    Sign up
                  </button>
                </p>
              </form>
            )}

            {/* OTP Sign In */}
            {tab === 'otp' && (
              <div className="animate-fade-in">
                {otpStep === 'email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-2">
                      <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      We'll send a 5-digit code to your email for passwordless sign in.
                    </p>
                    <InputField
                      icon={<Mail className="h-4 w-4" />}
                      id="otp-email"
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    <SubmitButton loading={loading} label="Send Code" />
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-3">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Code sent to <span className="text-foreground font-medium">{formData.email}</span>
                      </p>
                    </div>

                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-2.5">
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpInput(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>

                    {loading && (
                      <div className="flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      Didn't receive it?{' '}
                      <button
                        type="button"
                        onClick={() => { setOtpStep('email'); setOtpCode(['', '', '', '', '']); }}
                        className="text-primary font-medium hover:text-primary/80 transition-colors"
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground pt-4">
                  Prefer a password?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">
                    Sign in with password
                  </button>
                </p>
              </div>
            )}

            {/* Sign Up */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4 animate-fade-in">
                <InputField
                  icon={<User className="h-4 w-4" />}
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="Full name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<AtSign className="h-4 w-4" />}
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<Mail className="h-4 w-4" />}
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<Lock className="h-4 w-4" />}
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <InputField
                  icon={<Lock className="h-4 w-4" />}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <SubmitButton loading={loading} label="Create Account" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* Reset */}
            {tab === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
                <p className="text-sm text-muted-foreground">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <InputField
                  icon={<Mail className="h-4 w-4" />}
                  id="reset-email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <SubmitButton loading={loading} label="Send Reset Link" />
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Remember your password?{' '}
                  <button type="button" onClick={() => setTab('signin')} className="text-primary font-medium hover:text-primary/80 transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
          Just Tracker v2.1.0
        </p>
      </div>
    </div>
  );
};

function InputField({
  icon,
  id,
  name,
  type,
  placeholder,
  value,
  onChange,
  suffix
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
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {suffix}
        </div>
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
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export default Auth;
