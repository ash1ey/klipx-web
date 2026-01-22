'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDiscoverStore } from '@/stores/discover-store';
import { useAuthStore } from '@/stores/auth-store';
import { VideoPlayer } from '@/components/discover/video-player';
import { VideoActions } from '@/components/discover/video-actions';
import { UserInfo } from '@/components/discover/user-info';
import { CommentsModal } from '@/components/discover/comments-modal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { incrementShares } from '@/lib/services/video-service';

export default function DiscoverPage() {
  const { user } = useAuthStore();
  const {
    videos,
    currentIndex,
    isLoading,
    error,
    hasMore,
    fetchVideos,
    loadMore,
    setCurrentIndex,
    trackView,
    cleanup,
  } = useDiscoverStore();

  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const currentVideo = videos[currentIndex];

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
    return () => cleanup();
  }, [fetchVideos, cleanup]);

  // Track view when video becomes active
  useEffect(() => {
    if (currentVideo && user?.uid) {
      trackView(currentVideo.id, user.uid);
    }
  }, [currentVideo?.id, user?.uid, trackView]);

  // Intersection Observer for view tracking and infinite scroll
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.5,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setCurrentIndex(index);

          // Load more when near the end
          if (index >= videos.length - 2 && hasMore && !isLoading) {
            loadMore();
          }
        }
      });
    }, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos.length, hasMore, isLoading, setCurrentIndex, loadMore]);

  // Observe video elements
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    videoRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });

    return () => {
      videoRefs.current.forEach((ref) => {
        if (ref && observerRef.current) {
          observerRef.current.unobserve(ref);
        }
      });
    };
  }, [videos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  const scrollToIndex = useCallback((index: number) => {
    const element = videoRefs.current[index];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleProfileClick = (userId: string) => {
    window.location.href = `/profile/${userId}/`;
  };

  const handleShareClick = async () => {
    if (!currentVideo) return;

    try {
      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/video/${currentVideo.id}/`;
      await navigator.clipboard.writeText(shareUrl);

      // Increment share count
      await incrementShares(currentVideo.id);

      toast.success('Link copied to clipboard!');

      // Try native share if available
      if (navigator.share) {
        await navigator.share({
          title: `Check out this AI video by @${currentVideo.username}`,
          text: currentVideo.description,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Loading state
  if (isLoading && videos.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && videos.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => fetchVideos()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No videos yet</p>
          <p>Be the first to create one!</p>
          <button
            onClick={() => (window.location.href = '/create/')}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Create Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-black">
      {/* Video Feed Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            ref={(el) => {
              videoRefs.current[index] = el;
            }}
            data-index={index}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Video Player */}
            <div className="relative h-full w-full max-w-md mx-auto">
              <VideoPlayer
                video={video}
                isActive={index === currentIndex}
              />

              {/* User Info - Bottom Left */}
              <div className="absolute bottom-20 left-4 right-20 z-20">
                <UserInfo
                  video={video}
                  onUsernameClick={handleProfileClick}
                />
              </div>

              {/* Video Actions - Right Side */}
              <div className="absolute right-4 bottom-32 z-20">
                <VideoActions
                  video={video}
                  onCommentClick={() => setShowComments(true)}
                  onShareClick={handleShareClick}
                  onProfileClick={handleProfileClick}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator for infinite scroll */}
        {isLoading && videos.length > 0 && (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs z-30 pointer-events-none">
        Scroll or use arrow keys to navigate
      </div>

      {/* Video position indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
        {videos.slice(0, Math.min(videos.length, 10)).map((_, index) => (
          <div
            key={index}
            className={`w-1 h-6 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
        {videos.length > 10 && (
          <div className="text-white/50 text-xs text-center">
            +{videos.length - 10}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {currentVideo && (
        <CommentsModal
          video={currentVideo}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}
