'use client';

import { useState } from 'react';
import { Heart, Play, User, MessageCircle, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface LikedVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  likedAt: Date;
}

// Mock data
const mockLikedVideos: LikedVideo[] = [
  {
    id: '1',
    videoUrl: '/video1.mp4',
    thumbnailUrl: '/thumb1.jpg',
    prompt: 'A beautiful sunset over the ocean with dolphins jumping',
    creator: {
      id: 'user1',
      username: 'oceanvibes',
      avatarUrl: '/avatar1.jpg',
    },
    likes: 12500,
    comments: 342,
    shares: 89,
    likedAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    videoUrl: '/video2.mp4',
    thumbnailUrl: '/thumb2.jpg',
    prompt: 'Cyberpunk cityscape with neon lights reflecting in rain',
    creator: {
      id: 'user2',
      username: 'neonartist',
      avatarUrl: '/avatar2.jpg',
    },
    likes: 8900,
    comments: 156,
    shares: 45,
    likedAt: new Date(Date.now() - 172800000),
  },
  {
    id: '3',
    videoUrl: '/video3.mp4',
    thumbnailUrl: '/thumb3.jpg',
    prompt: 'Cute cat learning to play the piano',
    creator: {
      id: 'user3',
      username: 'catlover',
    },
    likes: 45000,
    comments: 2100,
    shares: 890,
    likedAt: new Date(Date.now() - 259200000),
  },
];

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export default function LikedVideosPage() {
  const [likedVideos, setLikedVideos] = useState(mockLikedVideos);

  const handleUnlike = (videoId: string) => {
    setLikedVideos(likedVideos.filter((v) => v.id !== videoId));
    toast.success('Removed from liked videos');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-bold">Liked Videos</h1>
        </div>
        <p className="text-muted-foreground">
          Videos you've liked from the Discover feed
        </p>
      </div>

      {likedVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-6 w-6" />
                  </Button>
                </div>

                {/* Unlike Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                  onClick={() => handleUnlike(video.id)}
                >
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                </Button>

                {/* Stats Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center gap-3 text-white text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {formatCount(video.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {formatCount(video.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      {formatCount(video.shares)}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Creator */}
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={video.creator.avatarUrl} />
                    <AvatarFallback>
                      {video.creator.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">@{video.creator.username}</span>
                </div>

                {/* Prompt */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {video.prompt}
                </p>

                {/* Liked Time */}
                <p className="text-xs text-muted-foreground">
                  Liked {formatTimeAgo(video.likedAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No liked videos yet</h3>
          <p className="text-muted-foreground mb-6">
            Discover and like videos to see them here
          </p>
          <Button asChild>
            <a href="/discover">Explore Discover</a>
          </Button>
        </div>
      )}
    </div>
  );
}
