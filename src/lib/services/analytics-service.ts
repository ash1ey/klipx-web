import { logEvent, initializeAnalytics } from '@/lib/firebase/config';

// Initialize analytics on app load
export async function setupAnalytics() {
  await initializeAnalytics();
}

// ============================================
// USER EVENTS
// ============================================

export function trackSignUp(method: 'email' | 'google') {
  logEvent('sign_up', { method });
}

export function trackLogin(method: 'email' | 'google') {
  logEvent('login', { method });
}

export function trackLogout() {
  logEvent('logout');
}

// ============================================
// VIDEO GENERATION EVENTS
// ============================================

export function trackVideoGenerationStart(params: {
  model: string;
  duration?: number;
  type: string;
}) {
  logEvent('video_generation_start', params);
}

export function trackVideoGenerationComplete(params: {
  model: string;
  duration?: number;
  type: string;
  creditsUsed: number;
}) {
  logEvent('video_generation_complete', params);
}

export function trackVideoGenerationFailed(params: {
  model: string;
  type: string;
  error?: string;
}) {
  logEvent('video_generation_failed', params);
}

// ============================================
// IMAGE GENERATION EVENTS
// ============================================

export function trackImageGenerationStart(params: {
  model: string;
  type: string;
}) {
  logEvent('image_generation_start', params);
}

export function trackImageGenerationComplete(params: {
  model: string;
  type: string;
  creditsUsed: number;
}) {
  logEvent('image_generation_complete', params);
}

// ============================================
// CREDITS & PURCHASES
// ============================================

export function trackCreditsPurchased(params: {
  credits: number;
  price: number;
  packId: string;
}) {
  logEvent('purchase', {
    currency: 'USD',
    value: params.price,
    items: [{ item_id: params.packId, quantity: params.credits }],
  });
  logEvent('credits_purchased', params);
}

export function trackSubscriptionPurchased(params: {
  tier: string;
  billingPeriod: string;
  price: number;
}) {
  logEvent('subscription_purchased', params);
}

export function trackCreditsSpent(params: {
  amount: number;
  action: string;
  model?: string;
}) {
  logEvent('credits_spent', params);
}

// ============================================
// SOCIAL EVENTS
// ============================================

export function trackVideoView(videoId: string) {
  logEvent('video_view', { video_id: videoId });
}

export function trackVideoLike(videoId: string) {
  logEvent('video_like', { video_id: videoId });
}

export function trackVideoShare(videoId: string, method?: string) {
  logEvent('share', { content_type: 'video', item_id: videoId, method });
}

export function trackVideoDownload(videoId: string) {
  logEvent('video_download', { video_id: videoId });
}

export function trackFollow(userId: string) {
  logEvent('follow', { user_id: userId });
}

export function trackComment(videoId: string) {
  logEvent('comment', { video_id: videoId });
}

// ============================================
// PROMPT DATABASE EVENTS
// ============================================

export function trackPromptView(params: {
  promptId: string;
  type: 'video' | 'image';
  isFree: boolean;
}) {
  logEvent('prompt_view', params);
}

export function trackPromptSaved(params: {
  promptId: string;
  type: 'video' | 'image';
  isFree: boolean;
  creditsPaid: number;
}) {
  logEvent('prompt_saved', params);
}

export function trackPromptPurchased(params: {
  promptId: string;
  type: 'video' | 'image';
  creditsPaid: number;
}) {
  logEvent('prompt_purchased', params);
}

// ============================================
// NAVIGATION & ENGAGEMENT
// ============================================

export function trackPageView(pageName: string) {
  logEvent('page_view', { page_name: pageName });
}

export function trackSearch(query: string, resultCount: number) {
  logEvent('search', { search_term: query, result_count: resultCount });
}

export function trackDailyRewardClaimed(params: {
  credits: number;
  streak: number;
}) {
  logEvent('daily_reward_claimed', params);
}

export function trackReferralCodeUsed(code: string) {
  logEvent('referral_code_used', { code });
}

// ============================================
// ERRORS
// ============================================

export function trackError(params: {
  error_type: string;
  error_message: string;
  page?: string;
}) {
  logEvent('app_error', params);
}
