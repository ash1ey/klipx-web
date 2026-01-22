'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, user } = useAuthStore();
  const { subscribeToCredits, subscribeToNotifications, subscribeToVideoJobs, unsubscribeAll } = useUserStore();

  useEffect(() => {
    // Initialize Firebase Auth listener
    const unsubscribe = initialize();

    return () => {
      unsubscribe();
    };
  }, [initialize]);

  useEffect(() => {
    // When user logs in, subscribe to their data
    if (user?.uid) {
      subscribeToCredits(user.uid);
      subscribeToNotifications(user.uid);
      subscribeToVideoJobs(user.uid);
    } else {
      // When user logs out, unsubscribe from all
      unsubscribeAll();
    }

    return () => {
      unsubscribeAll();
    };
  }, [user?.uid, subscribeToCredits, subscribeToNotifications, subscribeToVideoJobs, unsubscribeAll]);

  return <>{children}</>;
}
