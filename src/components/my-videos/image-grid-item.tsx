'use client';

import { ImageJob } from '@/types';
import { AlertCircle, Download, Image as ImageIcon } from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';

interface ImageGridItemProps {
  image: ImageJob;
  onClick: () => void;
}

export function ImageGridItem({ image, onClick }: ImageGridItemProps) {
  const status = image.status;
  const isProcessing = status !== 'complete' && status !== 'failed';

  // Get display image URL (prefer optimized, fallback to original) and convert to proper format
  const rawUrl = image.imageUrl || image.thumbnailUrl;
  const displayUrl = convertToFirebaseStorageUrl(rawUrl);

  const getProgressDisplay = () => {
    switch (status) {
      case 'pending':
        return '10%';
      case 'processing':
        return '50%';
      case 'post-processing':
        return '90%';
      default:
        return '0%';
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative aspect-square bg-card rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Thumbnail or placeholder */}
      {displayUrl ? (
        <img
          src={displayUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          {/* Animated spinner */}
          <div className="relative w-16 h-16">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border-2 border-pink-500/30" />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-pink-500 animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            {/* Inner content */}
            <div className="absolute inset-2 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getProgressDisplay()}
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
      {status === 'failed' && (
        <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <span className="text-red-500 text-xs mt-2">Failed</span>
        </div>
      )}

      {/* Completed overlay (hover) */}
      {status === 'complete' && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-pink-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Download className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Model badge for completed images */}
      {status === 'complete' && (
        <div className="absolute bottom-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
          <span className="text-white text-xs capitalize">
            {image.model === 'nano-banana-pro' ? 'AI' : image.model}
          </span>
        </div>
      )}

      {/* Privacy indicator */}
      {!image.isPublic && status === 'complete' && (
        <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
          <span className="text-white text-xs">Private</span>
        </div>
      )}
    </button>
  );
}
