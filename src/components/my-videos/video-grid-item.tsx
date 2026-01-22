'use client';

import { VideoJob, Video } from '@/types';
import { Play, Eye, AlertCircle } from 'lucide-react';
import { formatCount } from '@/lib/services/video-service';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';

type GridItemType = 'processing' | 'completed' | 'liked';

interface VideoGridItemProps {
  item: VideoJob | Video;
  type: GridItemType;
  onClick: () => void;
}

export function VideoGridItem({ item, type, onClick }: VideoGridItemProps) {
  const isProcessing = type === 'processing';
  const video = item as Video;
  const job = item as VideoJob;

  // Get thumbnail URL and convert to proper Firebase Storage format
  const rawThumbnailUrl = isProcessing
    ? job.thumbnailUrl
    : video.thumbnailUrl;
  const thumbnailUrl = convertToFirebaseStorageUrl(rawThumbnailUrl);

  // Get status for processing items
  const status = isProcessing ? job.status : 'complete';
  const progress = isProcessing ? job.progress || 0 : 100;

  // Calculate display progress based on status
  const getDisplayProgress = () => {
    if (status === 'pending') return 10;
    if (status === 'post-processing') return 90;
    if (status === 'processing') return Math.max(20, Math.min(85, progress));
    return progress;
  };

  return (
    <button
      onClick={onClick}
      className="relative aspect-square bg-card rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Thumbnail or placeholder */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
      )}

      {/* Processing overlay */}
      {isProcessing && status !== 'complete' && status !== 'failed' && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          {/* Animated spinner */}
          <div className="relative w-16 h-16">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            {/* Inner content */}
            <div className="absolute inset-2 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getDisplayProgress()}%
              </span>
            </div>
          </div>
          {/* Status text */}
          <span className="text-white/80 text-xs mt-2 capitalize">
            {status === 'pending' ? 'In Queue' : status}
          </span>
        </div>
      )}

      {/* Failed overlay */}
      {isProcessing && status === 'failed' && (
        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <span className="text-red-500 text-xs mt-2">Failed</span>
        </div>
      )}

      {/* Completed video overlay */}
      {!isProcessing && (
        <>
          {/* Play icon on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>

          {/* View count badge */}
          {video.views > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
              <Eye className="w-3 h-3 text-white" />
              <span className="text-white text-xs">{formatCount(video.views)}</span>
            </div>
          )}

          {/* Privacy indicator for own videos */}
          {type === 'completed' && !video.isPublic && (
            <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
              <span className="text-white text-xs">Private</span>
            </div>
          )}
        </>
      )}
    </button>
  );
}
