'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Info, Clock, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useUserStore } from '@/stores/user-store';
import { useAuthStore } from '@/stores/auth-store';

const textToVideoSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500, 'Prompt must be less than 500 characters'),
  negativePrompt: z.string().max(200, 'Negative prompt must be less than 200 characters').optional(),
  model: z.string(),
  aspectRatio: z.string(),
  duration: z.number().min(3).max(15),
});

type TextToVideoFormData = z.infer<typeof textToVideoSchema>;

const models = [
  { id: 'sora-2', name: 'Sora 2', description: 'OpenAI\'s latest video model', credits: 30, badge: 'Popular' },
  { id: 'veo-3', name: 'Veo 3', description: 'Google\'s advanced video generation', credits: 35, badge: 'New' },
  { id: 'grok', name: 'Grok', description: 'xAI\'s video model', credits: 25 },
  { id: 'wan26', name: 'WAN 2.6', description: 'High quality artistic videos', credits: 20 },
  { id: 'seedance', name: 'Seedance', description: 'Motion-focused generation', credits: 20 },
];

const aspectRatios = [
  { id: '16:9', name: '16:9 Landscape', description: 'YouTube, TV' },
  { id: '9:16', name: '9:16 Portrait', description: 'TikTok, Reels' },
  { id: '1:1', name: '1:1 Square', description: 'Instagram' },
  { id: '4:3', name: '4:3 Standard', description: 'Classic format' },
];

export default function TextToVideoPage() {
  const { user } = useAuthStore();
  const { credits, checkGenerationLimit } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextToVideoFormData>({
    resolver: zodResolver(textToVideoSchema),
    defaultValues: {
      model: 'sora-2',
      aspectRatio: '16:9',
      duration: 5,
    },
  });

  const duration = watch('duration');
  const aspectRatio = watch('aspectRatio');

  const onSubmit = async (data: TextToVideoFormData) => {
    if (!user?.uid) {
      toast.error('Please sign in to generate videos.');
      return;
    }

    // Check generation limits
    const canGenerate = await checkGenerationLimit(user.uid);
    if (!canGenerate) {
      toast.error('Daily generation limit reached. Upgrade to Pro for more generations.');
      return;
    }

    // Check credits
    if (credits < selectedModel.credits) {
      toast.error(`Not enough credits. You need ${selectedModel.credits} credits for ${selectedModel.name}.`);
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Call Firebase Function to generate video
      toast.success('Video generation started! Check My Videos for progress.');

      // Simulate API call for now
      console.log('Generating video with:', data);

    } catch (error) {
      toast.error('Failed to start video generation. Please try again.');
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
          Transform your ideas into stunning videos with AI. Describe what you want to see and let AI do the magic.
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
                    placeholder="A majestic eagle soaring through golden clouds at sunset, cinematic lighting, 4K quality..."
                    className="min-h-[120px] resize-none"
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

                {/* Negative Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
                  <Input
                    id="negativePrompt"
                    placeholder="blurry, low quality, distorted, watermark..."
                    {...register('negativePrompt')}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you don't want in the video
                  </p>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>AI Model</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model);
                          setValue('model', model.id);
                        }}
                        className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50 ${
                          selectedModel.id === model.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.name}</span>
                              {model.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {model.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {model.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {model.credits} credits
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select
                    defaultValue="16:9"
                    onValueChange={(value) => setValue('aspectRatio', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          <div className="flex items-center gap-2">
                            <span>{ratio.name}</span>
                            <span className="text-xs text-muted-foreground">({ratio.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Duration</Label>
                    <span className="text-sm font-medium">{duration} seconds</span>
                  </div>
                  <Slider
                    defaultValue={[5]}
                    min={3}
                    max={15}
                    step={1}
                    onValueChange={(value) => setValue('duration', value[0])}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Longer videos use more credits
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isGenerating || credits < selectedModel.credits}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Video ({selectedModel.credits} credits)
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
              <div className="text-3xl font-bold text-primary">{credits}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {credits >= selectedModel.credits
                  ? `Enough for ${Math.floor(credits / selectedModel.credits)} generations`
                  : 'Not enough credits'}
              </p>
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
                <li>• Veo 3: 45-60 seconds</li>
                <li>• Other models: 30-60 seconds</li>
              </ul>
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
              <p>• Include camera movements like "slow zoom", "pan left"</p>
              <p>• Specify lighting: "golden hour", "dramatic shadows"</p>
              <p>• Add style keywords: "cinematic", "anime", "photorealistic"</p>
              <p>• Describe the mood: "peaceful", "intense", "mysterious"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
