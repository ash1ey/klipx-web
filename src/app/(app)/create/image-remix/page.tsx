'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Wand2, Upload, X, Plus, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useUserStore } from '@/stores/user-store';

const imageRemixSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(300),
  style: z.string(),
  strength: z.number().min(0).max(100),
});

type ImageRemixFormData = z.infer<typeof imageRemixSchema>;

const styles = [
  { id: 'blend', name: 'Blend', description: 'Seamlessly merge images' },
  { id: 'morph', name: 'Morph', description: 'Transform between images' },
  { id: 'collage', name: 'Collage', description: 'Artistic composition' },
  { id: 'style-transfer', name: 'Style Transfer', description: 'Apply style from one to another' },
];

const creditCost = 12;

export default function ImageRemixPage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ id: string; url: string; file: File }[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const newImages = acceptedFiles.map((file) => ({
      id: Date.now().toString() + Math.random(),
      url: URL.createObjectURL(file),
      file,
    }));

    setUploadedImages([...uploadedImages, ...newImages]);
  }, [uploadedImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 4,
    maxSize: 10 * 1024 * 1024,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImageRemixFormData>({
    resolver: zodResolver(imageRemixSchema),
    defaultValues: {
      style: 'blend',
      strength: 50,
    },
  });

  const strength = watch('strength');

  const removeImage = (id: string) => {
    setUploadedImages(uploadedImages.filter((img) => img.id !== id));
  };

  const onSubmit = async (data: ImageRemixFormData) => {
    if (uploadedImages.length < 2) {
      toast.error('Please upload at least 2 images');
      return;
    }

    if (credits < creditCost) {
      toast.error(`Not enough credits. You need ${creditCost} credits.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      toast.success('Remix generation started!');
      console.log('Remixing images:', { ...data, images: uploadedImages.map((i) => i.file.name) });

      // Simulate generation
      setTimeout(() => {
        setGeneratedImage('/placeholder-remix.jpg');
        setIsGenerating(false);
        toast.success('Your remix is ready!');
      }, 4000);
    } catch (error) {
      toast.error('Failed to generate remix. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Image Remix</h1>
          <Badge variant="secondary" className="bg-pink-500/10 text-pink-500">
            <Wand2 className="w-3 h-3 mr-1" />
            Creative
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Combine and transform multiple images into something new with AI magic.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Source Images</CardTitle>
                <CardDescription>Upload 2-4 images to remix together</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Uploaded Images Grid */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt="Uploaded"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage(img.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop Zone */}
                {uploadedImages.length < 4 && (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Add image ({uploadedImages.length}/4)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Remix Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Remix Description *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Combine these images into a surreal dreamscape..."
                    className="min-h-[80px] resize-none"
                    {...register('prompt')}
                    disabled={isGenerating}
                  />
                  {errors.prompt && (
                    <p className="text-sm text-destructive">{errors.prompt.message}</p>
                  )}
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label>Remix Style</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map((style) => (
                      <div
                        key={style.id}
                        onClick={() => setValue('style', style.id)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 ${
                          watch('style') === style.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="font-medium text-sm">{style.name}</div>
                        <div className="text-xs text-muted-foreground">{style.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strength */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Transform Strength</Label>
                    <span className="text-sm font-medium">{strength}%</span>
                  </div>
                  <Slider
                    defaultValue={[50]}
                    min={0}
                    max={100}
                    step={10}
                    onValueChange={(value) => setValue('strength', value[0])}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = more creative transformation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>Your remixed image will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Remixed Image</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Use in Video
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {isGenerating
                        ? 'Creating your remix...'
                        : 'Upload images and click remix'}
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full mt-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90"
                disabled={isGenerating || uploadedImages.length < 2 || credits < creditCost}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Remixing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Remix Images ({creditCost} credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
