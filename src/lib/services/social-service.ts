import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================
// FOLLOW/UNFOLLOW
// ============================================

export async function followUser(
  targetUserId: string,
  currentUserId: string,
  currentUsername: string
): Promise<void> {
  // Prevent following yourself
  if (targetUserId === currentUserId) {
    throw new Error('Cannot follow yourself');
  }

  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);

  // Check if already following
  const existingFollow = await getDoc(followRef);
  if (existingFollow.exists()) {
    return; // Already following
  }

  // Create follow document
  await setDoc(followRef, {
    followerId: currentUserId,
    followingId: targetUserId,
    createdAt: Timestamp.now(),
  });

  // Update follower count for target user
  const targetUserRef = doc(db, 'users', targetUserId);
  await updateDoc(targetUserRef, {
    followersCount: increment(1),
  });

  // Update following count for current user
  const currentUserRef = doc(db, 'users', currentUserId);
  await updateDoc(currentUserRef, {
    followingCount: increment(1),
  });

  // Create notification for target user
  await addDoc(collection(db, 'notifications'), {
    userId: targetUserId,
    type: 'newFollower',
    title: 'New Follower',
    message: `${currentUsername} started following you`,
    actionData: { userId: currentUserId },
    isRead: false,
    createdAt: Timestamp.now(),
  });
}

export async function unfollowUser(
  targetUserId: string,
  currentUserId: string
): Promise<void> {
  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);

  // Check if actually following
  const existingFollow = await getDoc(followRef);
  if (!existingFollow.exists()) {
    return; // Not following
  }

  // Delete follow document
  await deleteDoc(followRef);

  // Update follower count for target user
  const targetUserRef = doc(db, 'users', targetUserId);
  await updateDoc(targetUserRef, {
    followersCount: increment(-1),
  });

  // Update following count for current user
  const currentUserRef = doc(db, 'users', currentUserId);
  await updateDoc(currentUserRef, {
    followingCount: increment(-1),
  });
}

export async function isFollowing(
  targetUserId: string,
  currentUserId: string
): Promise<boolean> {
  if (!currentUserId || targetUserId === currentUserId) {
    return false;
  }

  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);
  const docSnap = await getDoc(followRef);

  return docSnap.exists();
}

export function subscribeToFollowStatus(
  targetUserId: string,
  currentUserId: string,
  callback: (isFollowing: boolean) => void
): Unsubscribe {
  if (!currentUserId || targetUserId === currentUserId) {
    callback(false);
    return () => {}; // Return no-op unsubscribe
  }

  const followId = `${currentUserId}_${targetUserId}`;
  const followRef = doc(db, 'follows', followId);

  return onSnapshot(followRef, (doc) => {
    callback(doc.exists());
  });
}

// ============================================
// FOLLOWER/FOLLOWING LISTS
// ============================================

export async function getFollowers(userId: string): Promise<string[]> {
  const q = query(
    collection(db, 'follows'),
    where('followingId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().followerId);
}

export async function getFollowing(userId: string): Promise<string[]> {
  const q = query(
    collection(db, 'follows'),
    where('followerId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().followingId);
}

export async function getFollowerCount(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data().followersCount || 0;
  }

  return 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data().followingCount || 0;
  }

  return 0;
}

// ============================================
// USER PROFILE
// ============================================

export async function getUserProfile(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() };
  }

  return null;
}

export function subscribeToUserProfile(
  userId: string,
  callback: (user: unknown) => void
): Unsubscribe {
  const userRef = doc(db, 'users', userId);

  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ uid: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
}
