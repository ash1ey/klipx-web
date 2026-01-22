'use client';

import { useState } from 'react';
import { Bell, Video, Heart, MessageCircle, Gift, Info, Trash2, Check, CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user-store';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'video_complete' | 'like' | 'comment' | 'credits' | 'follower' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'video_complete',
    title: 'Video Ready!',
    message: 'Your video "Sunset over ocean" is ready to view',
    read: false,
    createdAt: new Date(Date.now() - 300000),
    actionUrl: '/my-videos',
  },
  {
    id: '2',
    type: 'like',
    title: 'New Like',
    message: '@oceanvibes liked your video',
    read: false,
    createdAt: new Date(Date.now() - 1800000),
  },
  {
    id: '3',
    type: 'comment',
    title: 'New Comment',
    message: '@neonartist commented: "This is amazing!"',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '4',
    type: 'credits',
    title: 'Credits Added',
    message: 'You received 15 credits from daily reward',
    read: true,
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '5',
    type: 'follower',
    title: 'New Follower',
    message: '@catlover started following you',
    read: true,
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: '6',
    type: 'system',
    title: 'Welcome to Klipx!',
    message: 'Your account has been created. Start creating amazing videos!',
    read: true,
    createdAt: new Date(Date.now() - 259200000),
  },
];

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'video_complete':
      return <Video className="h-5 w-5 text-green-500" />;
    case 'like':
      return <Heart className="h-5 w-5 text-red-500" />;
    case 'comment':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'credits':
      return <Gift className="h-5 w-5 text-yellow-500" />;
    case 'follower':
      return <Bell className="h-5 w-5 text-purple-500" />;
    case 'system':
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                notification.read ? 'bg-card' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{notification.title}</span>
                      {!notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
