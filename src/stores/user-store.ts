import { create } from 'zustand';
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Unsubscribe,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { User, VideoJob, Notification, GenerationLimits } from '@/types';

interface UserState {
  // State
  credits: number;
  notifications: Notification[];
  unreadCount: number;
  videoJobs: VideoJob[];
  generationLimits: GenerationLimits | null;

  // Subscriptions
  unsubscribeCredits: Unsubscribe | null;
  unsubscribeNotifications: Unsubscribe | null;
  unsubscribeVideoJobs: Unsubscribe | null;

  // Actions
  subscribeToCredits: (userId: string) => void;
  subscribeToNotifications: (userId: string) => void;
  subscribeToVideoJobs: (userId: string) => void;
  unsubscribeAll: () => void;

  // Profile actions
  updateProfile: (userId: string, data: Partial<User>) => Promise<void>;
  uploadProfilePhoto: (userId: string, file: File) => Promise<string>;

  // Credit actions
  refreshCredits: (userId: string) => Promise<number>;

  // Notification actions
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;

  // Generation limits
  checkGenerationLimit: (userId: string) => Promise<boolean>;
  incrementGenerationCount: (userId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  credits: 0,
  notifications: [],
  unreadCount: 0,
  videoJobs: [],
  generationLimits: null,

  unsubscribeCredits: null,
  unsubscribeNotifications: null,
  unsubscribeVideoJobs: null,

  subscribeToCredits: (userId: string) => {
    const { unsubscribeCredits } = get();
    if (unsubscribeCredits) unsubscribeCredits();

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          set({ credits: data.credits || 0 });
        }
      },
      (error) => {
        console.error('Error subscribing to credits:', error);
      }
    );

    set({ unsubscribeCredits: unsubscribe });
  },

  subscribeToNotifications: (userId: string) => {
    const { unsubscribeNotifications } = get();
    if (unsubscribeNotifications) unsubscribeNotifications();

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = [];
        let unreadCount = 0;

        snapshot.forEach((doc) => {
          const notification = { id: doc.id, ...doc.data() } as Notification;
          notifications.push(notification);
          if (!notification.isRead) unreadCount++;
        });

        set({ notifications, unreadCount });
      },
      (error) => {
        console.error('Error subscribing to notifications:', error);
      }
    );

    set({ unsubscribeNotifications: unsubscribe });
  },

  subscribeToVideoJobs: (userId: string) => {
    const { unsubscribeVideoJobs } = get();
    if (unsubscribeVideoJobs) unsubscribeVideoJobs();

    const q = query(
      collection(db, 'videoJobs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const videoJobs: VideoJob[] = [];
        snapshot.forEach((doc) => {
          videoJobs.push({ id: doc.id, ...doc.data() } as VideoJob);
        });
        set({ videoJobs });
      },
      (error) => {
        console.error('Error subscribing to video jobs:', error);
      }
    );

    set({ unsubscribeVideoJobs: unsubscribe });
  },

  unsubscribeAll: () => {
    const { unsubscribeCredits, unsubscribeNotifications, unsubscribeVideoJobs } = get();
    if (unsubscribeCredits) unsubscribeCredits();
    if (unsubscribeNotifications) unsubscribeNotifications();
    if (unsubscribeVideoJobs) unsubscribeVideoJobs();
    set({
      unsubscribeCredits: null,
      unsubscribeNotifications: null,
      unsubscribeVideoJobs: null,
    });
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  uploadProfilePhoto: async (userId: string, file: File) => {
    try {
      const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update user document with new photo URL
      await updateDoc(doc(db, 'users', userId), {
        photoUrl: downloadUrl,
      });

      return downloadUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  },

  refreshCredits: async (userId: string) => {
    try {
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('__name__', '==', userId))
      );
      if (!userDoc.empty) {
        const credits = userDoc.docs[0].data().credits || 0;
        set({ credits });
        return credits;
      }
      return 0;
    } catch (error) {
      console.error('Error refreshing credits:', error);
      return 0;
    }
  },

  markNotificationRead: async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification read:', error);
      throw error;
    }
  },

  markAllNotificationsRead: async (userId: string) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isRead: true })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      throw error;
    }
  },

  checkGenerationLimit: async (userId: string) => {
    try {
      const limitsDoc = await getDocs(
        query(collection(db, 'generationLimits'), where('userId', '==', userId))
      );

      if (limitsDoc.empty) {
        // No limits document exists, user can generate
        return true;
      }

      const limits = limitsDoc.docs[0].data() as GenerationLimits;
      const today = new Date().toDateString();
      const lastReset = limits.lastResetDate.toDate().toDateString();

      // If it's a new day, reset the count
      if (today !== lastReset) {
        return true;
      }

      // Check if user has reached daily limit (3 for free users)
      // This should also check subscription status
      return limits.dailyCount < 3;
    } catch (error) {
      console.error('Error checking generation limit:', error);
      return false;
    }
  },

  incrementGenerationCount: async (userId: string) => {
    try {
      const limitsRef = doc(db, 'generationLimits', userId);
      await updateDoc(limitsRef, {
        dailyCount: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing generation count:', error);
    }
  },
}));
