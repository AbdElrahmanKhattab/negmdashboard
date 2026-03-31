import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to listen for auth state changes and sync with Zustand store.
 * Place this in the root layout (AppShell or App).
 */
export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);
  const setOffice = useAuthStore((s) => s.setOffice);
  const setRole = useAuthStore((s) => s.setRole);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const navigate = useNavigate();

  const syncProfile = async (userId) => {
    if (!userId) {
      setOffice(null);
      setRole(null);
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('*, office:offices(*)')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error syncing profile:', error);
      return;
    }

    if (data) {
      setOffice(data.office);
      setRole(data.role);
    } else {
      // No profile found - user might be in a "ghost" state or just signed up
      setOffice(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Get current session on mount and set initialized
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      syncProfile(u?.id);
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      syncProfile(u?.id);
      setInitialized(true);
      
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setOffice, setRole, setInitialized, navigate]);
}

/**
 * Sign in with email & password.
 */
export async function signInWithEmail(email, password, rememberMe = true) {
  // Note: Supabase JS client handles persistence via localStorage by default.
  // Real "15 days" TTL is managed in the Supabase Dashboard > Auth > Sessions.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign up a new user and insert their profile row into public.users.
 */
export async function signUpWithEmail(email, password, fullName, officeId) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Insert into public.users profile table
  if (data.user) {
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      full_name: fullName,
      office_id: officeId,
      role: 'owner',
    });
    if (profileError) throw profileError;
  }
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
