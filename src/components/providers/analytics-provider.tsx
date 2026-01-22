'use client';

import { useEffect } from 'react';
import { setupAnalytics } from '@/lib/services/analytics-service';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupAnalytics();
  }, []);

  return <>{children}</>;
}
