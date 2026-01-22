'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, Play, Sparkles, TrendingUp, Star, Clock, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  usageCount: number;
  credits: number;
  duration: string;
  isHot: boolean;
  isNew: boolean;
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'trending', name: 'Trending' },
  { id: 'ai-dance', name: 'AI Dance' },
  { id: 'memes', name: 'Memes' },
  { id: 'product', name: 'Product' },
  { id: 'social', name: 'Social Media' },
  { id: 'storytelling', name: 'Storytelling' },
  { id: 'educational', name: 'Educational' },
];

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'AI Dance Trend',
    description: 'Make anyone dance to viral music',
    category: 'ai-dance',
    thumbnail: '/templates/dance.jpg',
    usageCount: 125000,
    credits: 15,
    duration: '15s',
    isHot: true,
    isNew: false,
  },
  {
    id: '2',
    name: 'Product Showcase',
    description: 'Professional product reveal animation',
    category: 'product',
    thumbnail: '/templates/product.jpg',
    usageCount: 89000,
    credits: 20,
    duration: '30s',
    isHot: false,
    isNew: true,
  },
  {
    id: '3',
    name: 'Meme Generator',
    description: 'Create viral meme videos instantly',
    category: 'memes',
    thumbnail: '/templates/meme.jpg',
    usageCount: 200000,
    credits: 10,
    duration: '10s',
    isHot: true,
    isNew: false,
  },
  {
    id: '4',
    name: 'Story Narrator',
    description: 'AI narrated story with visuals',
    category: 'storytelling',
    thumbnail: '/templates/story.jpg',
    usageCount: 45000,
    credits: 25,
    duration: '60s',
    isHot: false,
    isNew: true,
  },
  {
    id: '5',
    name: 'TikTok Hook',
    description: 'Attention-grabbing video intro',
    category: 'social',
    thumbnail: '/templates/tiktok.jpg',
    usageCount: 150000,
    credits: 12,
    duration: '5s',
    isHot: true,
    isNew: false,
  },
  {
    id: '6',
    name: 'Educational Explainer',
    description: 'Animated explainer video template',
    category: 'educational',
    thumbnail: '/templates/edu.jpg',
    usageCount: 32000,
    credits: 30,
    duration: '90s',
    isHot: false,
    isNew: false,
  },
];

function formatUsageCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'popular') return b.usageCount - a.usageCount;
    if (sortBy === 'newest') return a.isNew ? -1 : 1;
    if (sortBy === 'credits') return a.credits - b.credits;
    return 0;
  });

  const handleUseTemplate = (template: Template) => {
    toast.success(`Opening ${template.name} template...`);
    // TODO: Navigate to creation page with template
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">Templates</h1>
          <Badge variant="secondary" className="bg-violet-500/10 text-violet-500">
            50+ Templates
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Quick creation with pre-designed fun templates. Just add your content and generate!
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Sort by: {sortBy === 'popular' ? 'Popular' : sortBy === 'newest' ? 'Newest' : 'Price'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('popular')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Most Popular
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              <Star className="mr-2 h-4 w-4" />
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('credits')}>
              <Sparkles className="mr-2 h-4 w-4" />
              Lowest Credits
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedTemplates.map((template) => (
          <Card
            key={template.id}
            className="group overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => handleUseTemplate(template)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-6 w-6 text-white ml-1" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {template.isHot && (
                  <Badge className="bg-orange-500 text-white text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Hot
                  </Badge>
                )}
                {template.isNew && (
                  <Badge className="bg-green-500 text-white text-xs">
                    New
                  </Badge>
                )}
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {template.duration}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <h3 className="font-semibold mb-1 line-clamp-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatUsageCount(template.usageCount)} uses
                </span>
                <Badge variant="outline">
                  {template.credits} credits
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
