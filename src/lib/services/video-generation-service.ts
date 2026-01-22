import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { AIModel } from '@/types';

// ============================================
// CONSTANTS
// ============================================

// Web app version - must match or exceed MINIMUM_APP_VERSION in Firebase Functions
export const WEB_APP_VERSION = '1.6.5';

// ============================================
// TYPES
// ============================================

export interface GenerateVideoParams {
  type: 'text-to-video' | 'image-to-video';
  prompt: string;
  model: AIModel;
  duration: number;
  aspectRatio: string;
  resolution?: '480p' | '720p' | '1080p'; // For Seedance
  mode?: 'normal' | 'fun'; // For Grok
  imageUrl?: string; // For image-to-video
}

// Internal type that includes appVersion for Firebase function calls
interface GenerateVideoParamsWithVersion extends GenerateVideoParams {
  appVersion: string;
}

export interface GenerateVideoResponse {
  success: boolean;
  videoId: string;
  status: string;
  creditsDeducted: number;
  estimatedTime: number;
}

export interface VideoStatusResponse {
  videoId: string;
  status: 'pending' | 'processing' | 'post-processing' | 'complete' | 'failed';
  progress: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CancelVideoResponse {
  success: boolean;
  message: string;
  creditsRefunded: number;
}

// ============================================
// FIREBASE FUNCTION CALLS
// ============================================

/**
 * Generate a video using Firebase Cloud Functions
 */
export async function generateVideo(params: GenerateVideoParams): Promise<GenerateVideoResponse> {
  const generateVideoFn = httpsCallable<GenerateVideoParamsWithVersion, GenerateVideoResponse>(
    functions,
    'generateVideo'
  );
  // Add app version to satisfy Firebase function's minimum version check
  const paramsWithVersion: GenerateVideoParamsWithVersion = {
    ...params,
    appVersion: WEB_APP_VERSION,
  };
  const result = await generateVideoFn(paramsWithVersion);
  return result.data;
}

/**
 * Check the status of a video generation job
 */
export async function checkVideoStatus(videoId: string): Promise<VideoStatusResponse> {
  const checkStatusFn = httpsCallable<{ videoId: string }, VideoStatusResponse>(
    functions,
    'checkVideoStatus'
  );
  const result = await checkStatusFn({ videoId });
  return result.data;
}

/**
 * Cancel a pending or processing video generation job
 */
export async function cancelVideoGeneration(videoId: string): Promise<CancelVideoResponse> {
  const cancelFn = httpsCallable<{ videoId: string }, CancelVideoResponse>(
    functions,
    'cancelVideoGeneration'
  );
  const result = await cancelFn({ videoId });
  return result.data;
}

// ============================================
// CREDIT COST CALCULATIONS
// ============================================

/**
 * Calculate the credit cost for a video generation request
 * Matches the Firebase Cloud Function pricing (functions/src/index.ts lines 248-350)
 */
export function calculateVideoCreditCost(
  model: AIModel,
  duration: number,
  resolution?: string
): number {
  switch (model) {
    case 'sora2':
      return duration === 10 ? 30 : 45;

    case 'veo3':
      return 60;

    case 'grok':
      return 20;

    case 'wan26':
      if (duration === 5) return 70;
      if (duration === 10) return 140;
      return 210; // 15s

    case 'seedance':
      const res = resolution || '480p';
      const dur = duration || 5;
      const seedanceCosts: Record<string, Record<number, number>> = {
        '480p': { 5: 10, 10: 20 },
        '720p': { 5: 23, 10: 45 },
        '1080p': { 5: 50, 10: 100 },
      };
      return seedanceCosts[res]?.[dur] || 10;

    case 'kling26':
      return 6 * duration; // 6 credits per second

    default:
      return 30; // Default fallback
  }
}

/**
 * Calculate the total cost for Multi-Shot mode (all 5 models)
 */
export function calculateMultiShotCost(): number {
  // Sora 2 (10s) + Veo 3.1 + Grok (normal) + Wan 2.6 (5s) + Seedance (480p/5s)
  return 30 + 60 + 20 + 70 + 10; // = 190 credits
}

// ============================================
// MODEL CONFIGURATIONS
// ============================================

export interface ModelConfig {
  id: AIModel;
  name: string;
  description: string;
  badge?: 'Popular' | 'New' | null;
  durations: number[];
  aspectRatios: string[] | null;
  resolutions?: string[];
  modes?: string[];
  getCost: (duration: number, resolution?: string) => number;
}

export const VIDEO_MODELS: ModelConfig[] = [
  {
    id: 'sora2',
    name: 'Sora 2',
    description: "OpenAI's flagship model with physics simulation",
    badge: 'Popular',
    durations: [10, 15],
    aspectRatios: ['9:16', '16:9'],
    getCost: (duration) => (duration === 10 ? 30 : 45),
  },
  {
    id: 'veo3',
    name: 'Veo 3.1',
    description: "Google's advanced video generation with native audio",
    badge: 'New',
    durations: [8], // Fixed duration
    aspectRatios: ['9:16', '16:9'],
    getCost: () => 60,
  },
  {
    id: 'grok',
    name: 'Grok Imagine',
    description: "xAI's video model with natural language control",
    badge: null,
    durations: [6], // Fixed duration
    aspectRatios: ['2:3', '3:2', '1:1'],
    modes: ['normal', 'fun'],
    getCost: () => 20,
  },
  {
    id: 'wan26',
    name: 'Wan 2.6',
    description: 'Multi-shot video story creation',
    badge: null,
    durations: [5, 10, 15],
    aspectRatios: null, // Uses default
    getCost: (duration) => {
      if (duration === 5) return 70;
      if (duration === 10) return 140;
      return 210;
    },
  },
  {
    id: 'seedance',
    name: 'Seedance V1 Lite',
    description: 'Fast model with smooth motion consistency',
    badge: null,
    durations: [5, 10],
    aspectRatios: ['9:16', '16:9', '4:3', '3:4', '1:1', '21:9'],
    resolutions: ['480p', '720p', '1080p'],
    getCost: (duration, resolution = '480p') => {
      const costs: Record<string, Record<number, number>> = {
        '480p': { 5: 10, 10: 20 },
        '720p': { 5: 23, 10: 45 },
        '1080p': { 5: 50, 10: 100 },
      };
      return costs[resolution]?.[duration] || 10;
    },
  },
];

export const MULTISHOT_CONFIG = {
  id: 'multishot' as const,
  name: 'Multi-Shot',
  description: 'Generate with all 5 models at once',
  totalCost: 190,
  breakdown: [
    { model: 'Sora 2 (10s)', cost: 30 },
    { model: 'Veo 3.1', cost: 60 },
    { model: 'Grok (normal)', cost: 20 },
    { model: 'Wan 2.6 (5s)', cost: 70 },
    { model: 'Seedance (480p/5s)', cost: 10 },
  ],
};

/**
 * Get the default aspect ratio for a model
 */
export function getDefaultAspectRatio(model: ModelConfig): string {
  if (!model.aspectRatios || model.aspectRatios.length === 0) {
    return '9:16'; // Default vertical format
  }
  return model.aspectRatios[0];
}

/**
 * Get the default duration for a model
 */
export function getDefaultDuration(model: ModelConfig): number {
  return model.durations[0];
}

/**
 * Get the default resolution for Seedance
 */
export function getDefaultResolution(): string {
  return '480p';
}

/**
 * Get the default mode for Grok
 */
export function getDefaultMode(): string {
  return 'normal';
}
