import { create } from 'zustand';
import { QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import { Video, Comment } from '@/types';
import {
  getPublicVideos,
  subscribeToPublicVideos,
  likeVideo,
  unlikeVideo,
  isVideoLiked,
  addComment as addCommentService,
  deleteComment as deleteCommentService,
  getComments,
  subscribeToComments,
  incrementViews,
  incrementShares,
} from '@/lib/services/video-service';
import {
  followUser as followUserService,
  unfollowUser as unfollowUserService,
  isFollowing,
} from '@/lib/services/social-service';

interface DiscoverState {
  // Video feed state
  videos: Video[];
  currentIndex: number;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot | null;

  // Comments state (per video)
  comments: Record<string, Comment[]>;
  commentsLoading: Record<string, boolean>;

  // Like status (per video)
  likeStatus: Record<string, boolean>;

  // Follow status (per user)
  followStatus: Record<string, boolean>;

  // Subscriptions
  unsubscribeVideos: Unsubscribe | null;
  unsubscribeComments: Record<string, Unsubscribe>;

  // Actions
  fetchVideos: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setCurrentIndex: (index: number) => void;

  // Like actions
  toggleLike: (
    videoId: string,
    userId: string,
    videoOwnerId: string,
    username: string
  ) => Promise<void>;
  checkLikeStatus: (videoId: string, userId: string) => Promise<void>;

  // Comment actions
  loadComments: (videoId: string) => Promise<void>;
  subscribeToVideoComments: (videoId: string) => void;
  addComment: (
    videoId: string,
    userId: string,
    username: string,
    userPhotoUrl: string | null,
    text: string,
    videoOwnerId: string
  ) => Promise<void>;
  deleteComment: (commentId: string, videoId: string) => Promise<void>;

  // View/Share actions
  trackView: (videoId: string, userId: string) => Promise<void>;
  trackShare: (videoId: string) => Promise<void>;

  // Follow actions
  toggleFollow: (
    targetUserId: string,
    currentUserId: string,
    currentUsername: string
  ) => Promise<void>;
  checkFollowStatus: (targetUserId: string, currentUserId: string) => Promise<void>;

  // Cleanup
  cleanup: () => void;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  videos: [],
  currentIndex: 0,
  isLoading: false,
  hasMore: true,
  error: null,
  lastDoc: null,

  comments: {},
  commentsLoading: {},

  likeStatus: {},
  followStatus: {},

  unsubscribeVideos: null,
  unsubscribeComments: {},

  fetchVideos: async () => {
    const { unsubscribeVideos } = get();
    if (unsubscribeVideos) unsubscribeVideos();

    set({ isLoading: true, error: null });

    try {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToPublicVideos(20, (videos) => {
        set({ videos, isLoading: false });
      });

      set({ unsubscribeVideos: unsubscribe });

      // Also fetch initial data
      const { videos, lastDoc } = await getPublicVideos(20);
      set({
        videos,
        lastDoc,
        hasMore: videos.length === 20,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch videos',
        isLoading: false,
      });
    }
  },

  loadMore: async () => {
    const { lastDoc, hasMore, isLoading } = get();
    if (!hasMore || isLoading || !lastDoc) return;

    set({ isLoading: true });

    try {
      const { videos: newVideos, lastDoc: newLastDoc } = await getPublicVideos(
        10,
        lastDoc
      );

      set((state) => ({
        videos: [...state.videos, ...newVideos],
        lastDoc: newLastDoc,
        hasMore: newVideos.length === 10,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading more videos:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load more',
        isLoading: false,
      });
    }
  },

  refresh: async () => {
    const { cleanup } = get();
    cleanup();
    set({
      videos: [],
      currentIndex: 0,
      lastDoc: null,
      hasMore: true,
      comments: {},
      likeStatus: {},
      followStatus: {},
    });
    await get().fetchVideos();
  },

  setCurrentIndex: (index: number) => {
    set({ currentIndex: index });
  },

  toggleLike: async (videoId, userId, videoOwnerId, username) => {
    const { likeStatus } = get();
    const isLiked = likeStatus[videoId] || false;

    // Optimistic update
    set((state) => ({
      likeStatus: { ...state.likeStatus, [videoId]: !isLiked },
      videos: state.videos.map((v) =>
        v.id === videoId
          ? { ...v, likes: v.likes + (isLiked ? -1 : 1) }
          : v
      ),
    }));

    try {
      if (isLiked) {
        await unlikeVideo(videoId, userId, videoOwnerId);
      } else {
        await likeVideo(videoId, userId, videoOwnerId, username);
      }
    } catch (error) {
      // Revert on error
      set((state) => ({
        likeStatus: { ...state.likeStatus, [videoId]: isLiked },
        videos: state.videos.map((v) =>
          v.id === videoId
            ? { ...v, likes: v.likes + (isLiked ? 1 : -1) }
            : v
        ),
      }));
      console.error('Error toggling like:', error);
    }
  },

  checkLikeStatus: async (videoId, userId) => {
    try {
      const liked = await isVideoLiked(videoId, userId);
      set((state) => ({
        likeStatus: { ...state.likeStatus, [videoId]: liked },
      }));
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  },

  loadComments: async (videoId) => {
    set((state) => ({
      commentsLoading: { ...state.commentsLoading, [videoId]: true },
    }));

    try {
      const comments = await getComments(videoId);
      set((state) => ({
        comments: { ...state.comments, [videoId]: comments },
        commentsLoading: { ...state.commentsLoading, [videoId]: false },
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      set((state) => ({
        commentsLoading: { ...state.commentsLoading, [videoId]: false },
      }));
    }
  },

  subscribeToVideoComments: (videoId) => {
    const { unsubscribeComments } = get();

    // Unsubscribe from previous if exists
    if (unsubscribeComments[videoId]) {
      unsubscribeComments[videoId]();
    }

    const unsubscribe = subscribeToComments(videoId, (comments) => {
      set((state) => ({
        comments: { ...state.comments, [videoId]: comments },
      }));
    });

    set((state) => ({
      unsubscribeComments: {
        ...state.unsubscribeComments,
        [videoId]: unsubscribe,
      },
    }));
  },

  addComment: async (videoId, userId, username, userPhotoUrl, text, videoOwnerId) => {
    try {
      await addCommentService(
        videoId,
        userId,
        username,
        userPhotoUrl,
        text,
        videoOwnerId
      );
      // Comments will be updated via subscription
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deleteComment: async (commentId, videoId) => {
    try {
      await deleteCommentService(commentId, videoId);
      // Comments will be updated via subscription
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  trackView: async (videoId, userId) => {
    try {
      await incrementViews(videoId, userId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  },

  trackShare: async (videoId) => {
    try {
      await incrementShares(videoId);
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  },

  toggleFollow: async (targetUserId, currentUserId, currentUsername) => {
    const { followStatus } = get();
    const isCurrentlyFollowing = followStatus[targetUserId] || false;

    // Optimistic update
    set((state) => ({
      followStatus: { ...state.followStatus, [targetUserId]: !isCurrentlyFollowing },
    }));

    try {
      if (isCurrentlyFollowing) {
        await unfollowUserService(targetUserId, currentUserId);
      } else {
        await followUserService(targetUserId, currentUserId, currentUsername);
      }
    } catch (error) {
      // Revert on error
      set((state) => ({
        followStatus: { ...state.followStatus, [targetUserId]: isCurrentlyFollowing },
      }));
      console.error('Error toggling follow:', error);
    }
  },

  checkFollowStatus: async (targetUserId, currentUserId) => {
    try {
      const following = await isFollowing(targetUserId, currentUserId);
      set((state) => ({
        followStatus: { ...state.followStatus, [targetUserId]: following },
      }));
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  },

  cleanup: () => {
    const { unsubscribeVideos, unsubscribeComments } = get();

    if (unsubscribeVideos) {
      unsubscribeVideos();
    }

    Object.values(unsubscribeComments).forEach((unsub) => {
      if (unsub) unsub();
    });

    set({
      unsubscribeVideos: null,
      unsubscribeComments: {},
    });
  },
}));
