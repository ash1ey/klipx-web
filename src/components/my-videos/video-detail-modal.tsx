'use client';

import { useState, useRef, useEffect } from 'react';
import { Video } from '@/types';
import {
  Play,
  Download,
  Share2,
  Settings,
  Heart,
  Eye,
  X,
  Globe,
  Lock,
  Loader2,
  Coins,
} from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { formatCount } from '@/lib/services/video-service';
import { useMyVideosStore } from '@/stores/my-videos-store';

interface VideoDetailModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  isOwnVideo?: boolean;
}

export function VideoDetailModal({
  video,
  isOpen,
  onClose,
  isOwnVideo = true,
}: VideoDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isPublic, setIsPublic] = useState(video?.isPublic ?? true);
  const [allowRemix, setAllowRemix] = useState(video?.allowRemix ?? false);
  const [pricingType, setPricingType] = useState<'free' | 'paid'>(
    video?.remixPrice && video.remixPrice > 0 ? 'paid' : 'free'
  );
  const [remixPrice, setRemixPrice] = useState(video?.remixPrice ?? 5);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { updateVideoSettings } = useMyVideosStore();

  // Reset state when video changes
  useEffect(() => {
    if (video) {
      setIsPublic(video.isPublic);
      setAllowRemix(video.allowRemix);
      setPricingType(video.remixPrice && video.remixPrice > 0 ? 'paid' : 'free');
      setRemixPrice(video.remixPrice ?? 5);
    }
  }, [video]);

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen]);

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

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
      setIsPlaying(false);
    } else {
      videoElement.play().then(() => {
        setIsPlaying(true);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    videoElement.currentTime = percentage * videoElement.duration;
  };

  const handleDownload = async () => {
    if (!video) return;

    const downloadUrl = convertToFirebaseStorageUrl(video.videoUrl);
    if (!downloadUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klipx-video-${video.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!video) return;

    const shareUrl = `${window.location.origin}/video/${video.id}/`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this AI video!',
          text: video.description,
          url: shareUrl,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!video) return;

    setIsSaving(true);
    try {
      const finalRemixPrice = allowRemix && pricingType === 'paid' ? remixPrice : null;
      await updateVideoSettings(video.id, {
        isPublic,
        allowRemix,
        remixPrice: finalRemixPrice,
      });
      toast.success('Settings saved!');
      setShowSettings(false);
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemixPriceChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setRemixPrice(num);
    }
  };

  if (!video) return null;

  // Convert URLs to proper Firebase Storage format
  const videoUrl = convertToFirebaseStorageUrl(video.videoUrl);
  const thumbnailUrl = convertToFirebaseStorageUrl(video.thumbnailUrl);

  const formatModelName = (model: string) => {
    const modelNames: Record<string, string> = {
      sora2: 'SORA 2',
      veo3: 'VEO 3',
      grok: 'GROK',
      wan26: 'WAN 2.6',
      seedance: 'SEEDANCE',
      kling26: 'KLING 2.6',
    };
    return modelNames[model] || model.toUpperCase();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle>Video Details</SheetTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Video Player */}
            <div className="flex-1 bg-black relative overflow-hidden" style={{ minHeight: 0 }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl || undefined}
                  poster={thumbnailUrl || undefined}
                  className="max-w-full max-h-full object-contain"
                  playsInline
                  loop
                  onClick={togglePlay}
                />
              </div>

              {/* Play/Pause overlay */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Video Info & Actions */}
            <div className="flex-shrink-0 p-4 space-y-4 border-t bg-background">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  {formatCount(video.views)} views
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  {formatCount(video.likes)} likes
                </div>
                <Badge variant="outline">{formatModelName(video.modelUsed)}</Badge>
                {isOwnVideo && (
                  <Badge variant={video.isPublic ? 'default' : 'secondary'}>
                    {video.isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {video.isPublic ? 'Public' : 'Private'}
                  </Badge>
                )}
              </div>

              {/* Prompt */}
              <p className="text-sm">{video.description}</p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={handleDownload} disabled={isDownloading} className="flex-1">
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download
                </Button>
                <Button variant="outline" onClick={handleShare} className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {isOwnVideo && (
                  <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Video Settings</DialogTitle>
            <DialogDescription>
              Control who can see and use your video
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="public">Public</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can see this video in the Discover feed
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="remix">Allow Remix</Label>
                <p className="text-sm text-muted-foreground">
                  Others can use this video&apos;s prompt
                </p>
              </div>
              <Switch
                id="remix"
                checked={allowRemix}
                onCheckedChange={setAllowRemix}
              />
            </div>

            {/* Remix Pricing - only show when allowRemix is enabled */}
            {allowRemix && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <Label className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  Remix Pricing
                </Label>
                <RadioGroup
                  value={pricingType}
                  onValueChange={(value) => setPricingType(value as 'free' | 'paid')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="pricing-free" />
                    <Label htmlFor="pricing-free" className="font-normal cursor-pointer">
                      Free - Anyone can use this prompt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="pricing-paid" />
                    <Label htmlFor="pricing-paid" className="font-normal cursor-pointer">
                      Paid - Charge credits for prompt access
                    </Label>
                  </div>
                </RadioGroup>

                {pricingType === 'paid' && (
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={remixPrice}
                      onChange={(e) => handleRemixPriceChange(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">credits (1-10)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
