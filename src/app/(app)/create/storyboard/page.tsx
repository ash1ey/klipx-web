'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, LayoutTemplate, Plus, Trash2, GripVertical, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user-store';

interface Scene {
  id: string;
  prompt: string;
  duration: number;
  transition: string;
}

const transitions = [
  { id: 'cut', name: 'Cut' },
  { id: 'fade', name: 'Fade' },
  { id: 'dissolve', name: 'Dissolve' },
  { id: 'wipe', name: 'Wipe' },
  { id: 'zoom', name: 'Zoom' },
];

const creditCost = 50;

export default function StoryboardPage() {
  const { credits } = useUserStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', prompt: '', duration: 5, transition: 'fade' },
    { id: '2', prompt: '', duration: 5, transition: 'fade' },
  ]);

  const addScene = () => {
    if (scenes.length >= 10) {
      toast.error('Maximum 10 scenes allowed');
      return;
    }
    setScenes([
      ...scenes,
      { id: Date.now().toString(), prompt: '', duration: 5, transition: 'fade' },
    ]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 2) {
      toast.error('Minimum 2 scenes required');
      return;
    }
    setScenes(scenes.filter((s) => s.id !== id));
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes(scenes.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= scenes.length) return;

    const newScenes = [...scenes];
    [newScenes[index], newScenes[newIndex]] = [newScenes[newIndex], newScenes[index]];
    setScenes(newScenes);
  };

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const handleGenerate = async () => {
    // Validate
    const emptyScenes = scenes.filter((s) => !s.prompt.trim());
    if (emptyScenes.length > 0) {
      toast.error('Please fill in all scene prompts');
      return;
    }

    if (credits < creditCost) {
      toast.error(`Not enough credits. You need ${creditCost} credits.`);
      return;
    }

    setIsGenerating(true);

    try {
      toast.success('Storyboard generation started! Check My Videos for progress.');
      console.log('Generating storyboard:', { projectName, scenes });
    } catch (error) {
      toast.error('Failed to generate storyboard. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Storyboard</h1>
          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500">
            <LayoutTemplate className="w-3 h-3 mr-1" />
            Multi-Scene
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Create multi-scene videos with custom prompts for each scene. Perfect for narratives and complex projects.
        </p>
      </div>

      {/* Project Name */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My Storyboard Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scenes */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scenes ({scenes.length}/10)</h2>
          <div className="text-sm text-muted-foreground">
            Total Duration: {totalDuration}s
          </div>
        </div>

        {scenes.map((scene, index) => (
          <Card key={scene.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <CardTitle className="text-base">Scene {index + 1}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveScene(index, 'up')}
                    disabled={index === 0 || isGenerating}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveScene(index, 'down')}
                    disabled={index === scenes.length - 1 || isGenerating}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeScene(scene.id)}
                    disabled={scenes.length <= 2 || isGenerating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scene Prompt */}
              <div className="space-y-2">
                <Label>Scene Description *</Label>
                <Textarea
                  placeholder="Describe what happens in this scene..."
                  className="min-h-[80px] resize-none"
                  value={scene.prompt}
                  onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                  disabled={isGenerating}
                />
              </div>

              {/* Duration & Transition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={scene.duration.toString()}
                    onValueChange={(value) => updateScene(scene.id, { duration: parseInt(value) })}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8].map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {d} seconds
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transition to Next</Label>
                  <Select
                    value={scene.transition}
                    onValueChange={(value) => updateScene(scene.id, { transition: value })}
                    disabled={isGenerating || index === scenes.length - 1}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transitions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Scene Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={addScene}
          disabled={scenes.length >= 10 || isGenerating}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Scene
        </Button>
      </div>

      {/* Summary & Generate */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Project Summary</p>
              <p className="text-sm text-muted-foreground">
                {scenes.length} scenes • {totalDuration} seconds total
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{creditCost}</p>
              <p className="text-xs text-muted-foreground">credits</p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
            onClick={handleGenerate}
            disabled={isGenerating || credits < creditCost}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Storyboard...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Storyboard
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
