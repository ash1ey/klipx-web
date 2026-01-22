'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Video,
  Image,
  Music,
  Wand2,
  Layers,
  Sparkles,
  Film,
  Scissors,
  Subtitles,
  LayoutTemplate,
  Compass,
  FolderOpen,
  Heart,
  User,
  Bell,
  Settings,
  CreditCard,
  Gift,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Coins,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const createTools = [
  { name: 'Text to Video', href: '/create/text-to-video/', icon: Video, badge: 'Popular' },
  { name: 'Image to Video', href: '/create/image-to-video/', icon: Film },
  { name: 'Video to Video', href: '/create/video-to-video/', icon: Layers },
  { name: 'Veo Extend', href: '/create/veo-extend/', icon: Sparkles },
  { name: 'Storyboard', href: '/create/storyboard/', icon: LayoutTemplate },
  { name: 'Text to Image', href: '/create/text-to-image/', icon: Image },
  { name: 'Image Remix', href: '/create/image-remix/', icon: Wand2 },
  { name: 'Text to Music', href: '/create/text-to-music/', icon: Music, badge: 'New' },
  { name: 'Add Subtitles', href: '/create/subtitles/', icon: Subtitles, badge: 'Free' },
  { name: 'Fun Templates', href: '/create/templates/', icon: Scissors },
];

const mainNav = [
  { name: 'Dashboard', href: '/dashboard/', icon: Home },
  { name: 'Discover', href: '/discover/', icon: Compass },
  { name: 'Prompt Database', href: '/prompt-database/', icon: Database },
  { name: 'My Files', href: '/my-videos/', icon: FolderOpen },
  { name: 'Liked', href: '/liked/', icon: Heart },
];

const userNav = [
  { name: 'Profile', href: '/profile/', icon: User },
  { name: 'Notifications', href: '/notifications/', icon: Bell },
  { name: 'Rewards', href: '/rewards/', icon: Gift },
  { name: 'Billing', href: '/billing/', icon: CreditCard },
  { name: 'Settings', href: '/settings/', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { credits, unreadCount } = useUserStore();

  // Navigation function using window.location for static export compatibility
  const handleNavClick = (href: string, label: string) => {
    console.log(`[SIDEBAR DEBUG] Clicked: ${label}, href: ${href}`);
    console.log(`[SIDEBAR DEBUG] Current pathname: ${pathname}`);
    // Use window.location for reliable navigation in static export
    window.location.href = href;
  };

  const NavLink = ({ item, showBadge = false }: { item: typeof createTools[0]; showBadge?: boolean }) => {
    // Compare without trailing slash for consistency
    const hrefWithoutTrailing = item.href.replace(/\/$/, '');
    const isActive = pathname === item.href || pathname === hrefWithoutTrailing || pathname.startsWith(hrefWithoutTrailing + '/');
    const Icon = item.icon;

    // When collapsed, use a button with tooltip
    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavClick(item.href, item.name)}
              className={cn(
                'w-full flex items-center justify-center rounded-lg px-2 py-2 text-sm transition-all hover:bg-accent cursor-pointer',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.name}
            {showBadge && 'badge' in item && item.badge && (
              <Badge variant="secondary" className="text-[10px]">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    // When expanded, also use button with onClick for consistent behavior
    return (
      <button
        onClick={() => handleNavClick(item.href, item.name)}
        className={cn(
          'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent text-left cursor-pointer',
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
        )}
      >
        <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-primary')} />
        <span className="flex-1 truncate">{item.name}</span>
        {showBadge && 'badge' in item && item.badge && (
          <Badge
            variant={item.badge === 'Free' ? 'secondary' : 'default'}
            className={cn(
              'text-[10px] px-1.5 py-0',
              item.badge === 'New' && 'bg-primary text-primary-foreground',
              item.badge === 'Free' && 'bg-chart-3 text-white',
              item.badge === 'Popular' && 'bg-accent text-accent-foreground'
            )}
          >
            {item.badge}
          </Badge>
        )}
        {item.name === 'Notifications' && unreadCount > 0 && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex flex-col border-r border-border bg-sidebar h-screen transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <Link href="/dashboard/" prefetch={true} className="flex items-center gap-2">
              <NextImage
                src="/icon.png"
                alt="Klipx"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg">Klipx</span>
            </Link>
          )}
          {collapsed && (
            <button
              onClick={() => router.push('/dashboard/')}
              className="mx-auto"
            >
              <NextImage
                src="/icon.png"
                alt="Klipx"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('h-8 w-8', collapsed && 'mx-auto mt-2')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Credits Display */}
        <div className={cn('p-4 border-b border-border', collapsed && 'px-2')}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {credits.toLocaleString()} Credits
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{credits.toLocaleString()} Credits</span>
              </div>
              <Link href="/billing/" prefetch={true}>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  Buy
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-4 py-4">
            {/* Main Navigation */}
            <div>
              {!collapsed && (
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Main
                </h4>
              )}
              <nav className="space-y-1">
                {mainNav.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </div>

            <Separator />

            {/* Create Tools */}
            <div>
              {!collapsed && (
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Create
                </h4>
              )}
              <nav className="space-y-1">
                {createTools.map((item) => (
                  <NavLink key={item.href} item={item} showBadge />
                ))}
              </nav>
            </div>

            <Separator />

            {/* User Navigation */}
            <div>
              {!collapsed && (
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </h4>
              )}
              <nav className="space-y-1">
                {userNav.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-1">
                <p className="font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
