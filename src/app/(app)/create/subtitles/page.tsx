'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Subtitles, Upload, X, Download, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const languages = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'it', name: 'Italian' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'zh', name: 'Chinese' },
  { id: 'ja', name: 'Japanese' },
  { id: 'ko', name: 'Korean' },
  { id: 'ar', name: 'Arabic' },
  { id: 'hi', name: 'Hindi' },
  { id: 'ru', name: 'Russian' },
];

const subtitleStyles = [
  { id: 'default', name: 'Default', preview: 'White text, black outline' },
  { id: 'bold', name: 'Bold', preview: 'Large white text, strong outline' },
  { id: 'minimal', name: 'Minimal', preview: 'Small text, subtle shadow' },
  { id: 'caption', name: 'Caption Box', preview: 'Text on semi-transparent background' },
  { id: 'tiktok', name: 'TikTok Style', preview: 'Animated word-by-word highlight' },
];

export default function SubtitlesPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [style, setStyle] = useState('default');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [translateTo, setTranslateTo] = useState('es');
  const [processedVideo, setProcessedVideo] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setUploadedVideo(URL.createObjectURL(file));
      setProcessedVideo(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm', '.avi'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const removeVideo = () => {
    setUploadedVideo(null);
    setVideoFile(null);
    setProcessedVideo(null);
  };

  const handleProcess = async () => {
    if (!uploadedVideo) {
      toast.error('Please upload a video first');
      return;
    }

    setIsProcessing(true);
    setProcessedVideo(null);

    try {
      toast.info('Processing video... This may take a few minutes.');

      // Simulate processing
      setTimeout(() => {
        setProcessedVideo('/processed-video.mp4');
        setIsProcessing(false);
        toast.success('Subtitles added successfully!');
      }, 5000);
    } catch (error) {
      toast.error('Failed to process video. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Add Subtitles</h1>
          <Badge variant="secondary" className="bg-teal-500/10 text-teal-500">
            <Check className="w-3 h-3 mr-1" />
            FREE
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Automatically generate and add subtitles to any video. 100% free - no credits required!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Settings */}
        <div className="space-y-6">
          {/* Video Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>Upload the video you want to add subtitles to</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedVideo ? (
                <div className="relative">
                  <video
                    src={uploadedVideo}
                    className="w-full h-48 object-cover rounded-lg bg-black"
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
                  <div className="mt-2 text-sm text-muted-foreground">
                    {videoFile?.name} ({(videoFile?.size! / (1024 * 1024)).toFixed(1)} MB)
                  </div>
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
                    MP4, MOV, WebM up to 500MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Subtitle Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original Language */}
              <div className="space-y-2">
                <Label>Video Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  The language spoken in the video
                </p>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label>Subtitle Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subtitleStyles.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div>
                          <span>{s.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            - {s.preview}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-Translate Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Translate</Label>
                  <p className="text-xs text-muted-foreground">
                    Translate subtitles to another language
                  </p>
                </div>
                <Switch
                  checked={autoTranslate}
                  onCheckedChange={setAutoTranslate}
                />
              </div>

              {/* Translation Language */}
              {autoTranslate && (
                <div className="space-y-2">
                  <Label>Translate To</Label>
                  <Select value={translateTo} onValueChange={setTranslateTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages
                        .filter((l) => l.id !== language)
                        .map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Preview & Download</CardTitle>
            <CardDescription>Your subtitled video will appear here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {processedVideo ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <video
                    src={processedVideo}
                    className="w-full h-full rounded-lg"
                    controls
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-teal-500 hover:bg-teal-600">
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Download SRT File
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Video with embedded subtitles + separate SRT file
                </p>
              </div>
            ) : (
              <div className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Subtitles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isProcessing
                      ? 'Processing your video...'
                      : 'Upload a video to get started'}
                  </p>
                  {isProcessing && (
                    <div className="mt-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Process Button */}
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:opacity-90"
              onClick={handleProcess}
              disabled={isProcessing || !uploadedVideo}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Subtitles className="mr-2 h-5 w-5" />
                  Add Subtitles (FREE)
                </>
              )}
            </Button>

            {/* Info */}
            <div className="p-4 bg-teal-500/10 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Why is this free?</h4>
              <p className="text-xs text-muted-foreground">
                We believe everyone should have access to subtitles. This feature helps make content more accessible and is our way of giving back to creators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
