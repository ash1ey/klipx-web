import { Timestamp } from 'firebase/firestore';

// User Model
export interface User {
  uid: string;
  email: string;
  username: string;
  photoUrl: string | null;
  credits: number;
  isPremium: boolean;
  followersCount: number;
  followingCount: number;
  totalLikesReceived: number;

  // Referral system
  referralCode: string;
  referredByCode: string | null;
  totalReferrals: number;
  referralTier1Claimed: boolean;
  referralTier2Claimed: boolean;
  referralTier3Claimed: boolean;

  // Achievements
  hasCustomizedProfile: boolean;
  hasPublishedFirstVideo: boolean;
  hasSharedFirstVideo: boolean;
  hasEnabledRemixOnFirstVideo: boolean;

  // Daily rewards
  dailyRewardStreak: number;
  lastDailyRewardAt: Timestamp | null;

  // Subscription
  subscriptionTier: 'basic' | 'lite' | 'pro' | 'elite';
  subscriptionStatus: 'none' | 'active' | 'expired' | 'cancelled';
  subscriptionStartDate: Timestamp | null;
  subscriptionEndDate: Timestamp | null;
  subscriptionProductId: string | null;

  // Stripe (web-specific)
  stripeCustomerId?: string;

  // Timestamps
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  emailVerified: boolean;

  // Web-specific
  platform?: 'web' | 'android' | 'ios';
  browserFingerprint?: string;
}

// Video Job Model
export interface VideoJob {
  id: string;
  userId: string;
  type: VideoJobType;
  prompt: string;
  model: AIModel;
  duration: number;
  quality: '720p' | '1080p' | '4k';
  aspectRatio: string;

  // Input files
  imageUrl?: string;
  videoUrl?: string;
  imageUrls?: string[];

  // Template
  templateId?: string;
  templateName?: string;

  // Storyboard
  scenes?: StoryboardScene[];

  // Output
  outputVideoUrl?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;

  // Status
  status: JobStatus;
  progress: number;
  error?: string;

  // Credits
  creditsDeducted: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;

  // Social (when published)
  isPublic?: boolean;
  allowRemix?: boolean;
  remixPrice?: number | null;
  likes?: number;
  views?: number;
  shares?: number;
  commentsCount?: number;
}

// Image Job Model
export interface ImageJob {
  id: string;
  userId: string;
  type: 'text-to-image' | 'image-to-image' | 'fun-template';
  prompt: string;
  model: 'nano-banana-pro' | 'midjourney' | 'fun-template';
  aspectRatio: string;
  format?: 'png' | 'jpg';

  referenceImageUrl?: string;

  // Output
  imageUrl?: string;
  thumbnailUrl?: string;

  // Status
  status: JobStatus;
  error?: string;

  // Credits
  creditsDeducted: number;

  // Privacy
  isPublic: boolean;
  allowRemix: boolean;
  remixPrice?: number | null;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Published Video Model (in videos collection)
export interface Video {
  id: string;
  userId: string;
  username: string;
  userPhotoUrl: string | null;

  title?: string;
  description: string;
  videoUrl: string;
  hlsUrl?: string;
  thumbnailUrl: string;

  modelUsed: AIModel;
  duration?: number;

  // Social
  likes: number;
  views: number;
  shares: number;
  commentsCount: number;

  // Privacy
  isPublic: boolean;
  allowRemix: boolean;
  remixPrice?: number | null;

  // Template
  templateId?: string;
  templateName?: string;

  createdAt: Timestamp;
}

// Comment Model
export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  username: string;
  userPhotoUrl: string | null;
  text: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Purchased Prompt Model (for Prompt Database)
export interface PurchasedPrompt {
  id: string;
  promptId: string;                   // videoId or imageId
  promptType: 'video' | 'image';      // Content type
  buyerId: string;                    // User who purchased/saved
  sellerId: string | null;            // Original creator (null for free)
  mediaUrl: string;                   // Video or image URL
  thumbnailUrl?: string;              // Thumbnail URL
  prompt: string;                     // The actual prompt text
  creditsPaid: number;                // 0 for free, 1-10 for paid
  model: AIModel;                     // AI model used
  sellerUsername?: string;            // Original creator's username
  purchasedAt: Timestamp;             // When purchased/saved
}

// Notification Model
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  thumbnailUrl?: string;
  actionData?: {
    videoId?: string;
    userId?: string;
    [key: string]: string | undefined;
  };
  isRead: boolean;
  createdAt: Timestamp;
}

// Fun Template Model
export interface FunTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  gifUrl: string;
  imageCount: 1 | 2;
  outputType: 'video' | 'image';
  prompt: string;
  imagePrompt?: string;
  aiModel: 'grok' | 'seedance';
  creditCost: number;
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Credit Pack Model
export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  priceId: string; // Stripe price ID
  popular?: boolean;
  bestValue?: boolean;
}

// Subscription Tier Model
export interface SubscriptionTier {
  id: string;
  name: 'Lite' | 'Pro' | 'Elite';
  tier: 'lite' | 'pro' | 'elite';
  weeklyCredits: number;
  monthlyCredits?: number;
  bonusPercentage: number;
  prices: {
    weekly?: { price: number; priceId: string };
    monthly?: { price: number; priceId: string };
    yearly?: { price: number; priceId: string };
  };
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
}

// Generation Limits (for abuse prevention)
export interface GenerationLimits {
  userId: string;
  dailyCount: number;
  lastResetDate: Timestamp;
  concurrentJobs: number;
}

// Enums and Types
export type VideoJobType =
  | 'text-to-video'
  | 'image-to-video'
  | 'video-to-video'
  | 'image-remix'
  | 'veo-extend'
  | 'storyboard'
  | 'fun-template'
  | 'add-subtitles'
  | 'motion-control'
  | 'text-to-music';

export type AIModel =
  | 'sora2'
  | 'veo3'
  | 'grok'
  | 'wan26'
  | 'seedance'
  | 'kling26'
  | 'faceless'
  | 'remix'
  | 'nano-banana-pro'
  | 'midjourney'
  | 'fun-template'
  | 'subtitles'
  | 'suno';

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'post-processing'
  | 'complete'
  | 'failed';

export type NotificationType =
  | 'videoComplete'
  | 'newFollower'
  | 'newLike'
  | 'newComment'
  | 'creditsReceived'
  | 'promptPurchased'
  | 'subscriptionPurchased'
  | 'subscriptionRenewed'
  | 'subscriptionExpired'
  | 'creditPackPurchased'
  | 'bonusCreditsAwarded'
  | 'system';

export interface StoryboardScene {
  scene: string;
  duration: number;
}

// Credit costs by model
export const CREDIT_COSTS = {
  'sora2': { '10s': 30, '15s': 45 },
  'veo3': 60,
  'grok': 20,
  'wan26': { '5s': 70, '10s': 140, '15s': 210 },
  'seedance': { '480p': { '5s': 10, '10s': 20 }, '720p': { '5s': 30, '10s': 60 }, '1080p': { '5s': 50, '10s': 100 } },
  'kling26': 6, // per second
  'remix': 60,
  'veo-extend': 60,
  'storyboard': { '10s': 150, '15s': 270 },
  'fun-template': 25,
  'faceless': 15,
  'subtitles': 0, // FREE
  'text-to-image': 10,
  'image-remix': 60,
  'text-to-music': 12,
  'lyric-generator': 2,
} as const;

// Free tier limits
export const FREE_TIER_LIMITS = {
  dailyGenerations: 3,
  maxVideoDuration: 5, // seconds
  concurrentJobs: 1,
  watermark: true,
  queuePriority: 'low',
} as const;

// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
  lite: {
    dailyGenerations: 10,
    maxVideoDuration: 10,
    concurrentJobs: 2,
    watermark: false,
    queuePriority: 'normal',
    weeklyCredits: 250,
    bonusPercentage: 10,
  },
  pro: {
    dailyGenerations: 25,
    maxVideoDuration: 15,
    concurrentJobs: 3,
    watermark: false,
    queuePriority: 'high',
    weeklyCredits: 500,
    bonusPercentage: 20,
  },
  elite: {
    dailyGenerations: Infinity,
    maxVideoDuration: 15,
    concurrentJobs: 5,
    watermark: false,
    queuePriority: 'highest',
    weeklyCredits: 1500,
    monthlyCredits: 6000,
    bonusPercentage: 35,
  },
} as const;
