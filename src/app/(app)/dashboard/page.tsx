'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  Image,
  Music,
  Wand2,
  Sparkles,
  Film,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Gift,
  Users,
  ArrowRight,
} from 'lucide-react';

const quickActions = [
  {
    name: 'Text to Video',
    description: 'Create videos from text prompts',
    href: '/create/text-to-video',
    icon: Video,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Image to Video',
    description: 'Animate your images',
    href: '/create/image-to-video',
    icon: Film,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Text to Image',
    description: 'Generate stunning images',
    href: '/create/text-to-image',
    icon: Image,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Text to Music',
    description: 'Create AI-powered music',
    href: '/create/text-to-music',
    icon: Music,
    gradient: 'from-orange-500 to-yellow-500',
    badge: 'New',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { credits, videoJobs } = useUserStore();

  // Calculate job statistics
  const processingJobs = videoJobs.filter((j) => j.status === 'processing' || j.status === 'pending');
  const completedJobs = videoJobs.filter((j) => j.status === 'complete');
  const failedJobs = videoJobs.filter((j) => j.status === 'failed');

  // Get recent jobs (last 5)
  const recentJobs = videoJobs.slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'processing':
      case 'pending':
      case 'post-processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.username || 'Creator'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to create something amazing today?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="flex items-center gap-3 p-4">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Credits</p>
                <p className="text-xl font-bold">{credits.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Link href="/billing">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Get More Credits
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Create</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="group hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{action.name}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Processing</span>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                {processingJobs.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                {completedJobs.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Failed</span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                {failedJobs.length}
              </Badge>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Daily Limit</span>
                <span className="text-sm">
                  {user?.subscriptionStatus === 'active' ? 'Unlimited' : '3/day'}
                </span>
              </div>
              {user?.subscriptionStatus !== 'active' && (
                <Progress value={33} className="h-2" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/my-videos">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentJobs.length > 0 ? (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-accent/50"
                  >
                    <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                      {job.thumbnailUrl ? (
                        <img
                          src={job.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.prompt.slice(0, 50)}...
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {job.type.replace(/-/g, ' ')} • {job.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wand2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No creations yet</p>
                <Link href="/create/text-to-video">
                  <Button>Create Your First Video</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rewards */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Daily Rewards
            </CardTitle>
            <CardDescription>
              Claim your daily credits and build your streak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">+15 Credits</p>
                <p className="text-sm text-muted-foreground">
                  Day {user?.dailyRewardStreak || 0} of 7
                </p>
              </div>
              <Link href="/rewards">
                <Button>Claim Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Referrals */}
        <Card className="bg-gradient-to-br from-accent/10 to-chart-3/10 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Invite Friends
            </CardTitle>
            <CardDescription>
              Share your referral code and earn bonus credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-mono font-bold bg-accent/20 px-3 py-1 rounded">
                  {user?.referralCode || '--------'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.totalReferrals || 0} referrals
                </p>
              </div>
              <Link href="/rewards">
                <Button variant="outline">Share Code</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
