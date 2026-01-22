'use client';

import { useState, useEffect } from 'react';
import { ImageJob } from '@/types';
import { X, Download, Share2, Loader2, Globe, Lock, Sparkles, Clock, Image as ImageIcon, AlertCircle, Settings, Coins } from 'lucide-react';
import { convertToFirebaseStorageUrl } from '@/lib/utils/storage-url';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useMyVideosStore } from '@/stores/my-videos-store';

interface ImageDetailModalProps {
  image: ImageJob | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrivacy?: (imageId: string, isPublic: boolean) => Promise<void>;
}

export function ImageDetailModal({ image, isOpen, onClose, onUpdatePrivacy }: ImageDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPublic, setIsPublic] = useState(image?.isPublic ?? true);
  const [allowRemix, setAllowRemix] = useState(image?.allowRemix ?? false);
  const [pricingType, setPricingType] = useState<'free' | 'paid'>(
    image?.remixPrice && image.remixPrice > 0 ? 'paid' : 'free'
  );
  const [remixPrice, setRemixPrice] = useState(image?.remixPrice ?? 5);
  const [isSaving, setIsSaving] = useState(false);

  const { updateImageSettings } = useMyVideosStore();

  // Reset state when image changes
  useEffect(() => {
    if (image) {
      setIsPublic(image.isPublic);
      setAllowRemix(image.allowRemix);
      setPricingType(image.remixPrice && image.remixPrice > 0 ? 'paid' : 'free');
      setRemixPrice(image.remixPrice ?? 5);
    }
  }, [image]);

  if (!image) return null;

  // Convert URL to proper Firebase Storage format
  const rawUrl = image.imageUrl || image.thumbnailUrl;
  const displayUrl = convertToFirebaseStorageUrl(rawUrl);

  const formatModelName = (model: string) => {
    const modelNames: Record<string, string> = {
      'nano-banana-pro': 'Nano Banana Pro',
      'midjourney': 'Midjourney',
      'fun-template': 'Fun Template',
    };
    return modelNames[model] || model.toUpperCase();
  };

  const handleDownload = async () => {
    if (!displayUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(displayUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klipx-image-${image.id}.${image.format || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!displayUrl) return;

    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this AI image!',
          text: image.prompt,
          url: displayUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(displayUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!onUpdatePrivacy) return;

    try {
      await onUpdatePrivacy(image.id, !image.isPublic);
      toast.success(image.isPublic ? 'Image is now private' : 'Image is now public');
      setShowPrivacyDialog(false);
    } catch (error) {
      console.error('Privacy update error:', error);
      toast.error('Failed to update privacy');
    }
  };

  const handleSaveSettings = async () => {
    if (!image) return;

    setIsSaving(true);
    try {
      const finalRemixPrice = allowRemix && pricingType === 'paid' ? remixPrice : null;
      await updateImageSettings(image.id, {
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

  const isProcessing = image.status !== 'complete' && image.status !== 'failed';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-pink-500" />
                Image Details
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Action buttons - fixed at top below header */}
          {image.status === 'complete' && (
            <div className="flex gap-2 p-4 border-b flex-shrink-0 bg-background">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 mr-2" />
                )}
                Share
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* Image display */}
            <div className="relative bg-black flex items-center justify-center min-h-[250px]">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-pink-500/30" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"
                      style={{ animationDuration: '2s' }}
                    />
                    <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {image.status === 'pending' ? '10%' : '50%'}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-pink-500/10 text-pink-500 mb-2">
                    {image.status === 'pending' ? 'In Queue' : 'Processing'}
                  </Badge>
                  <p className="text-muted-foreground text-sm text-center">
                    Your image is being generated...
                  </p>
                </div>
              ) : image.status === 'failed' ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <Badge className="bg-red-500/10 text-red-500 mb-2">Failed</Badge>
                  <p className="text-muted-foreground text-sm text-center">
                    {image.error || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              ) : displayUrl ? (
                <img
                  src={displayUrl}
                  alt="Generated image"
                  className="max-w-full max-h-[40vh] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Image details */}
            <div className="p-4 space-y-4">
              {/* Status badges */}
              {image.status === 'complete' && (
                <div className="flex items-center gap-2">
                  <Badge variant={image.isPublic ? 'default' : 'secondary'}>
                    {image.isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {image.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  {image.allowRemix && (
                    <Badge variant="outline">
                      <Coins className="w-3 h-3 mr-1" />
                      {image.remixPrice && image.remixPrice > 0 ? `${image.remixPrice} credits` : 'Free remix'}
                    </Badge>
                  )}
                </div>
              )}

              {/* Model */}
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium">{formatModelName(image.model)}</p>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="flex items-start gap-2">
                <ImageIcon className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                  <p className="text-sm font-medium">{image.aspectRatio}</p>
                </div>
              </div>

              {/* Prompt */}
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Prompt</p>
                  <p className="text-sm">{image.prompt}</p>
                </div>
              </div>

              {/* Credits used */}
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Credits Used</p>
                  <p className="text-sm font-medium">{image.creditsDeducted} credits</p>
                </div>
              </div>

              {/* Created date */}
              {image.createdAt && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {image.createdAt.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Privacy confirmation dialog */}
      <AlertDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {image.isPublic ? 'Make Private?' : 'Make Public?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {image.isPublic
                ? 'This image will be hidden from the Discover feed and only visible to you.'
                : 'This image will be visible to everyone in the Discover feed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePrivacyToggle}>
              {image.isPublic ? 'Make Private' : 'Make Public'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Settings</DialogTitle>
            <DialogDescription>
              Control who can see and use your image
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="public">Public</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can see this image in the Discover feed
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
                  Others can use this image&apos;s prompt
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
                    <RadioGroupItem value="free" id="img-pricing-free" />
                    <Label htmlFor="img-pricing-free" className="font-normal cursor-pointer">
                      Free - Anyone can use this prompt
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="img-pricing-paid" />
                    <Label htmlFor="img-pricing-paid" className="font-normal cursor-pointer">
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
