import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  authError: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  continueAsGuest: () => void;
  logout: () => void;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = 'sdp_auth_token';
const GUEST_KEY = 'sdp_is_guest';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  isAuthenticated: false,
  isGuest: typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) === 'true' : false,
  isLoading: true,
  authError: null,

  clearError: () => set({ authError: null }),

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, authError: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.removeItem(GUEST_KEY);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        authError: null,
      });

      return true;
    } catch (err: any) {
      set({ authError: err.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (email: string, password: string, name: string): Promise<boolean> => {
    set({ isLoading: true, authError: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.removeItem(GUEST_KEY);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        authError: null,
      });

      return true;
    } catch (err: any) {
      set({ authError: err.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  continueAsGuest: async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(GUEST_KEY, 'true');
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isGuest: true,
          isLoading: false,
          authError: null,
        });
        return;
      }
    } catch (err) {
      console.warn('Backend guest auth call failed, falling back to offline guest session:', err);
    }

    const guestUser: UserProfile = {
      id: 'usr_guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Architect',
      email: 'guest@playground.local',
      avatar: '🚀',
    };

    localStorage.setItem(GUEST_KEY, 'true');

    set({
      user: guestUser,
      token: null,
      isAuthenticated: true,
      isGuest: true,
      isLoading: false,
      authError: null,
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUEST_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      authError: null,
    });
  },

  checkSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const isGuest = localStorage.getItem(GUEST_KEY) === 'true';

    if (isGuest) {
      if (!token) {
        try {
          const res = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem(TOKEN_KEY, data.token);
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isGuest: true,
              isLoading: false,
            });
            return;
          }
        } catch {
          // offline fallback below
        }
      }

      set({
        user: {
          id: 'usr_guest_stored',
          name: 'Guest Architect',
          email: 'guest@playground.local',
          avatar: '🚀',
        },
        token,
        isAuthenticated: true,
        isGuest: true,
        isLoading: false,
      });
      return;
    }

    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isGuest: false, isLoading: false });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Session invalid');
      }

      const data = await res.json();
      set({
        user: data.user,
        token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, isAuthenticated: false, isGuest: false, isLoading: false });
    }
  },
}));
