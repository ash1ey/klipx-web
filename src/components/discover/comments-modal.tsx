'use client';

import { useState, useEffect, useRef } from 'react';
import { Video, Comment } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { useDiscoverStore } from '@/stores/discover-store';
import { formatTimeAgo } from '@/lib/services/video-service';
import { cn } from '@/lib/utils';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CommentsModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsModal({ video, isOpen, onClose }: CommentsModalProps) {
  const { user } = useAuthStore();
  const {
    comments,
    commentsLoading,
    loadComments,
    subscribeToVideoComments,
    addComment,
    deleteComment,
  } = useDiscoverStore();

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const videoComments = comments[video.id] || [];
  const isLoading = commentsLoading[video.id] || false;

  // Load comments and subscribe to updates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments(video.id);
      subscribeToVideoComments(video.id);
    }
  }, [isOpen, video.id, loadComments, subscribeToVideoComments]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (commentsEndRef.current && videoComments.length > 0) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [videoComments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment(
        video.id,
        user.uid,
        user.username || 'User',
        user.photoUrl,
        newComment.trim(),
        video.userId
      );
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(commentToDelete, video.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle>
                {videoComments.length} {videoComments.length === 1 ? 'comment' : 'comments'}
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto py-4 h-[calc(75vh-140px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : videoComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p className="text-lg font-medium">No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {videoComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isOwn={user?.uid === comment.userId}
                    onDelete={() => handleDeleteClick(comment.id)}
                    getInitials={getInitials}
                  />
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>

          {/* Comment input */}
          <form onSubmit={handleSubmit} className="border-t pt-4 flex gap-2">
            {user ? (
              <>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.photoUrl || undefined} alt={user.username || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(user.username || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center">
                <Button
                  variant="link"
                  onClick={() => (window.location.href = '/login/')}
                >
                  Log in to comment
                </Button>
              </div>
            )}
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  onDelete: () => void;
  getInitials: (name: string) => string;
}

function CommentItem({ comment, isOwn, onDelete, getInitials }: CommentItemProps) {
  return (
    <div className="flex gap-3 group">
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={comment.userPhotoUrl || undefined} alt={comment.username} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {getInitials(comment.username)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{comment.username}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm mt-1 break-words">{comment.text}</p>
      </div>

      {isOwn && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-full"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      )}
    </div>
  );
}
