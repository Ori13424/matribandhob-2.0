import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile } from './authService'; // This import now works

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null, profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true, // Start loading to check session on app start
  error: null,

  setUser: (user, profile) => set({ user, profile, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  logout: () => set({ user: null, profile: null, isLoading: false, error: null }),
}));