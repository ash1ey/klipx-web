import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User } from '@/types';

interface AuthState {
  // State
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// Generate a unique 8-character referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  firebaseUser: null,
  user: null,
  loading: true,
  initialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            set({
              firebaseUser,
              user: { ...userData, uid: firebaseUser.uid },
              loading: false,
              initialized: true,
            });

            // Update last login
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: serverTimestamp(),
            });
          } else {
            // User document doesn't exist - this shouldn't happen normally
            set({ firebaseUser, user: null, loading: false, initialized: true });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ firebaseUser, user: null, loading: false, initialized: true });
        }
      } else {
        set({ firebaseUser: null, user: null, loading: false, initialized: true });
      }
    });

    return unsubscribe;
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, username: string, referralCode?: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Create user document in Firestore
      const newUser: Omit<User, 'uid'> = {
        email,
        username,
        photoUrl: null,
        credits: 60, // Signup bonus (increased until Jan 2026)
        isPremium: false,
        followersCount: 0,
        followingCount: 0,
        totalLikesReceived: 0,

        // Referral system
        referralCode: generateReferralCode(),
        referredByCode: referralCode || null,
        totalReferrals: 0,
        referralTier1Claimed: false,
        referralTier2Claimed: false,
        referralTier3Claimed: false,

        // Achievements
        hasCustomizedProfile: false,
        hasPublishedFirstVideo: false,
        hasSharedFirstVideo: false,
        hasEnabledRemixOnFirstVideo: false,

        // Daily rewards
        dailyRewardStreak: 0,
        lastDailyRewardAt: null,

        // Subscription
        subscriptionTier: 'basic',
        subscriptionStatus: 'none',
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        subscriptionProductId: null,

        // Timestamps
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        emailVerified: false,

        // Web-specific
        platform: 'web',
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

      // If referral code provided, process referral reward
      if (referralCode) {
        await processReferralReward(firebaseUser.uid, referralCode);
      }

      // onAuthStateChanged will handle setting the user state
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        // Create new user document
        const newUser: Omit<User, 'uid'> = {
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoUrl: firebaseUser.photoURL,
          credits: 60,
          isPremium: false,
          followersCount: 0,
          followingCount: 0,
          totalLikesReceived: 0,

          referralCode: generateReferralCode(),
          referredByCode: null,
          totalReferrals: 0,
          referralTier1Claimed: false,
          referralTier2Claimed: false,
          referralTier3Claimed: false,

          hasCustomizedProfile: false,
          hasPublishedFirstVideo: false,
          hasSharedFirstVideo: false,
          hasEnabledRemixOnFirstVideo: false,

          dailyRewardStreak: 0,
          lastDailyRewardAt: null,

          subscriptionTier: 'basic',
          subscriptionStatus: 'none',
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          subscriptionProductId: null,

          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          emailVerified: true, // Google accounts are verified

          platform: 'web',
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      }

      // onAuthStateChanged will handle the rest
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ firebaseUser: null, user: null, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  resendVerificationEmail: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) throw new Error('No user signed in');

    set({ loading: true, error: null });
    try {
      await sendEmailVerification(firebaseUser);
      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  refreshUser: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        set({ user: { ...userData, uid: firebaseUser.uid } });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper function to process referral rewards
async function processReferralReward(newUserId: string, referralCode: string) {
  try {
    // This should ideally be done via a Cloud Function for security
    // For now, we'll just add the credits to the new user
    // The referrer's reward should be handled by a Cloud Function
    console.log(`Processing referral for user ${newUserId} with code ${referralCode}`);
  } catch (error) {
    console.error('Error processing referral:', error);
  }
}
