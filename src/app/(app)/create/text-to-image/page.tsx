'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Download, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user-store';

const textToImageSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(500, 'Prompt must be less than 500 characters'),
  negativePrompt: z.string().max(200).optional(),
  model: z.string(),
  style: z.string(),
  aspectRatio: z.string(),
  quantity: z.number().min(1).max(4),
});

type TextToImageFormData = z.infer<typeof textToImageSchema>;

const models = [
  { id: 'flux-pro', name: 'FLUX Pro', description: 'Highest quality', credits: 10 },
  { id: 'flux-schnell', name: 'FLUX Schnell', description: 'Fast generation', credits: 5 },
  { id: 'sdxl', name: 'SDXL', description: 'Stable Diffusion XL', credits: 5 },
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'OpenAI', credits: 15 },
];

const styles = [
  { id: 'photorealistic', name: 'Photorealistic' },
  { id: 'anime', name: 'Anime' },
  { id: 'digital-art', name: 'Digital Art' },
  { id: 'oil-painting', name: 'Oil Painting' },
  { id: 'watercolor', name: 'Watercolor' },
  { id: '3d-render', name: '3D Render' },
  { id: 'pixel-art', name: 'Pixel Art' },
  { id: 'cinematic', name: 'Cinematic' },
];

const aspectRatios = [
  { id: '1:1', name: '1:1 Square' },
  { id: '16:9', name: '16:9 Landscape' },
  { id: '9:16', name: '9:16 Portrait' },
  { id: '4:3', name: '4:3 Standard' },
  { id: '3:4', name: '3:4 Vertical' },
];

export default function TextToImagePage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextToImageFormData>({
    resolver: zodResolver(textToImageSchema),
    defaultValues: {
      model: 'flux-pro',
      style: 'photorealistic',
      aspectRatio: '1:1',
      quantity: 1,
    },
  });

  const quantity = watch('quantity');
  const totalCredits = selectedModel.credits * quantity;

  const onSubmit = async (data: TextToImageFormData) => {
    if (credits < totalCredits) {
      toast.error(`Not enough credits. You need ${totalCredits} credits.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      toast.success('Image generation started!');
      // TODO: Implement actual generation
      console.log('Generating images:', data);

      // Simulate generated images for demo
      setTimeout(() => {
        setGeneratedImages([
          '/placeholder-image-1.jpg',
          '/placeholder-image-2.jpg',
        ]);
        setIsGenerating(false);
      }, 3000);
    } catch (error) {
      toast.error('Failed to generate images. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Text to Image</h1>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            <Sparkles className="w-3 h-3 mr-1" />
            Fast
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate beautiful images from text descriptions using the latest AI models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
            <CardDescription>Describe what you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  placeholder="A beautiful sunset over mountains with a lake reflection..."
                  className="min-h-[100px] resize-none"
                  {...register('prompt')}
                  disabled={isGenerating}
                />
                {errors.prompt && (
                  <p className="text-sm text-destructive">{errors.prompt.message}</p>
                )}
              </div>

              {/* Negative Prompt */}
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt</Label>
                <Input
                  id="negativePrompt"
                  placeholder="blurry, low quality, distorted..."
                  {...register('negativePrompt')}
                  disabled={isGenerating}
                />
              </div>

              {/* Model & Style Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    defaultValue="flux-pro"
                    onValueChange={(value) => {
                      const model = models.find((m) => m.id === value);
                      if (model) {
                        setSelectedModel(model);
                        setValue('model', value);
                      }
                    }}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select
                    defaultValue="photorealistic"
                    onValueChange={(value) => setValue('style', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aspect Ratio & Quantity Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select
                    defaultValue="1:1"
                    onValueChange={(value) => setValue('aspectRatio', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Select
                    defaultValue="1"
                    onValueChange={(value) => setValue('quantity', parseInt(value))}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} image{num > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                disabled={isGenerating || credits < totalCredits}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate ({totalCredits} credits)
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Images */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
            <CardDescription>Your creations will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-muted-foreground">Image {index + 1}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground text-center">
                  {isGenerating
                    ? 'Generating your images...'
                    : 'Generated images will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
