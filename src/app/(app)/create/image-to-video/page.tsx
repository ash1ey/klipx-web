'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Sparkles, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useUserStore } from '@/stores/user-store';

const imageToVideoSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(300, 'Prompt must be less than 300 characters'),
  model: z.string(),
  motionStrength: z.number().min(1).max(10),
  duration: z.number().min(3).max(10),
});

type ImageToVideoFormData = z.infer<typeof imageToVideoSchema>;

const models = [
  { id: 'veo-3', name: 'Veo 3', description: 'Best for image animation', credits: 25, badge: 'Recommended' },
  { id: 'sora-2', name: 'Sora 2', description: 'High quality motion', credits: 30 },
  { id: 'wan26', name: 'WAN 2.6', description: 'Artistic animations', credits: 20 },
];

export default function ImageToVideoPage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ImageToVideoFormData>({
    resolver: zodResolver(imageToVideoSchema),
    defaultValues: {
      model: 'veo-3',
      motionStrength: 5,
      duration: 5,
    },
  });

  const motionStrength = watch('motionStrength');
  const duration = watch('duration');

  const onSubmit = async (data: ImageToVideoFormData) => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    if (credits < selectedModel.credits) {
      toast.error(`Not enough credits. You need ${selectedModel.credits} credits.`);
      return;
    }

    setIsGenerating(true);

    try {
      toast.success('Video generation started! Check My Videos for progress.');
      console.log('Generating video from image:', { ...data, image: imageFile?.name });
    } catch (error) {
      toast.error('Failed to start video generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImageFile(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Image to Video</h1>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
            <ImageIcon className="w-3 h-3 mr-1" />
            Animation
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Bring your images to life with AI-powered animation. Upload any image and describe the motion you want.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Source Image</CardTitle>
              <CardDescription>Upload the image you want to animate</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? 'Drop your image here'
                      : 'Drag & drop an image, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Animation Settings</CardTitle>
              <CardDescription>Configure how your image will be animated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Motion Description */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Motion Description *</Label>
                <Textarea
                  id="prompt"
                  placeholder="The camera slowly zooms in while the wind blows through the trees..."
                  className="min-h-[100px] resize-none"
                  {...register('prompt')}
                  disabled={isGenerating}
                />
                {errors.prompt && (
                  <p className="text-sm text-destructive">{errors.prompt.message}</p>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select
                  defaultValue="veo-3"
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
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({model.credits} credits)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Motion Strength */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Motion Strength</Label>
                  <span className="text-sm font-medium">{motionStrength}/10</span>
                </div>
                <Slider
                  defaultValue={[5]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setValue('motionStrength', value[0])}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = more dramatic motion
                </p>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm font-medium">{duration}s</span>
                </div>
                <Slider
                  defaultValue={[5]}
                  min={3}
                  max={10}
                  step={1}
                  onValueChange={(value) => setValue('duration', value[0])}
                  disabled={isGenerating}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90"
          disabled={isGenerating || !uploadedImage || credits < selectedModel.credits}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Animate Image ({selectedModel.credits} credits)
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
