'use client';

import { create } from 'zustand';
import { Video, ImageJob, PurchasedPrompt } from '@/types';
import {
  getRemixableVideos,
  getRemixableImages,
  getPopularRemixableVideos,
  getPopularRemixableImages,
  getUserPurchasedPrompts,
  purchasePrompt,
  saveFreePrompt,
  hasUserPurchasedPrompt,
  removeSavedPrompt,
  PurchasePromptParams,
  SaveFreePromptParams,
} from '@/lib/services/remix-service';

type ContentType = 'videos' | 'images';
type Category = 'recent' | 'popular' | 'free' | 'saved';

interface PromptDatabaseState {
  // UI State
  contentType: ContentType;
  category: Category;
  searchQuery: string;

  // Data
  videos: Video[];
  images: ImageJob[];
  savedPrompts: PurchasedPrompt[];

  // Loading states
  isLoading: boolean;
  isSavedLoading: boolean;
  hasMore: boolean;

  // Actions
  setContentType: (type: ContentType) => void;
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  fetchPrompts: (userId?: string, searchOverride?: string) => Promise<void>;
  fetchSavedPrompts: (userId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  purchasePrompt: (params: PurchasePromptParams) => Promise<void>;
  saveFreePrompt: (params: SaveFreePromptParams) => Promise<void>;
  checkIfPurchased: (userId: string, promptId: string, type: 'video' | 'image') => Promise<boolean>;
  removeSavedPrompt: (userId: string, promptId: string, type: 'video' | 'image') => Promise<void>;
  reset: () => void;
}

const ITEMS_PER_PAGE = 12;

export const usePromptDatabaseStore = create<PromptDatabaseState>((set, get) => ({
  // Initial state
  contentType: 'videos',
  category: 'recent',
  searchQuery: '',
  videos: [],
  images: [],
  savedPrompts: [],
  isLoading: false,
  isSavedLoading: false,
  hasMore: true,

  setContentType: (type: ContentType) => {
    set({ contentType: type, videos: [], images: [], hasMore: true });
    get().fetchPrompts();
  },

  setCategory: (category: Category) => {
    set({ category, videos: [], images: [], hasMore: true });
    if (category === 'saved') {
      // Saved prompts will be loaded separately
    } else {
      get().fetchPrompts();
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  fetchPrompts: async (userId?: string, searchOverride?: string) => {
    const { contentType, category, searchQuery } = get();
    // Use searchOverride if provided, otherwise use store state
    const effectiveSearch = searchOverride !== undefined ? searchOverride : searchQuery;

    console.log('[fetchPrompts] Called with:', { userId, searchOverride, effectiveSearch, contentType, category });

    set({ isLoading: true });

    try {
      if (contentType === 'videos') {
        let videos: Video[] = [];

        if (category === 'popular') {
          videos = await getPopularRemixableVideos(ITEMS_PER_PAGE) as unknown as Video[];
        } else if (category === 'free') {
          videos = await getRemixableVideos({ filter: 'free', limit: ITEMS_PER_PAGE }) as unknown as Video[];
        } else {
          // recent - default
          videos = await getRemixableVideos({ filter: 'all', limit: ITEMS_PER_PAGE }) as unknown as Video[];
        }

        console.log('[fetchPrompts] Videos fetched:', videos.length, 'First video:', videos[0]);

        // Apply search filter if query exists
        if (effectiveSearch.trim()) {
          const lowerQuery = effectiveSearch.toLowerCase();
          const beforeCount = videos.length;
          videos = videos.filter((v) =>
            v.description?.toLowerCase().includes(lowerQuery) ||
            v.username?.toLowerCase().includes(lowerQuery)
          );
          console.log('[fetchPrompts] Search filter applied:', { query: lowerQuery, before: beforeCount, after: videos.length });
        }

        set({ videos, hasMore: videos.length >= ITEMS_PER_PAGE });
      } else {
        let images: ImageJob[] = [];

        if (category === 'popular') {
          images = await getPopularRemixableImages(ITEMS_PER_PAGE) as unknown as ImageJob[];
        } else if (category === 'free') {
          images = await getRemixableImages({ filter: 'free', limit: ITEMS_PER_PAGE }) as unknown as ImageJob[];
        } else {
          // recent - default
          images = await getRemixableImages({ filter: 'all', limit: ITEMS_PER_PAGE }) as unknown as ImageJob[];
        }

        console.log('[fetchPrompts] Images fetched:', images.length, 'First image:', images[0]);

        // Apply search filter if query exists
        if (effectiveSearch.trim()) {
          const lowerQuery = effectiveSearch.toLowerCase();
          const beforeCount = images.length;
          images = images.filter((img) =>
            img.prompt?.toLowerCase().includes(lowerQuery)
          );
          console.log('[fetchPrompts] Search filter applied:', { query: lowerQuery, before: beforeCount, after: images.length });
        }

        set({ images, hasMore: images.length >= ITEMS_PER_PAGE });
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSavedPrompts: async (userId: string) => {
    const { contentType } = get();

    set({ isSavedLoading: true });

    try {
      const promptType = contentType === 'videos' ? 'video' : 'image';
      const saved = await getUserPurchasedPrompts(userId, promptType);
      set({ savedPrompts: saved });
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
    } finally {
      set({ isSavedLoading: false });
    }
  },

  loadMore: async () => {
    // For now, we're not implementing true pagination with Firestore cursors
    // This is a placeholder for future implementation
    const { videos, images, contentType, category, searchQuery } = get();
    const currentCount = contentType === 'videos' ? videos.length : images.length;

    set({ isLoading: true });

    try {
      if (contentType === 'videos') {
        let moreVideos: Video[] = [];

        if (category === 'popular') {
          moreVideos = await getPopularRemixableVideos(currentCount + ITEMS_PER_PAGE) as unknown as Video[];
        } else if (category === 'free') {
          moreVideos = await getRemixableVideos({ filter: 'free', limit: currentCount + ITEMS_PER_PAGE }) as unknown as Video[];
        } else {
          moreVideos = await getRemixableVideos({ filter: 'all', limit: currentCount + ITEMS_PER_PAGE }) as unknown as Video[];
        }

        // Apply search filter
        if (searchQuery.trim()) {
          const lowerQuery = searchQuery.toLowerCase();
          moreVideos = moreVideos.filter((v) =>
            v.description?.toLowerCase().includes(lowerQuery) ||
            v.username?.toLowerCase().includes(lowerQuery)
          );
        }

        set({
          videos: moreVideos,
          hasMore: moreVideos.length > currentCount
        });
      } else {
        let moreImages: ImageJob[] = [];

        if (category === 'popular') {
          moreImages = await getPopularRemixableImages(currentCount + ITEMS_PER_PAGE) as unknown as ImageJob[];
        } else if (category === 'free') {
          moreImages = await getRemixableImages({ filter: 'free', limit: currentCount + ITEMS_PER_PAGE }) as unknown as ImageJob[];
        } else {
          moreImages = await getRemixableImages({ filter: 'all', limit: currentCount + ITEMS_PER_PAGE }) as unknown as ImageJob[];
        }

        // Apply search filter
        if (searchQuery.trim()) {
          const lowerQuery = searchQuery.toLowerCase();
          moreImages = moreImages.filter((img) =>
            img.prompt?.toLowerCase().includes(lowerQuery)
          );
        }

        set({
          images: moreImages,
          hasMore: moreImages.length > currentCount
        });
      }
    } catch (error) {
      console.error('Error loading more prompts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  purchasePrompt: async (params: PurchasePromptParams) => {
    await purchasePrompt(params);
  },

  saveFreePrompt: async (params: SaveFreePromptParams) => {
    await saveFreePrompt(params);
  },

  checkIfPurchased: async (userId: string, promptId: string, type: 'video' | 'image') => {
    return hasUserPurchasedPrompt(userId, promptId, type);
  },

  removeSavedPrompt: async (userId: string, promptId: string, type: 'video' | 'image') => {
    await removeSavedPrompt(userId, promptId, type);

    // Update local state
    const { savedPrompts } = get();
    set({
      savedPrompts: savedPrompts.filter(
        (p) => !(p.promptId === promptId && p.promptType === type)
      ),
    });
  },

  reset: () => {
    set({
      contentType: 'videos',
      category: 'recent',
      searchQuery: '',
      videos: [],
      images: [],
      savedPrompts: [],
      isLoading: false,
      isSavedLoading: false,
      hasMore: true,
    });
  },
}));
