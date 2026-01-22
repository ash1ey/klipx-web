'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Info, Clock, Zap, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  generateVideo,
  VIDEO_MODELS,
  MULTISHOT_CONFIG,
  ModelConfig,
  getDefaultDuration,
  getDefaultAspectRatio,
  getDefaultResolution,
  getDefaultMode,
} from '@/lib/services/video-generation-service';
import { AIModel } from '@/types';

const textToVideoSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(8000, 'Prompt must be less than 8000 characters'),
});

type TextToVideoFormData = z.infer<typeof textToVideoSchema>;

export default function TextToVideoPage() {
  const { user } = useAuthStore();
  const { credits, refreshCredits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Model state
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(VIDEO_MODELS[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(VIDEO_MODELS[0].durations[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(
    getDefaultAspectRatio(VIDEO_MODELS[0])
  );
  const [selectedResolution, setSelectedResolution] = useState<string>(getDefaultResolution());
  const [selectedMode, setSelectedMode] = useState<string>(getDefaultMode());
  const [isMultiShot, setIsMultiShot] = useState(false);
  const [showMultiShotDialog, setShowMultiShotDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<TextToVideoFormData>({
    resolver: zodResolver(textToVideoSchema),
    defaultValues: {
      prompt: '',
    },
  });

  // Reset options when model changes
  useEffect(() => {
    setSelectedDuration(getDefaultDuration(selectedModel));
    setSelectedAspectRatio(getDefaultAspectRatio(selectedModel));
    if (selectedModel.id === 'seedance') {
      setSelectedResolution(getDefaultResolution());
    }
    if (selectedModel.id === 'grok') {
      setSelectedMode(getDefaultMode());
    }
  }, [selectedModel]);

  // Calculate current cost
  const calculateCost = (): number => {
    if (isMultiShot) {
      return MULTISHOT_CONFIG.totalCost;
    }
    return selectedModel.getCost(selectedDuration, selectedResolution);
  };

  const currentCost = calculateCost();

  // Handle Multi-Shot selection
  const handleMultiShotClick = () => {
    if (isMultiShot) {
      // Deselect multi-shot, go back to first model
      setIsMultiShot(false);
      setSelectedModel(VIDEO_MODELS[0]);
    } else {
      // Show confirmation dialog
      setShowMultiShotDialog(true);
    }
  };

  const confirmMultiShot = () => {
    setIsMultiShot(true);
    setShowMultiShotDialog(false);
  };

  const onSubmit = async (data: TextToVideoFormData) => {
    if (!user?.uid) {
      toast.error('Please sign in to generate videos.');
      return;
    }

    // Check credits
    if ((credits ?? 0) < currentCost) {
      toast.error(`Not enough credits. You need ${currentCost} credits.`);
      return;
    }

    setIsGenerating(true);

    try {
      if (isMultiShot) {
        // Generate with all 5 models
        const multiShotPromises = [
          generateVideo({
            type: 'text-to-video',
            prompt: data.prompt,
            model: 'sora2',
            duration: 10,
            aspectRatio: '9:16',
          }),
          generateVideo({
            type: 'text-to-video',
            prompt: data.prompt,
            model: 'veo3',
            duration: 8,
            aspectRatio: '9:16',
          }),
          generateVideo({
            type: 'text-to-video',
            prompt: data.prompt,
            model: 'grok',
            duration: 6,
            aspectRatio: '2:3',
            mode: 'normal',
          }),
          generateVideo({
            type: 'text-to-video',
            prompt: data.prompt,
            model: 'wan26',
            duration: 5,
            aspectRatio: '9:16',
          }),
          generateVideo({
            type: 'text-to-video',
            prompt: data.prompt,
            model: 'seedance',
            duration: 5,
            aspectRatio: '9:16',
            resolution: '480p',
          }),
        ];

        await Promise.all(multiShotPromises);
        toast.success('Multi-Shot started! 5 videos are being generated. Check My Files for progress.');
      } else {
        // Single model generation
        const result = await generateVideo({
          type: 'text-to-video',
          prompt: data.prompt,
          model: selectedModel.id as AIModel,
          duration: selectedDuration,
          aspectRatio: selectedAspectRatio,
          resolution: selectedModel.id === 'seedance' ? (selectedResolution as '480p' | '720p' | '1080p') : undefined,
          mode: selectedModel.id === 'grok' ? (selectedMode as 'normal' | 'fun') : undefined,
        });

        if (result.success) {
          toast.success('Video generation started! Check My Files for progress.');
        }
      }

      // Refresh credits after successful generation
      if (user.uid) {
        refreshCredits(user.uid);
      }
    } catch (error: unknown) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start video generation';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Text to Video</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Transform your ideas into stunning videos with AI. Describe what you want to see and let AI
          do the magic.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Prompt</CardTitle>
              <CardDescription>Describe the video you want to create in detail</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your scene in detail: characters, setting, actions, mood, lighting..."
                    className="min-h-[150px] resize-none"
                    {...register('prompt')}
                    disabled={isGenerating}
                  />
                  {errors.prompt && (
                    <p className="text-sm text-destructive">{errors.prompt.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tip: Be specific about style, lighting, camera movement, and mood
                  </p>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VIDEO_MODELS.map((model) => (
                      <div
                        key={model.id}
                        onClick={() => {
                          if (!isGenerating) {
                            setIsMultiShot(false);
                            setSelectedModel(model);
                          }
                        }}
                        className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 ${
                          !isMultiShot && selectedModel.id === model.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.name}</span>
                              {model.badge && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${
                                    model.badge === 'New'
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {model.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Multi-Shot Option */}
                    <div
                      onClick={() => !isGenerating && handleMultiShotClick()}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 ${
                        isMultiShot ? 'border-primary bg-primary/5' : 'border-border'
                      } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span className="font-medium">{MULTISHOT_CONFIG.name}</span>
                            <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500">
                              5 in 1
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {MULTISHOT_CONFIG.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {MULTISHOT_CONFIG.totalCost} credits
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration Selection (if model has multiple durations) */}
                {!isMultiShot && selectedModel.durations.length > 1 && (
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.durations.map((duration) => (
                        <Button
                          key={duration}
                          type="button"
                          variant={selectedDuration === duration ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedDuration(duration)}
                          disabled={isGenerating}
                        >
                          {duration}s
                          <span className="ml-1 text-xs opacity-70">
                            ({selectedModel.getCost(duration, selectedResolution)} credits)
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fixed Duration Display (if model has single duration) */}
                {!isMultiShot && selectedModel.durations.length === 1 && (
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <p className="text-sm text-muted-foreground">
                      Fixed at {selectedModel.durations[0]} seconds for {selectedModel.name}
                    </p>
                  </div>
                )}

                {/* Aspect Ratio Selection */}
                {!isMultiShot && selectedModel.aspectRatios && selectedModel.aspectRatios.length > 0 && (
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.aspectRatios.map((ratio) => (
                        <Button
                          key={ratio}
                          type="button"
                          variant={selectedAspectRatio === ratio ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedAspectRatio(ratio)}
                          disabled={isGenerating}
                        >
                          {ratio}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution Selection (Seedance only) */}
                {!isMultiShot && selectedModel.id === 'seedance' && selectedModel.resolutions && (
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.resolutions.map((resolution) => (
                        <Button
                          key={resolution}
                          type="button"
                          variant={selectedResolution === resolution ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedResolution(resolution)}
                          disabled={isGenerating}
                        >
                          {resolution}
                          <span className="ml-1 text-xs opacity-70">
                            ({selectedModel.getCost(selectedDuration, resolution)} credits)
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Selection (Grok only) */}
                {!isMultiShot && selectedModel.id === 'grok' && selectedModel.modes && (
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.modes.map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={selectedMode === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedMode(mode)}
                          disabled={isGenerating}
                          className="capitalize"
                        >
                          {mode}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedMode === 'fun'
                        ? 'Fun mode creates more creative and playful videos'
                        : 'Normal mode creates realistic and natural videos'}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isGenerating || (credits ?? 0) < currentCost}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate {isMultiShot ? 'Multi-Shot' : 'Video'} ({currentCost} credits)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Credits Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Your Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{credits ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {(credits ?? 0) >= currentCost
                  ? `Enough for ${Math.floor((credits ?? 0) / currentCost)} generation${
                      Math.floor((credits ?? 0) / currentCost) !== 1 ? 's' : ''
                    }`
                  : 'Not enough credits'}
              </p>
              <div className="mt-3 p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Current selection: {currentCost} credits
                </p>
                <p className="text-xs text-muted-foreground">
                  {isMultiShot
                    ? 'Multi-Shot (5 models)'
                    : `${selectedModel.name} - ${selectedDuration}s`}
                  {selectedModel.id === 'seedance' && !isMultiShot && ` @ ${selectedResolution}`}
                </p>
              </div>
              <Button variant="outline" className="w-full mt-4" size="sm">
                Buy More Credits
              </Button>
            </CardContent>
          </Card>

          {/* Generation Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Generation Time
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Typical generation time:</p>
              <ul className="mt-2 space-y-1">
                <li>• Sora 2: 60-90 seconds</li>
                <li>• Veo 3.1: 45-60 seconds</li>
                <li>• Grok: 30-45 seconds</li>
                <li>• Wan 2.6: 60-120 seconds</li>
                <li>• Seedance: 30-60 seconds</li>
              </ul>
              {selectedModel.id === 'sora2' && selectedDuration === 15 && (
                <p className="mt-2 text-xs text-yellow-500">
                  Note: 15s Sora 2 videos can take up to 10 minutes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Include camera movements like &quot;slow zoom&quot;, &quot;pan left&quot;</p>
              <p>• Specify lighting: &quot;golden hour&quot;, &quot;dramatic shadows&quot;</p>
              <p>• Add style keywords: &quot;cinematic&quot;, &quot;anime&quot;, &quot;photorealistic&quot;</p>
              <p>• Describe the mood: &quot;peaceful&quot;, &quot;intense&quot;, &quot;mysterious&quot;</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Shot Confirmation Dialog */}
      <Dialog open={showMultiShotDialog} onOpenChange={setShowMultiShotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Multi-Shot Mode?</DialogTitle>
            <DialogDescription>
              This will generate your video with all 5 AI models at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-sm font-medium">Cost breakdown:</p>
            <div className="space-y-2">
              {MULTISHOT_CONFIG.breakdown.map((item) => (
                <div key={item.model} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.model}</span>
                  <span>{item.cost} credits</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span className="text-primary">{MULTISHOT_CONFIG.totalCost} credits</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMultiShotDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMultiShot} disabled={(credits ?? 0) < MULTISHOT_CONFIG.totalCost}>
              {(credits ?? 0) >= MULTISHOT_CONFIG.totalCost
                ? 'Enable Multi-Shot'
                : `Need ${MULTISHOT_CONFIG.totalCost - (credits ?? 0)} more credits`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
