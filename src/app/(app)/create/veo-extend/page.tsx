'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Layers, Upload, X, Play, ArrowRight } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useUserStore } from '@/stores/user-store';

const veoExtendSchema = z.object({
  prompt: z.string().max(300).optional(),
  extendDirection: z.enum(['forward', 'backward', 'both']),
  duration: z.number().min(2).max(10),
});

type VeoExtendFormData = z.infer<typeof veoExtendSchema>;

const creditCost = 20;

export default function VeoExtendPage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setUploadedVideo(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VeoExtendFormData>({
    resolver: zodResolver(veoExtendSchema),
    defaultValues: {
      extendDirection: 'forward',
      duration: 5,
    },
  });

  const duration = watch('duration');
  const extendDirection = watch('extendDirection');

  const onSubmit = async (data: VeoExtendFormData) => {
    if (!uploadedVideo) {
      toast.error('Please upload a video first');
      return;
    }

    if (credits < creditCost) {
      toast.error(`Not enough credits. You need ${creditCost} credits.`);
      return;
    }

    setIsGenerating(true);

    try {
      toast.success('Video extension started! Check My Videos for progress.');
      console.log('Extending video:', { ...data, video: videoFile?.name });
    } catch (error) {
      toast.error('Failed to extend video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const removeVideo = () => {
    setUploadedVideo(null);
    setVideoFile(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Veo Extend</h1>
          <Badge variant="secondary" className="bg-red-500/10 text-red-500">
            <Layers className="w-3 h-3 mr-1" />
            Extension
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Extend your videos seamlessly with Google's Veo model. Add more content before or after your existing video.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Source Video</CardTitle>
              <CardDescription>Upload the video you want to extend</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedVideo ? (
                <div className="relative">
                  <video
                    src={uploadedVideo}
                    className="w-full h-64 object-cover rounded-lg bg-black"
                    controls
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeVideo}
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
                      ? 'Drop your video here'
                      : 'Drag & drop a video, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    MP4, MOV, WebM up to 100MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extension Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Extension Settings</CardTitle>
              <CardDescription>Configure how to extend your video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Extension Direction */}
              <div className="space-y-2">
                <Label>Extend Direction</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'backward', label: 'Before', icon: '←' },
                    { id: 'forward', label: 'After', icon: '→' },
                    { id: 'both', label: 'Both', icon: '↔' },
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setValue('extendDirection', option.id as 'forward' | 'backward' | 'both')}
                      className={`cursor-pointer rounded-lg border p-4 text-center transition-all hover:border-primary/50 ${
                        extendDirection === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Extension Length</Label>
                  <span className="text-sm font-medium">{duration} seconds</span>
                </div>
                <Slider
                  defaultValue={[5]}
                  min={2}
                  max={10}
                  step={1}
                  onValueChange={(value) => setValue('duration', value[0])}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  {extendDirection === 'both'
                    ? `${duration}s will be added to each side (${duration * 2}s total)`
                    : `${duration}s will be added ${extendDirection === 'forward' ? 'after' : 'before'} your video`
                  }
                </p>
              </div>

              {/* Optional Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Guidance Prompt (Optional)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what should happen in the extended portion..."
                  className="min-h-[80px] resize-none"
                  {...register('prompt')}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to let AI continue naturally
                </p>
              </div>

              {/* Preview Visual */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Result Preview:</p>
                <div className="flex items-center gap-2">
                  {extendDirection !== 'forward' && (
                    <div className="h-8 bg-red-500/30 rounded flex-shrink-0 flex items-center justify-center px-3">
                      <span className="text-xs">+{duration}s</span>
                    </div>
                  )}
                  <div className="h-8 bg-primary/30 rounded flex-1 flex items-center justify-center">
                    <span className="text-xs">Original Video</span>
                  </div>
                  {extendDirection !== 'backward' && (
                    <div className="h-8 bg-red-500/30 rounded flex-shrink-0 flex items-center justify-center px-3">
                      <span className="text-xs">+{duration}s</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90"
          disabled={isGenerating || !uploadedVideo || credits < creditCost}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Extending Video...
            </>
          ) : (
            <>
              <Layers className="mr-2 h-5 w-5" />
              Extend Video ({creditCost} credits)
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
