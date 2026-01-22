'use client';

import { Video, ImageJob } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Coins, Bookmark } from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';

interface PromptCardProps {
  item: Video | ImageJob;
  type: 'video' | 'image';
  isSaved?: boolean;
  onClick?: () => void;
}

export function PromptCard({ item, type, isSaved = false, onClick }: PromptCardProps) {
  const isVideo = type === 'video';
  const video = isVideo ? (item as Video) : null;
  const image = !isVideo ? (item as ImageJob) : null;

  // Get thumbnail URL
  const thumbnailUrl = convertToFirebaseStorageUrl(
    isVideo ? video?.thumbnailUrl : image?.thumbnailUrl || image?.imageUrl
  );

  // Get pricing info
  const remixPrice = isVideo ? video?.remixPrice : image?.remixPrice;
  const isFree = !remixPrice || remixPrice === 0;
  const allowRemix = isVideo ? video?.allowRemix : image?.allowRemix;

  // Get user info (only for videos)
  const username = isVideo ? video?.username : 'Anonymous';
  const userPhotoUrl = isVideo ? convertToFirebaseStorageUrl(video?.userPhotoUrl) : null;

  // Get prompt text
  const promptText = isVideo ? video?.description : image?.prompt;

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Prompt thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            {isVideo ? (
              <Play className="w-12 h-12 text-muted-foreground" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted-foreground/20" />
            )}
          </div>
        )}

        {/* Play icon overlay for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Pricing Badge */}
        {allowRemix && (
          <div className="absolute top-2 left-2">
            {isFree ? (
              <Badge className="bg-green-500 hover:bg-green-500 text-white">
                FREE
              </Badge>
            ) : (
              <Badge className="bg-red-500 hover:bg-red-500 text-white">
                <Coins className="w-3 h-3 mr-1" />
                {remixPrice}
              </Badge>
            )}
          </div>
        )}

        {/* Saved Badge */}
        {isSaved && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-primary/80 text-primary-foreground">
              <Bookmark className="w-3 h-3 mr-1 fill-current" />
              Saved
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* User info (for videos) */}
        {isVideo && (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={userPhotoUrl || undefined} />
              <AvatarFallback className="text-xs">
                {username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              {username}
            </span>
          </div>
        )}

        {/* Prompt preview */}
        <p className="text-sm line-clamp-2">{promptText || 'No prompt available'}</p>
      </div>
    </div>
  );
}
