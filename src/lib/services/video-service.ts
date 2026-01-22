import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  increment,
  setDoc,
  QueryDocumentSnapshot,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Video, Comment } from '@/types';

// ============================================
// VIDEO QUERIES
// ============================================

export async function getPublicVideos(
  limitCount: number = 10,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ videos: Video[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (lastDoc) {
    q = query(
      collection(db, 'videos'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(limitCount)
    );
  }

  const snapshot = await getDocs(q);
  const videos: Video[] = [];
  let newLastDoc: QueryDocumentSnapshot | null = null;

  snapshot.forEach((doc) => {
    videos.push({ id: doc.id, ...doc.data() } as Video);
    newLastDoc = doc;
  });

  return { videos, lastDoc: newLastDoc };
}

export function subscribeToPublicVideos(
  limitCount: number,
  callback: (videos: Video[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const videos: Video[] = [];
    snapshot.forEach((doc) => {
      videos.push({ id: doc.id, ...doc.data() } as Video);
    });
    callback(videos);
  });
}

export async function getVideoById(videoId: string): Promise<Video | null> {
  const docRef = doc(db, 'videos', videoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Video;
  }

  return null;
}

// ============================================
// LIKES
// ============================================

export async function likeVideo(
  videoId: string,
  userId: string,
  videoOwnerId: string,
  username: string
): Promise<void> {
  const likeId = `${videoId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);
  const videoRef = doc(db, 'videos', videoId);
  const ownerRef = doc(db, 'users', videoOwnerId);

  // Create like document
  await setDoc(likeRef, {
    videoId,
    userId,
    createdAt: Timestamp.now(),
  });

  // Increment video likes count
  await updateDoc(videoRef, {
    likes: increment(1),
  });

  // Increment owner's total likes received
  await updateDoc(ownerRef, {
    totalLikesReceived: increment(1),
  });

  // Create notification for video owner (if not liking own video)
  if (userId !== videoOwnerId) {
    await addDoc(collection(db, 'notifications'), {
      userId: videoOwnerId,
      type: 'newLike',
      title: 'New Like',
      message: `${username} liked your video`,
      actionData: { videoId, userId },
      isRead: false,
      createdAt: Timestamp.now(),
    });
  }
}

export async function unlikeVideo(
  videoId: string,
  userId: string,
  videoOwnerId: string
): Promise<void> {
  const likeId = `${videoId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);
  const videoRef = doc(db, 'videos', videoId);
  const ownerRef = doc(db, 'users', videoOwnerId);

  // Delete like document
  await deleteDoc(likeRef);

  // Decrement video likes count
  await updateDoc(videoRef, {
    likes: increment(-1),
  });

  // Decrement owner's total likes received
  await updateDoc(ownerRef, {
    totalLikesReceived: increment(-1),
  });
}

export async function isVideoLiked(
  videoId: string,
  userId: string
): Promise<boolean> {
  const likeId = `${videoId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);
  const docSnap = await getDoc(likeRef);
  return docSnap.exists();
}

export function subscribeToLikeStatus(
  videoId: string,
  userId: string,
  callback: (isLiked: boolean) => void
): Unsubscribe {
  const likeId = `${videoId}_${userId}`;
  const likeRef = doc(db, 'likes', likeId);

  return onSnapshot(likeRef, (doc) => {
    callback(doc.exists());
  });
}

export function subscribeToLikesCount(
  videoId: string,
  callback: (count: number) => void
): Unsubscribe {
  const videoRef = doc(db, 'videos', videoId);

  return onSnapshot(videoRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().likes || 0);
    }
  });
}

// ============================================
// COMMENTS
// ============================================

export async function addComment(
  videoId: string,
  userId: string,
  username: string,
  userPhotoUrl: string | null,
  text: string,
  videoOwnerId: string
): Promise<string> {
  const commentRef = await addDoc(collection(db, 'comments'), {
    videoId,
    userId,
    username,
    userPhotoUrl,
    text,
    createdAt: Timestamp.now(),
  });

  // Increment comments count on video
  const videoRef = doc(db, 'videos', videoId);
  await updateDoc(videoRef, {
    commentsCount: increment(1),
  });

  // Create notification for video owner (if not commenting on own video)
  if (userId !== videoOwnerId) {
    await addDoc(collection(db, 'notifications'), {
      userId: videoOwnerId,
      type: 'newComment',
      title: 'New Comment',
      message: `${username} commented: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      actionData: { videoId, userId, commentId: commentRef.id },
      isRead: false,
      createdAt: Timestamp.now(),
    });
  }

  return commentRef.id;
}

export async function deleteComment(
  commentId: string,
  videoId: string
): Promise<void> {
  const commentRef = doc(db, 'comments', commentId);
  await deleteDoc(commentRef);

  // Decrement comments count on video
  const videoRef = doc(db, 'videos', videoId);
  await updateDoc(videoRef, {
    commentsCount: increment(-1),
  });
}

export async function getComments(videoId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('videoId', '==', videoId),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);
  const comments: Comment[] = [];

  snapshot.forEach((doc) => {
    comments.push({ id: doc.id, ...doc.data() } as Comment);
  });

  return comments;
}

export function subscribeToComments(
  videoId: string,
  callback: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'comments'),
    where('videoId', '==', videoId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() } as Comment);
    });
    callback(comments);
  });
}

export function subscribeToCommentsCount(
  videoId: string,
  callback: (count: number) => void
): Unsubscribe {
  const videoRef = doc(db, 'videos', videoId);

  return onSnapshot(videoRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().commentsCount || 0);
    }
  });
}

// ============================================
// VIEWS
// ============================================

export async function incrementViews(
  videoId: string,
  userId: string
): Promise<void> {
  const viewId = `${videoId}_${userId}`;
  const viewRef = doc(db, 'videoViews', viewId);
  const viewDoc = await getDoc(viewRef);

  // Only count one view per user per video
  if (!viewDoc.exists()) {
    await setDoc(viewRef, {
      videoId,
      userId,
      createdAt: Timestamp.now(),
    });

    // Increment video views count
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      views: increment(1),
    });
  }
}

// ============================================
// SHARES
// ============================================

export async function incrementShares(videoId: string): Promise<void> {
  const videoRef = doc(db, 'videos', videoId);
  await updateDoc(videoRef, {
    shares: increment(1),
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatTimeAgo(timestamp: Timestamp): string {
  const now = new Date();
  const date = timestamp.toDate();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}
