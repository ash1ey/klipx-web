'use client';

import { useEffect, useState } from 'react';
import { Video as VideoIcon, Image, Heart, Loader2, Film } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useMyVideosStore } from '@/stores/my-videos-store';
import { VideoGridItem } from '@/components/my-videos/video-grid-item';
import { ProcessingModal } from '@/components/my-videos/processing-modal';
import { VideoDetailModal } from '@/components/my-videos/video-detail-modal';
import { ImageGridItem } from '@/components/my-videos/image-grid-item';
import { ImageDetailModal } from '@/components/my-videos/image-detail-modal';
import { VideoJob, Video, ImageJob } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type TabType = 'videos' | 'images' | 'liked';

const ITEMS_PER_PAGE = 12;

export default function MyVideosPage() {
  const { user, loading: authLoading } = useAuthStore();
  const {
    videoJobs,
    videoJobsLoading,
    publishedVideos,
    publishedVideosLoading,
    imageJobs,
    imageJobsLoading,
    likedVideos,
    likedVideosLoading,
    subscribeToVideoJobs,
    subscribeToPublishedVideos,
    subscribeToImageJobs,
    subscribeToLikedVideos,
    updateImagePrivacy,
    cleanup,
  } = useMyVideosStore();

  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageJob | null>(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Pagination state for each tab
  const [videosDisplayCount, setVideosDisplayCount] = useState(ITEMS_PER_PAGE);
  const [imagesDisplayCount, setImagesDisplayCount] = useState(ITEMS_PER_PAGE);
  const [likedDisplayCount, setLikedDisplayCount] = useState(ITEMS_PER_PAGE);

  // Reset display counts when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Subscribe to data when user is available
  useEffect(() => {
    if (user?.uid) {
      subscribeToVideoJobs(user.uid);
      subscribeToPublishedVideos(user.uid);
      subscribeToImageJobs(user.uid);
      subscribeToLikedVideos(user.uid);
    }

    return () => cleanup();
  }, [user?.uid, subscribeToVideoJobs, subscribeToPublishedVideos, subscribeToImageJobs, subscribeToLikedVideos, cleanup]);

  // Filter video jobs that are still processing (not completed/published)
  const processingJobs = videoJobs.filter(
    (job) => job.status !== 'complete' || !publishedVideos.some((v) => v.id === job.id)
  );

  // Combine processing jobs with published videos for the Videos tab
  const allVideos = [
    ...processingJobs.map((job) => ({ type: 'processing' as const, item: job })),
    ...publishedVideos.map((video) => ({ type: 'completed' as const, item: video })),
  ].sort((a, b) => {
    const aTime = a.item.createdAt?.toMillis?.() || 0;
    const bTime = b.item.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  const handleItemClick = (type: 'processing' | 'completed' | 'liked', item: VideoJob | Video) => {
    if (type === 'processing') {
      setSelectedJob(item as VideoJob);
      setShowProcessingModal(true);
    } else {
      setSelectedVideo(item as Video);
      setShowVideoModal(true);
    }
  };

  const handleImageClick = (image: ImageJob) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const isLoading = authLoading || (activeTab === 'videos' && (videoJobsLoading || publishedVideosLoading)) ||
    (activeTab === 'images' && imageJobsLoading) ||
    (activeTab === 'liked' && likedVideosLoading);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <Film className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your videos</h2>
        <p className="text-muted-foreground mb-6">
          Create an account to start generating AI videos
        </p>
        <Button onClick={() => (window.location.href = '/login/')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Files</h1>
        <p className="text-muted-foreground text-sm">
          View and manage your generated videos and images
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        <TabButton
          active={activeTab === 'videos'}
          onClick={() => handleTabChange('videos')}
          icon={<VideoIcon className="w-4 h-4" />}
          label="Videos"
          count={allVideos.length}
        />
        <TabButton
          active={activeTab === 'images'}
          onClick={() => handleTabChange('images')}
          icon={<Image className="w-4 h-4" />}
          label="Images"
          count={imageJobs.length}
        />
        <TabButton
          active={activeTab === 'liked'}
          onClick={() => handleTabChange('liked')}
          icon={<Heart className="w-4 h-4" />}
          label="Liked"
          count={likedVideos.length}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <>
              {allVideos.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {allVideos.slice(0, videosDisplayCount).map(({ type, item }) => (
                      <VideoGridItem
                        key={item.id}
                        item={item}
                        type={type}
                        onClick={() => handleItemClick(type, item)}
                      />
                    ))}
                  </div>
                  {videosDisplayCount < allVideos.length && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setVideosDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                      >
                        Load More ({allVideos.length - videosDisplayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<VideoIcon className="w-12 h-12" />}
                  title="No videos yet"
                  description="Create your first AI video to see it here"
                  actionLabel="Create Video"
                  actionHref="/create/text-to-video/"
                />
              )}
            </>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <>
              {imageJobs.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {imageJobs.slice(0, imagesDisplayCount).map((image) => (
                      <ImageGridItem
                        key={image.id}
                        image={image}
                        onClick={() => handleImageClick(image)}
                      />
                    ))}
                  </div>
                  {imagesDisplayCount < imageJobs.length && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setImagesDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                      >
                        Load More ({imageJobs.length - imagesDisplayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<Image className="w-12 h-12" />}
                  title="No images yet"
                  description="Generate AI images to see them here"
                  actionLabel="Create Image"
                  actionHref="/create/text-to-image/"
                />
              )}
            </>
          )}

          {/* Liked Tab */}
          {activeTab === 'liked' && (
            <>
              {likedVideos.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {likedVideos.slice(0, likedDisplayCount).map((video) => (
                      <VideoGridItem
                        key={video.id}
                        item={video}
                        type="liked"
                        onClick={() => handleItemClick('liked', video)}
                      />
                    ))}
                  </div>
                  {likedDisplayCount < likedVideos.length && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setLikedDisplayCount((prev) => prev + ITEMS_PER_PAGE)}
                      >
                        Load More ({likedVideos.length - likedDisplayCount} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<Heart className="w-12 h-12" />}
                  title="No liked videos"
                  description="Videos you like will appear here"
                  actionLabel="Discover Videos"
                  actionHref="/discover/"
                />
              )}
            </>
          )}
        </>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        job={selectedJob}
        isOpen={showProcessingModal}
        onClose={() => {
          setShowProcessingModal(false);
          setSelectedJob(null);
        }}
      />

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setSelectedVideo(null);
        }}
        isOwnVideo={activeTab !== 'liked'}
      />

      {/* Image Detail Modal */}
      <ImageDetailModal
        image={selectedImage}
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedImage(null);
        }}
        onUpdatePrivacy={updateImagePrivacy}
      />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}

function TabButton({ active, onClick, icon, label, count }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded-full',
          active ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

function EmptyState({ icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
      <Button onClick={() => (window.location.href = actionHref)}>
        {actionLabel}
      </Button>
    </div>
  );
}
