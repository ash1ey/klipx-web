'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePromptDatabaseStore } from '@/stores/prompt-database-store';
import { useAuthStore } from '@/stores/auth-store';
import { PromptCard } from '@/components/prompt-database/prompt-card';
import { PromptPreviewModal } from '@/components/prompt-database/prompt-preview-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, ImageJob } from '@/types';
import {
  Search,
  Video as VideoIcon,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  Coins,
  Bookmark,
  Loader2,
  Database,
} from 'lucide-react';

type ContentType = 'videos' | 'images';
type Category = 'recent' | 'popular' | 'free' | 'saved';

export default function PromptDatabasePage() {
  const { user, loading: authLoading } = useAuthStore();
  const {
    contentType,
    category,
    searchQuery,
    videos,
    images,
    savedPrompts,
    isLoading,
    isSavedLoading,
    hasMore,
    setContentType,
    setCategory,
    setSearchQuery,
    fetchPrompts,
    fetchSavedPrompts,
    loadMore,
    checkIfPurchased,
  } = usePromptDatabaseStore();

  const [selectedItem, setSelectedItem] = useState<Video | ImageJob | null>(null);
  const [selectedType, setSelectedType] = useState<'video' | 'image'>('video');
  const [showPreview, setShowPreview] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');

  // Fetch prompts on mount and when filters change
  useEffect(() => {
    if (category === 'saved' && user) {
      fetchSavedPrompts(user.uid);
    } else {
      fetchPrompts(user?.uid);
    }
  }, [category, contentType, user, fetchPrompts, fetchSavedPrompts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        if (category !== 'saved') {
          fetchPrompts(user?.uid);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchQuery, fetchPrompts, category, user]);

  // Check saved status for displayed items
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;

      const itemsToCheck = contentType === 'videos' ? videos : images;
      const newSavedIds = new Set<string>();

      for (const item of itemsToCheck) {
        const isSaved = await checkIfPurchased(
          user.uid,
          item.id,
          contentType === 'videos' ? 'video' : 'image'
        );
        if (isSaved) {
          newSavedIds.add(item.id);
        }
      }

      setSavedItemIds(newSavedIds);
    };

    checkSavedStatus();
  }, [videos, images, contentType, user, checkIfPurchased]);

  const handleItemClick = (item: Video | ImageJob, type: 'video' | 'image') => {
    setSelectedItem(item);
    setSelectedType(type);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedItem(null);
  };

  const handleSaveStatusChange = useCallback(() => {
    // Refresh saved status
    if (user) {
      if (category === 'saved') {
        fetchSavedPrompts(user.uid);
      } else {
        // Just update the saved IDs set
        const checkStatus = async () => {
          if (selectedItem) {
            const isSaved = await checkIfPurchased(
              user.uid,
              selectedItem.id,
              selectedType
            );
            setSavedItemIds((prev) => {
              const newSet = new Set(prev);
              if (isSaved) {
                newSet.add(selectedItem.id);
              } else {
                newSet.delete(selectedItem.id);
              }
              return newSet;
            });
          }
        };
        checkStatus();
      }
    }
  }, [user, category, selectedItem, selectedType, fetchSavedPrompts, checkIfPurchased]);

  const handleContentTypeChange = (type: string) => {
    setContentType(type as ContentType);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat as Category);
  };

  // Get items to display
  const displayItems = category === 'saved'
    ? savedPrompts
    : contentType === 'videos'
    ? videos
    : images;

  const categories = [
    { value: 'recent', label: 'Most Recent', icon: Clock },
    { value: 'popular', label: 'Popular', icon: TrendingUp },
    { value: 'free', label: 'Free', icon: Coins },
    { value: 'saved', label: 'My Saved', icon: Bookmark },
  ];

  // Loading state for auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <Database className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to browse prompts</h2>
        <p className="text-muted-foreground mb-6">
          Discover free and premium prompts from our community
        </p>
        <Button onClick={() => (window.location.href = '/login/')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Prompt Database</h1>
          <p className="text-muted-foreground text-sm">
            Browse and unlock video and image prompts from the community
          </p>
        </div>

        {/* Content Type Toggle */}
        <div className="flex gap-2">
          <Button
            variant={contentType === 'videos' ? 'default' : 'outline'}
            onClick={() => handleContentTypeChange('videos')}
            className="flex-1 sm:flex-none"
          >
            <VideoIcon className="w-4 h-4 mr-2" />
            Videos
          </Button>
          <Button
            variant={contentType === 'images' ? 'default' : 'outline'}
            onClick={() => handleContentTypeChange('images')}
            className="flex-1 sm:flex-none"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex items-center gap-2"
              >
                <cat.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">
                  {cat.value === 'saved' ? 'Saved' : cat.label.split(' ')[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {category === 'saved'
              ? `${savedPrompts.length} saved prompts`
              : `${displayItems.length} prompts found`}
          </p>
        </div>

        {/* Grid */}
        {isLoading || isSavedLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              {category === 'saved' ? (
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Search className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {category === 'saved'
                ? 'No saved prompts yet'
                : 'No prompts found'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {category === 'saved'
                ? 'Save prompts to access them later in this tab'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {category === 'saved'
              ? // Render saved prompts
                savedPrompts.map((saved) => (
                  <PromptCard
                    key={saved.id}
                    item={{
                      id: saved.promptId,
                      description: saved.prompt,
                      thumbnailUrl: saved.thumbnailUrl || saved.mediaUrl,
                      videoUrl: saved.mediaUrl,
                      imageUrl: saved.mediaUrl,
                      username: saved.sellerUsername || 'Anonymous',
                      modelUsed: saved.model,
                      remixPrice: saved.creditsPaid,
                      allowRemix: true,
                    } as unknown as Video}
                    type={saved.promptType}
                    isSaved={true}
                    onClick={() =>
                      handleItemClick(
                        {
                          id: saved.promptId,
                          description: saved.prompt,
                          prompt: saved.prompt,
                          thumbnailUrl: saved.thumbnailUrl || saved.mediaUrl,
                          videoUrl: saved.mediaUrl,
                          imageUrl: saved.mediaUrl,
                          username: saved.sellerUsername || 'Anonymous',
                          modelUsed: saved.model,
                          model: saved.model,
                          remixPrice: saved.creditsPaid,
                          allowRemix: true,
                          userId: saved.sellerId || undefined,
                        } as unknown as Video,
                        saved.promptType
                      )
                    }
                  />
                ))
              : // Render regular prompts
                (contentType === 'videos' ? videos : images).map((item) => (
                  <PromptCard
                    key={item.id}
                    item={item}
                    type={contentType === 'videos' ? 'video' : 'image'}
                    isSaved={savedItemIds.has(item.id)}
                    onClick={() =>
                      handleItemClick(
                        item,
                        contentType === 'videos' ? 'video' : 'image'
                      )
                    }
                  />
                ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && displayItems.length > 0 && category !== 'saved' && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PromptPreviewModal
        item={selectedItem}
        type={selectedType}
        isOpen={showPreview}
        onClose={handleClosePreview}
        isSaved={selectedItem ? savedItemIds.has(selectedItem.id) : false}
        onSaveStatusChange={handleSaveStatusChange}
      />
    </div>
  );
}
