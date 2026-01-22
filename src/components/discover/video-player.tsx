'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Video } from '@/types';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';

interface VideoPlayerProps {
  video: Video;
  isActive: boolean;
  onVideoEnd?: () => void;
}

export function VideoPlayer({ video, isActive, onVideoEnd }: VideoPlayerProps) {
  // Convert URLs to proper Firebase Storage format
  const videoUrl = convertToFirebaseStorageUrl(video.videoUrl);
  const thumbnailUrl = convertToFirebaseStorageUrl(video.thumbnailUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start with audio enabled
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle play/pause based on active state
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing video:', error);
        setIsPlaying(false);
      });
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  // Update progress bar
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      setProgress(isNaN(progress) ? 0 : progress);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVideoClick = () => {
    togglePlay();
    setShowControls(true);

    // Hide controls after 2 seconds
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handleVideoEnd = () => {
    // Loop the video
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play();
    }
    onVideoEnd?.();
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    videoElement.currentTime = percentage * videoElement.duration;
  };

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onClick={handleVideoClick}
    >
      {/* Thumbnail/poster while loading */}
      {isLoading && thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl || ''}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
        loop
        preload="auto"
        onLoadedData={handleLoadedData}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onEnded={handleVideoEnd}
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay indicator */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
          {isPlaying ? (
            <Pause className="w-10 h-10 text-white" />
          ) : (
            <Play className="w-10 h-10 text-white ml-1" />
          )}
        </div>
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer z-10"
        onClick={(e) => {
          e.stopPropagation();
          handleSeek(e);
        }}
      >
        <div
          className="h-full bg-primary transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
