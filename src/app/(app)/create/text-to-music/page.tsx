'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Music, Play, Pause, Download, Volume2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useUserStore } from '@/stores/user-store';

const textToMusicSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(300, 'Prompt must be less than 300 characters'),
  lyrics: z.string().max(1000).optional(),
  genre: z.string(),
  mood: z.string(),
  duration: z.number().min(30).max(180),
  hasVocals: z.boolean(),
  vocalGender: z.string().optional(),
});

type TextToMusicFormData = z.infer<typeof textToMusicSchema>;

const genres = [
  'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 'Jazz', 'Classical',
  'Country', 'Indie', 'Lo-Fi', 'Ambient', 'Cinematic', 'Folk', 'Metal',
];

const moods = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Dark', 'Uplifting',
  'Mysterious', 'Aggressive', 'Dreamy', 'Nostalgic', 'Epic', 'Peaceful',
];

export default function TextToMusicPage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<string | null>(null);

  const creditCost = 15;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TextToMusicFormData>({
    resolver: zodResolver(textToMusicSchema),
    defaultValues: {
      genre: 'Pop',
      mood: 'Happy',
      duration: 60,
      hasVocals: false,
    },
  });

  const duration = watch('duration');
  const hasVocals = watch('hasVocals');

  const onSubmit = async (data: TextToMusicFormData) => {
    if (credits < creditCost) {
      toast.error(`Not enough credits. You need ${creditCost} credits.`);
      return;
    }

    setIsGenerating(true);
    setGeneratedTrack(null);

    try {
      toast.success('Music generation started!');
      console.log('Generating music:', data);

      // Simulate generation
      setTimeout(() => {
        setGeneratedTrack('/sample-track.mp3');
        setIsGenerating(false);
        toast.success('Your music is ready!');
      }, 5000);
    } catch (error) {
      toast.error('Failed to generate music. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Text to Music</h1>
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
            <Music className="w-3 h-3 mr-1" />
            AI Vocals
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Create original music tracks with AI. Add lyrics for vocal tracks or generate pure instrumentals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Music Settings</CardTitle>
            <CardDescription>Describe the music you want to create</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Description *</Label>
                <Textarea
                  id="prompt"
                  placeholder="An upbeat summer pop song with catchy melodies and a driving beat..."
                  className="min-h-[80px] resize-none"
                  {...register('prompt')}
                  disabled={isGenerating}
                />
                {errors.prompt && (
                  <p className="text-sm text-destructive">{errors.prompt.message}</p>
                )}
              </div>

              {/* Genre & Mood */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select
                    defaultValue="Pop"
                    onValueChange={(value) => setValue('genre', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select
                    defaultValue="Happy"
                    onValueChange={(value) => setValue('mood', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm font-medium">{duration}s ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})</span>
                </div>
                <Slider
                  defaultValue={[60]}
                  min={30}
                  max={180}
                  step={15}
                  onValueChange={(value) => setValue('duration', value[0])}
                  disabled={isGenerating}
                />
              </div>

              {/* Vocals Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Add Vocals</Label>
                  <p className="text-xs text-muted-foreground">
                    Include AI-generated singing
                  </p>
                </div>
                <Switch
                  checked={hasVocals}
                  onCheckedChange={(checked) => setValue('hasVocals', checked)}
                  disabled={isGenerating}
                />
              </div>

              {/* Vocal Gender (if vocals enabled) */}
              {hasVocals && (
                <div className="space-y-2">
                  <Label>Vocal Type</Label>
                  <Select
                    defaultValue="female"
                    onValueChange={(value) => setValue('vocalGender', value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female Voice</SelectItem>
                      <SelectItem value="male">Male Voice</SelectItem>
                      <SelectItem value="duet">Duet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Lyrics (if vocals enabled) */}
              {hasVocals && (
                <div className="space-y-2">
                  <Label htmlFor="lyrics">Lyrics (Optional)</Label>
                  <Textarea
                    id="lyrics"
                    placeholder="Verse 1:&#10;Walking down the street today...&#10;&#10;Chorus:&#10;This is my moment..."
                    className="min-h-[120px] resize-none font-mono text-sm"
                    {...register('lyrics')}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for AI-generated lyrics
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:opacity-90"
                disabled={isGenerating || credits < creditCost}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Music className="mr-2 h-5 w-5" />
                    Generate Music ({creditCost} credits)
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview / Generated Track */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Track</CardTitle>
            <CardDescription>Preview and download your music</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedTrack ? (
              <div className="space-y-6">
                {/* Waveform Placeholder */}
                <div className="h-32 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="w-1/3 h-full bg-primary rounded-full" />
                  </div>
                  <span className="text-sm text-muted-foreground w-16">
                    0:00 / 1:00
                  </span>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider defaultValue={[75]} max={100} className="flex-1" />
                </div>

                {/* Download Button */}
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Track
                </Button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <div className="text-center">
                  <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isGenerating
                      ? 'Creating your music...'
                      : 'Your generated track will appear here'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
