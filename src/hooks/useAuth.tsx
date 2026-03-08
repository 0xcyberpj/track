import { useState, useEffect, useContext, createContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { username: string; full_name: string }) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: { username: string; full_name: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { error };
  };

  const resolveEmail = async (identifier: string): Promise<{ email: string | null; error: any }> => {
    // If it's already an email, return it directly
    if (identifier.includes('@')) {
      return { email: identifier, error: null };
    }

    // Resolve username → user_id → email
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', identifier)
      .maybeSingle();

    if (lookupError || !profile) {
      return { email: null, error: { message: 'No account found with that username.' } };
    }

    const { data: emailData, error: rpcError } = await supabase
      .rpc('get_email_by_user_id', { uid: profile.user_id }) as { data: string | null; error: any };

    if (rpcError || !emailData) {
      return { email: null, error: { message: 'Could not resolve username. Please use your email address.' } };
    }

    return { email: emailData, error: null };
  };

  const signIn = async (identifier: string, password: string) => {
    const { email, error: resolveError } = await resolveEmail(identifier);
    if (resolveError || !email) return { error: resolveError };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
