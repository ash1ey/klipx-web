'use client';

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { VideoJob, Video, ImageJob } from '@/types';

interface VideoSettings {
  isPublic?: boolean;
  allowRemix?: boolean;
  remixPrice?: number | null;
}

interface ImageSettings {
  isPublic?: boolean;
  allowRemix?: boolean;
  remixPrice?: number | null;
}

interface MyVideosState {
  // Video jobs (processing)
  videoJobs: VideoJob[];
  videoJobsLoading: boolean;

  // Published videos (completed)
  publishedVideos: Video[];
  publishedVideosLoading: boolean;

  // Image jobs
  imageJobs: ImageJob[];
  imageJobsLoading: boolean;

  // Liked videos
  likedVideos: Video[];
  likedVideosLoading: boolean;

  // Subscriptions
  unsubscribeVideoJobs: Unsubscribe | null;
  unsubscribePublishedVideos: Unsubscribe | null;
  unsubscribeImageJobs: Unsubscribe | null;
  unsubscribeLikedVideos: Unsubscribe | null;

  // Actions
  subscribeToVideoJobs: (userId: string) => void;
  subscribeToPublishedVideos: (userId: string) => void;
  subscribeToImageJobs: (userId: string) => void;
  subscribeToLikedVideos: (userId: string) => void;
  deleteVideo: (videoId: string, isPublished: boolean) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  updateVideoPrivacy: (videoId: string, isPublic: boolean) => Promise<void>;
  updateImagePrivacy: (imageId: string, isPublic: boolean) => Promise<void>;
  updateVideoSettings: (videoId: string, settings: VideoSettings) => Promise<void>;
  updateImageSettings: (imageId: string, settings: ImageSettings) => Promise<void>;
  cleanup: () => void;
}

export const useMyVideosStore = create<MyVideosState>((set, get) => ({
  videoJobs: [],
  videoJobsLoading: true,
  publishedVideos: [],
  publishedVideosLoading: true,
  imageJobs: [],
  imageJobsLoading: true,
  likedVideos: [],
  likedVideosLoading: true,

  unsubscribeVideoJobs: null,
  unsubscribePublishedVideos: null,
  unsubscribeImageJobs: null,
  unsubscribeLikedVideos: null,

  subscribeToVideoJobs: (userId: string) => {
    const { unsubscribeVideoJobs } = get();
    if (unsubscribeVideoJobs) unsubscribeVideoJobs();

    set({ videoJobsLoading: true });

    const q = query(
      collection(db, 'videoJobs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs: VideoJob[] = [];
        snapshot.forEach((doc) => {
          jobs.push({ id: doc.id, ...doc.data() } as VideoJob);
        });
        set({ videoJobs: jobs, videoJobsLoading: false });
      },
      (error) => {
        console.error('Error fetching video jobs:', error);
        set({ videoJobsLoading: false });
      }
    );

    set({ unsubscribeVideoJobs: unsubscribe });
  },

  subscribeToPublishedVideos: (userId: string) => {
    const { unsubscribePublishedVideos } = get();
    if (unsubscribePublishedVideos) unsubscribePublishedVideos();

    set({ publishedVideosLoading: true });

    const q = query(
      collection(db, 'videos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const videos: Video[] = [];
        snapshot.forEach((doc) => {
          videos.push({ id: doc.id, ...doc.data() } as Video);
        });
        set({ publishedVideos: videos, publishedVideosLoading: false });
      },
      (error) => {
        console.error('Error fetching published videos:', error);
        set({ publishedVideosLoading: false });
      }
    );

    set({ unsubscribePublishedVideos: unsubscribe });
  },

  subscribeToImageJobs: (userId: string) => {
    const { unsubscribeImageJobs } = get();
    if (unsubscribeImageJobs) unsubscribeImageJobs();

    set({ imageJobsLoading: true });

    const q = query(
      collection(db, 'imageJobs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs: ImageJob[] = [];
        snapshot.forEach((doc) => {
          jobs.push({ id: doc.id, ...doc.data() } as ImageJob);
        });
        set({ imageJobs: jobs, imageJobsLoading: false });
      },
      (error) => {
        console.error('Error fetching image jobs:', error);
        set({ imageJobsLoading: false });
      }
    );

    set({ unsubscribeImageJobs: unsubscribe });
  },

  subscribeToLikedVideos: (userId: string) => {
    const { unsubscribeLikedVideos } = get();
    if (unsubscribeLikedVideos) unsubscribeLikedVideos();

    set({ likedVideosLoading: true });

    // First get all likes for this user
    const likesQuery = query(
      collection(db, 'likes'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      likesQuery,
      async (snapshot) => {
        const videoIds: string[] = [];
        snapshot.forEach((doc) => {
          videoIds.push(doc.data().videoId);
        });

        if (videoIds.length === 0) {
          set({ likedVideos: [], likedVideosLoading: false });
          return;
        }

        // Fetch the actual videos (in batches of 10 for Firestore 'in' limit)
        const videos: Video[] = [];
        const batches = [];
        for (let i = 0; i < videoIds.length; i += 10) {
          batches.push(videoIds.slice(i, i + 10));
        }

        for (const batch of batches) {
          const videosQuery = query(
            collection(db, 'videos'),
            where('__name__', 'in', batch)
          );

          const videosSnapshot = await import('firebase/firestore').then(
            ({ getDocs }) => getDocs(videosQuery)
          );

          videosSnapshot.forEach((doc) => {
            const video = { id: doc.id, ...doc.data() } as Video;
            // Only include public videos in liked list
            if (video.isPublic) {
              videos.push(video);
            }
          });
        }

        // Sort by the order they were liked (newest first)
        const sortedVideos = videoIds
          .map((id) => videos.find((v) => v.id === id))
          .filter((v): v is Video => v !== undefined);

        set({ likedVideos: sortedVideos, likedVideosLoading: false });
      },
      (error) => {
        console.error('Error fetching liked videos:', error);
        set({ likedVideosLoading: false });
      }
    );

    set({ unsubscribeLikedVideos: unsubscribe });
  },

  deleteVideo: async (videoId: string, isPublished: boolean) => {
    try {
      const collectionName = isPublished ? 'videos' : 'videoJobs';
      await deleteDoc(doc(db, collectionName, videoId));
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  deleteImage: async (imageId: string) => {
    try {
      await deleteDoc(doc(db, 'imageJobs', imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  updateVideoPrivacy: async (videoId: string, isPublic: boolean) => {
    try {
      await updateDoc(doc(db, 'videos', videoId), { isPublic });
    } catch (error) {
      console.error('Error updating video privacy:', error);
      throw error;
    }
  },

  updateImagePrivacy: async (imageId: string, isPublic: boolean) => {
    try {
      await updateDoc(doc(db, 'imageJobs', imageId), { isPublic });
    } catch (error) {
      console.error('Error updating image privacy:', error);
      throw error;
    }
  },

  updateVideoSettings: async (videoId: string, settings: VideoSettings) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (settings.isPublic !== undefined) updateData.isPublic = settings.isPublic;
      if (settings.allowRemix !== undefined) updateData.allowRemix = settings.allowRemix;
      if (settings.remixPrice !== undefined) updateData.remixPrice = settings.remixPrice;

      await updateDoc(doc(db, 'videos', videoId), updateData);
    } catch (error) {
      console.error('Error updating video settings:', error);
      throw error;
    }
  },

  updateImageSettings: async (imageId: string, settings: ImageSettings) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (settings.isPublic !== undefined) updateData.isPublic = settings.isPublic;
      if (settings.allowRemix !== undefined) updateData.allowRemix = settings.allowRemix;
      if (settings.remixPrice !== undefined) updateData.remixPrice = settings.remixPrice;

      await updateDoc(doc(db, 'imageJobs', imageId), updateData);
    } catch (error) {
      console.error('Error updating image settings:', error);
      throw error;
    }
  },

  cleanup: () => {
    const {
      unsubscribeVideoJobs,
      unsubscribePublishedVideos,
      unsubscribeImageJobs,
      unsubscribeLikedVideos,
    } = get();

    if (unsubscribeVideoJobs) unsubscribeVideoJobs();
    if (unsubscribePublishedVideos) unsubscribePublishedVideos();
    if (unsubscribeImageJobs) unsubscribeImageJobs();
    if (unsubscribeLikedVideos) unsubscribeLikedVideos();

    set({
      unsubscribeVideoJobs: null,
      unsubscribePublishedVideos: null,
      unsubscribeImageJobs: null,
      unsubscribeLikedVideos: null,
    });
  },
}));
