'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Gift,
  Calendar,
  Users,
  Share2,
  Copy,
  CheckCircle2,
  Clock,
  Flame,
  Trophy,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';

interface ReferralTier {
  tier: number;
  referrals: number;
  reward: number;
  claimed: boolean;
}

const referralTiers: ReferralTier[] = [
  { tier: 1, referrals: 1, reward: 20, claimed: false },
  { tier: 2, referrals: 3, reward: 40, claimed: false },
  { tier: 3, referrals: 5, reward: 50, claimed: false },
];

export default function RewardsPage() {
  const { user } = useAuthStore();
  const { credits } = useUserStore();
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);

  // Mock data - replace with real user data
  const dailyRewardStatus = {
    canClaim: true,
    streak: user?.dailyRewardStreak || 0,
    lastClaimDate: null,
    nextClaimTime: null,
  };

  const referralStatus = {
    code: user?.referralCode || 'KLIPX123',
    totalReferrals: user?.totalReferrals || 0,
    pendingRewards: 0,
  };

  const handleClaimDaily = async () => {
    setIsClaimingDaily(true);
    try {
      // TODO: Implement daily reward claim via Firebase Function
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Daily reward claimed! +15 credits');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to claim reward';
      toast.error(message);
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralStatus.code);
    toast.success('Referral code copied!');
  };

  const shareReferralLink = () => {
    const shareUrl = `https://klipx.ai/signup?ref=${referralStatus.code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Klipx - AI Video Generator',
        text: 'Create amazing AI videos! Use my referral code for bonus credits.',
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Rewards Center</h1>
        </div>
        <p className="text-muted-foreground">
          Earn free credits through daily rewards and referrals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Rewards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Daily Reward
                </CardTitle>
                <CardDescription>
                  Claim free credits every 24 hours
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                +15
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Streak */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-medium">Current Streak</p>
                  <p className="text-sm text-muted-foreground">
                    Keep it going for bonus rewards!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{dailyRewardStatus.streak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>

            {/* 7-Day Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">7-Day Streak Bonus</span>
                <span className="text-sm text-muted-foreground">
                  {dailyRewardStatus.streak}/7
                </span>
              </div>
              <Progress value={(dailyRewardStatus.streak / 7) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Complete a 7-day streak for +30 bonus credits!
              </p>
            </div>

            {/* Claim Button */}
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90"
              size="lg"
              onClick={handleClaimDaily}
              disabled={!dailyRewardStatus.canClaim || isClaimingDaily}
            >
              {isClaimingDaily ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Claiming...
                </>
              ) : dailyRewardStatus.canClaim ? (
                <>
                  <Gift className="mr-2 h-5 w-5" />
                  Claim Daily Reward
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-5 w-5" />
                  Available in 12h 30m
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Referral System */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Referral Program
                </CardTitle>
                <CardDescription>
                  Invite friends and earn up to 110 credits
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {referralStatus.totalReferrals} referrals
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Referral Code */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-background rounded-lg text-lg font-mono font-bold text-center">
                  {referralStatus.code}
                </code>
                <Button variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={shareReferralLink}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Friends get +30 credits when they sign up with your code
              </p>
            </div>

            {/* Reward Tiers */}
            <div className="space-y-3">
              <p className="font-medium">Reward Tiers</p>
              {referralTiers.map((tier) => {
                const isUnlocked = referralStatus.totalReferrals >= tier.referrals;
                const isClaimed = tier.claimed;

                return (
                  <div
                    key={tier.tier}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isUnlocked
                        ? isClaimed
                          ? 'bg-muted/30 border-muted'
                          : 'bg-primary/5 border-primary/30'
                        : 'bg-muted/20 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isUnlocked
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isClaimed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Trophy className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Tier {tier.tier}</p>
                        <p className="text-xs text-muted-foreground">
                          {tier.referrals} referral{tier.referrals > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isClaimed ? (
                        <Badge variant="secondary">Claimed</Badge>
                      ) : isUnlocked ? (
                        <Button size="sm" variant="default">
                          Claim +{tier.reward}
                        </Button>
                      ) : (
                        <Badge variant="outline">+{tier.reward} credits</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Rewards */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Action Rewards
            </CardTitle>
            <CardDescription>
              Complete these actions to earn bonus credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'First Video',
                  description: 'Create and publish your first video',
                  reward: 10,
                  completed: false,
                },
                {
                  title: 'Profile Setup',
                  description: 'Complete your profile with photo and bio',
                  reward: 5,
                  completed: true,
                },
                {
                  title: 'Share a Video',
                  description: 'Share one of your videos',
                  reward: 5,
                  completed: false,
                },
                {
                  title: 'First Follow',
                  description: 'Follow another creator',
                  reward: 5,
                  completed: false,
                },
                {
                  title: 'First Comment',
                  description: 'Comment on a video',
                  reward: 5,
                  completed: false,
                },
                {
                  title: 'Like 10 Videos',
                  description: 'Like 10 videos in Discover',
                  reward: 10,
                  completed: false,
                },
              ].map((action, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    action.completed
                      ? 'bg-muted/30 border-muted'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{action.title}</h4>
                    {action.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Badge variant="secondary">+{action.reward}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
