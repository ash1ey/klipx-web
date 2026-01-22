'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Navigation function using window.location for static export compatibility
  const handleNavClick = (href: string, label: string) => {
    console.log(`[NAV DEBUG] Clicked: ${label}, href: ${href}`);
    console.log(`[NAV DEBUG] Current URL: ${window.location.href}`);
    // Use window.location for reliable navigation in static export
    window.location.href = href;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon.png"
              alt="Klipx"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="font-bold text-xl">Klipx</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features/" prefetch={true} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/pricing/" prefetch={true} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Use Button with onClick instead of wrapping Link around Button */}
            <Button
              variant="ghost"
              onClick={() => handleNavClick('/login/', 'Sign In')}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={() => handleNavClick('/signup/', 'Get Started Free')}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/icon.png"
                  alt="Klipx"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="font-bold text-lg">Klipx</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Create stunning AI videos, images, and music in seconds.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features/" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing/" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/create/templates/" className="hover:text-foreground">Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about/" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog/" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact/" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms/" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/privacy/" className="hover:text-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Klipx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
