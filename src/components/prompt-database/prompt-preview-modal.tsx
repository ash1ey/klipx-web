'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, ImageJob } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  X,
  Play,
  Coins,
  Lock,
  Unlock,
  Bookmark,
  BookmarkCheck,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { usePromptDatabaseStore } from '@/stores/prompt-database-store';
import { formatCount } from '@/lib/services/video-service';

interface PromptPreviewModalProps {
  item: Video | ImageJob | null;
  type: 'video' | 'image';
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onSaveStatusChange?: () => void;
}

export function PromptPreviewModal({
  item,
  type,
  isOpen,
  onClose,
  isSaved = false,
  onSaveStatusChange,
}: PromptPreviewModalProps) {
  const { user, user: userData } = useAuthStore();
  const { purchasePrompt, saveFreePrompt, removeSavedPrompt } = usePromptDatabaseStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);

  const isVideo = type === 'video';
  const video = isVideo ? (item as Video) : null;
  const image = !isVideo ? (item as ImageJob) : null;

  // Get URLs
  const mediaUrl = convertToFirebaseStorageUrl(
    isVideo ? video?.videoUrl : image?.imageUrl
  );
  const thumbnailUrl = convertToFirebaseStorageUrl(
    isVideo ? video?.thumbnailUrl : image?.thumbnailUrl || image?.imageUrl
  );

  // Get pricing info
  const remixPrice = isVideo ? video?.remixPrice : image?.remixPrice;
  const isFree = !remixPrice || remixPrice === 0;
  const allowRemix = isVideo ? video?.allowRemix : image?.allowRemix;

  // Get content info
  const username = isVideo ? video?.username : 'Anonymous';
  const userPhotoUrl = isVideo ? convertToFirebaseStorageUrl(video?.userPhotoUrl) : null;
  const userId = isVideo ? video?.userId : image?.userId;
  const promptText = isVideo ? video?.description : image?.prompt;
  const modelUsed = isVideo ? video?.modelUsed : image?.model;
  const views = isVideo ? video?.views : undefined;
  const likes = isVideo ? video?.likes : undefined;

  // Is this the user's own content?
  const isOwnContent = user?.uid === userId;

  // Can user see the prompt?
  const canSeePrompt = isFree || localIsSaved || isOwnContent;

  useEffect(() => {
    setLocalIsSaved(isSaved);
  }, [isSaved]);

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && isVideo) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isOpen, isVideo]);

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

  const handleUnlockPrompt = async () => {
    if (!user || !item || !userId) {
      toast.error('Please sign in to unlock prompts');
      return;
    }

    if (isOwnContent) {
      toast.info('This is your own content');
      return;
    }

    if (isFree) {
      // Save free prompt
      setIsPurchasing(true);
      try {
        await saveFreePrompt({
          promptId: item.id,
          promptType: type,
          buyerId: user.uid,
          sellerId: userId,
          mediaUrl: mediaUrl || '',
          thumbnailUrl: thumbnailUrl || undefined,
          prompt: promptText || '',
          model: modelUsed as any,
          sellerUsername: username || undefined,
        });
        setLocalIsSaved(true);
        toast.success('Prompt saved to My Saved!');
        onSaveStatusChange?.();
      } catch (error) {
        console.error('Save error:', error);
        toast.error('Failed to save prompt');
      } finally {
        setIsPurchasing(false);
      }
    } else {
      // Show purchase confirmation
      setShowPurchaseDialog(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!user || !item || !userId || !userData) {
      toast.error('Please sign in to purchase prompts');
      return;
    }

    if ((userData.credits || 0) < (remixPrice || 0)) {
      toast.error('Insufficient credits');
      setShowPurchaseDialog(false);
      return;
    }

    setIsPurchasing(true);
    try {
      await purchasePrompt({
        promptId: item.id,
        promptType: type,
        buyerId: user.uid,
        sellerId: userId,
        creditCost: remixPrice || 0,
        mediaUrl: mediaUrl || '',
        thumbnailUrl: thumbnailUrl || undefined,
        prompt: promptText || '',
        model: modelUsed as any,
        sellerUsername: username || undefined,
      });
      setLocalIsSaved(true);
      setShowPurchaseDialog(false);
      toast.success('Prompt unlocked! Check My Saved.');
      onSaveStatusChange?.();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to purchase prompt');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRemoveFromSaved = async () => {
    if (!user || !item) return;

    try {
      await removeSavedPrompt(user.uid, item.id, type);
      setLocalIsSaved(false);
      toast.success('Removed from My Saved');
      onSaveStatusChange?.();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove from saved');
    }
  };

  const formatModelName = (model?: string) => {
    if (!model) return 'Unknown';
    const modelNames: Record<string, string> = {
      sora2: 'SORA 2',
      veo3: 'VEO 3',
      grok: 'GROK',
      wan26: 'WAN 2.6',
      seedance: 'SEEDANCE',
      kling26: 'KLING 2.6',
      'nano-banana-pro': 'Nano Banana Pro',
      midjourney: 'Midjourney',
      'fun-template': 'Fun Template',
    };
    return modelNames[model] || model.toUpperCase();
  };

  if (!item) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle>Prompt Details</SheetTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>

            {/* Media Preview */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-0">
              <div className="relative h-full w-full flex items-center justify-center">
                {isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={mediaUrl || undefined}
                      poster={thumbnailUrl || undefined}
                      className="max-w-full max-h-full object-contain"
                      playsInline
                      loop
                      onClick={togglePlay}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={togglePlay}
                    >
                      {!isPlaying && (
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <img
                    src={mediaUrl || thumbnailUrl || undefined}
                    alt="Prompt preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Content Info */}
            <div className="flex-shrink-0 p-4 space-y-4 border-t bg-background max-h-[40vh] overflow-y-auto">
              {/* User info and badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userPhotoUrl || undefined} />
                    <AvatarFallback>
                      {username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{username}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isFree ? (
                    <Badge className="bg-green-500 hover:bg-green-500 text-white">
                      FREE
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 hover:bg-red-500 text-white">
                      <Coins className="w-3 h-3 mr-1" />
                      {remixPrice} credits
                    </Badge>
                  )}
                  {localIsSaved && (
                    <Badge variant="secondary">
                      <BookmarkCheck className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats (for videos) */}
              {isVideo && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatCount(views || 0)} views
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {formatCount(likes || 0)} likes
                  </div>
                  <Badge variant="outline">{formatModelName(modelUsed)}</Badge>
                </div>
              )}

              {/* Prompt text */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Prompt</h4>
                {canSeePrompt ? (
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{promptText}</p>
                ) : (
                  <div className="relative">
                    <p className="text-sm bg-muted/50 p-3 rounded-lg blur-sm select-none">
                      {promptText?.slice(0, 100)}...
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                      <Lock className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Unlock to view prompt
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                {isOwnContent ? (
                  <Button disabled className="flex-1" variant="outline">
                    Your Content
                  </Button>
                ) : localIsSaved ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleRemoveFromSaved}
                    >
                      <BookmarkCheck className="w-4 h-4 mr-2" />
                      Remove from Saved
                    </Button>
                  </>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleUnlockPrompt}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isFree ? (
                      <Bookmark className="w-4 h-4 mr-2" />
                    ) : (
                      <Unlock className="w-4 h-4 mr-2" />
                    )}
                    {isFree ? 'Save Prompt' : `Unlock for ${remixPrice} credits`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Prompt</DialogTitle>
            <DialogDescription>
              This prompt costs {remixPrice} credits. You currently have{' '}
              {userData?.credits || 0} credits.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              After unlocking, this prompt will be saved to your &quot;My Saved&quot;
              collection and you&apos;ll have full access to the prompt text.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              disabled={isPurchasing || (userData?.credits || 0) < (remixPrice || 0)}
            >
              {isPurchasing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unlock for {remixPrice} credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
