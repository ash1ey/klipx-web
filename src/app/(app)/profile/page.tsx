'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Edit3, Loader2, Save, Video, Heart, Users, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { credits, updateProfile, uploadProfilePhoto } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.username || '',
      username: user?.username || '',
      bio: '',
    },
  });

  const stats = {
    videos: 0,
    likes: user?.totalLikesReceived || 0,
    followers: user?.followersCount || 0,
    views: 0,
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadProfilePhoto(user.uid, file);
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await updateProfile(user.uid, { username: data.username });
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      displayName: user?.username || '',
      username: user?.username || '',
      bio: '',
    });
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.photoUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">
                {user?.username || 'Anonymous User'}
              </h1>
              <p className="text-muted-foreground">
                @{user?.username || 'username'}
              </p>
            </div>

            {/* Credits */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{credits}</div>
              <div className="text-sm text-muted-foreground">Credits</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xl font-bold">
                <Video className="h-4 w-4 text-muted-foreground" />
                {stats.videos}
              </div>
              <div className="text-xs text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xl font-bold">
                <Heart className="h-4 w-4 text-red-500" />
                {stats.likes}
              </div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xl font-bold">
                <Users className="h-4 w-4 text-muted-foreground" />
                {stats.followers}
              </div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xl font-bold">
                <Eye className="h-4 w-4 text-muted-foreground" />
                {stats.views}
              </div>
              <div className="text-xs text-muted-foreground">Views</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="edit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile details visible to others
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...register('displayName')}
                      disabled={!isEditing || isSaving}
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        className="pl-7"
                        {...register('username')}
                        disabled={!isEditing || isSaving}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-sm text-destructive">{errors.username.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others about yourself..."
                    className="resize-none"
                    {...register('bio')}
                    disabled={!isEditing || isSaving}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={user?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Referral Code</Label>
                <div className="flex gap-2">
                  <Input value={user?.referralCode || 'N/A'} disabled />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.referralCode || '');
                      toast.success('Referral code copied!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code to earn rewards when friends sign up
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
