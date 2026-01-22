'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // If not authenticated after initialization, redirect to login
    if (initialized && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, initialized, router]);

  // Show loading while checking auth state
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Header & Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background border-b border-border">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <span className="font-bold text-lg">Klipx</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden h-16" /> {/* Spacer for mobile header */}
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
