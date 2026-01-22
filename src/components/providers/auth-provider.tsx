'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, user } = useAuthStore();
  const subscribeToCredits = useUserStore((state) => state.subscribeToCredits);
  const subscribeToNotifications = useUserStore((state) => state.subscribeToNotifications);
  const subscribeToVideoJobs = useUserStore((state) => state.subscribeToVideoJobs);
  const unsubscribeAll = useUserStore((state) => state.unsubscribeAll);

  // Track if we've already subscribed for this user
  const subscribedUserRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize Firebase Auth listener
    const unsubscribe = initialize();

    return () => {
      unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    // When user logs in, subscribe to their data (only once per user)
    if (user?.uid && subscribedUserRef.current !== user.uid) {
      subscribedUserRef.current = user.uid;
      subscribeToCredits(user.uid);
      subscribeToNotifications(user.uid);
      subscribeToVideoJobs(user.uid);
    } else if (!user?.uid && subscribedUserRef.current) {
      // When user logs out, unsubscribe from all
      subscribedUserRef.current = null;
      unsubscribeAll();
    }
  }, [user?.uid, subscribeToCredits, subscribeToNotifications, subscribeToVideoJobs, unsubscribeAll]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return <>{children}</>;
}
