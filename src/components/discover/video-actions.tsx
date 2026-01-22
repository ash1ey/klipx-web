'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { useDiscoverStore } from '@/stores/discover-store';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2, UserPlus, UserCheck } from 'lucide-react';
import { formatCount } from '@/lib/services/video-service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VideoActionsProps {
  video: Video;
  onCommentClick: () => void;
  onShareClick: () => void;
  onProfileClick: (userId: string) => void;
}

export function VideoActions({
  video,
  onCommentClick,
  onShareClick,
  onProfileClick,
}: VideoActionsProps) {
  const { user } = useAuthStore();
  const {
    likeStatus,
    followStatus,
    toggleLike,
    toggleFollow,
    checkLikeStatus,
    checkFollowStatus,
  } = useDiscoverStore();

  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const isLiked = likeStatus[video.id] || false;
  const isFollowing = followStatus[video.userId] || false;
  const isOwnVideo = user?.uid === video.userId;

  // Check status on mount and when video changes
  useEffect(() => {
    if (user?.uid) {
      checkLikeStatus(video.id, user.uid);
      if (!isOwnVideo) {
        checkFollowStatus(video.userId, user.uid);
      }
    }
  }, [video.id, video.userId, user?.uid, isOwnVideo, checkLikeStatus, checkFollowStatus]);

  const handleLike = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login/';
      return;
    }

    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);

    await toggleLike(
      video.id,
      user.uid,
      video.userId,
      user.username || 'User'
    );
  };

  const handleFollow = async () => {
    if (!user) {
      window.location.href = '/login/';
      return;
    }

    await toggleFollow(
      video.userId,
      user.uid,
      user.username || 'User'
    );
  };

  const handleProfileClick = () => {
    onProfileClick(video.userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Creator Avatar with Follow button */}
      <div className="relative">
        <button
          onClick={handleProfileClick}
          className="relative"
        >
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage src={video.userPhotoUrl || undefined} alt={video.username} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(video.username)}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Follow button overlay */}
        {!isOwnVideo && (
          <button
            onClick={handleFollow}
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-colors",
              isFollowing
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            {isFollowing ? (
              <UserCheck className="w-3 h-3" />
            ) : (
              <UserPlus className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Like button */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1"
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full bg-black/30 flex items-center justify-center transition-transform",
            isLikeAnimating && "scale-125"
          )}
        >
          <Heart
            className={cn(
              "w-7 h-7 transition-colors",
              isLiked ? "fill-red-500 text-red-500" : "text-white"
            )}
          />
        </div>
        <span className="text-white text-xs font-medium">
          {formatCount(video.likes)}
        </span>
      </button>

      {/* Comment button */}
      <button
        onClick={onCommentClick}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <span className="text-white text-xs font-medium">
          {formatCount(video.commentsCount || 0)}
        </span>
      </button>

      {/* Share button */}
      <button
        onClick={onShareClick}
        className="flex flex-col items-center gap-1"
      >
        <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-white" />
        </div>
        <span className="text-white text-xs font-medium">
          {formatCount(video.shares || 0)}
        </span>
      </button>
    </div>
  );
}
