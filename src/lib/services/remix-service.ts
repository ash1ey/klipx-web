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
  orderBy,
  getDocs,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PurchasedPrompt, AIModel } from '@/types';

// ============================================
// PURCHASE PROMPT (Paid)
// ============================================

export interface PurchasePromptParams {
  promptId: string;
  promptType: 'video' | 'image';
  buyerId: string;
  sellerId: string;
  creditCost: number;
  mediaUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  model: AIModel;
  sellerUsername?: string;
}

export async function purchasePrompt(params: PurchasePromptParams): Promise<void> {
  const {
    promptId,
    promptType,
    buyerId,
    sellerId,
    creditCost,
    mediaUrl,
    thumbnailUrl,
    prompt,
    model,
    sellerUsername,
  } = params;

  // Cannot purchase your own prompt
  if (buyerId === sellerId) {
    throw new Error('Cannot purchase your own prompt');
  }

  // Check if already purchased
  const existingPurchase = await hasUserPurchasedPrompt(buyerId, promptId, promptType);
  if (existingPurchase) {
    throw new Error('You have already purchased this prompt');
  }

  // Use transaction to ensure atomic operation
  await runTransaction(db, async (transaction) => {
    // Get buyer's current credits
    const buyerRef = doc(db, 'users', buyerId);
    const buyerDoc = await transaction.get(buyerRef);

    if (!buyerDoc.exists()) {
      throw new Error('Buyer account not found');
    }

    const buyerCredits = buyerDoc.data().credits || 0;

    if (buyerCredits < creditCost) {
      throw new Error('Insufficient credits');
    }

    // Get seller document
    const sellerRef = doc(db, 'users', sellerId);
    const sellerDoc = await transaction.get(sellerRef);

    if (!sellerDoc.exists()) {
      throw new Error('Seller account not found');
    }

    // Create purchased prompt document
    const purchaseId = `${buyerId}_${promptId}_${promptType}`;
    const purchaseRef = doc(db, 'purchasedPrompts', purchaseId);

    const purchasedPrompt: Omit<PurchasedPrompt, 'id'> & { id: string } = {
      id: purchaseId,
      promptId,
      promptType,
      buyerId,
      sellerId,
      mediaUrl,
      thumbnailUrl,
      prompt,
      creditsPaid: creditCost,
      model,
      sellerUsername,
      purchasedAt: Timestamp.now(),
    };

    transaction.set(purchaseRef, purchasedPrompt);

    // Deduct credits from buyer
    transaction.update(buyerRef, {
      credits: increment(-creditCost),
    });

    // Add credits to seller (seller gets 80%, platform takes 20%)
    const sellerEarnings = Math.floor(creditCost * 0.8);
    if (sellerEarnings > 0) {
      transaction.update(sellerRef, {
        credits: increment(sellerEarnings),
      });
    }
  });

  // Create notification for seller (outside transaction for simplicity)
  await addDoc(collection(db, 'notifications'), {
    userId: sellerId,
    type: 'promptPurchased',
    title: 'Prompt Purchased',
    message: `Someone purchased your ${promptType} prompt for ${creditCost} credits`,
    actionData: { promptId, promptType },
    isRead: false,
    createdAt: Timestamp.now(),
  });
}

// ============================================
// SAVE FREE PROMPT
// ============================================

export interface SaveFreePromptParams {
  promptId: string;
  promptType: 'video' | 'image';
  buyerId: string;
  sellerId: string | null;
  mediaUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  model: AIModel;
  sellerUsername?: string;
}

export async function saveFreePrompt(params: SaveFreePromptParams): Promise<void> {
  const {
    promptId,
    promptType,
    buyerId,
    sellerId,
    mediaUrl,
    thumbnailUrl,
    prompt,
    model,
    sellerUsername,
  } = params;

  // Check if already saved
  const existingSave = await hasUserPurchasedPrompt(buyerId, promptId, promptType);
  if (existingSave) {
    throw new Error('You have already saved this prompt');
  }

  // Create purchased prompt document (with 0 credits paid)
  const purchaseId = `${buyerId}_${promptId}_${promptType}`;
  const purchaseRef = doc(db, 'purchasedPrompts', purchaseId);

  const savedPrompt: Omit<PurchasedPrompt, 'id'> & { id: string } = {
    id: purchaseId,
    promptId,
    promptType,
    buyerId,
    sellerId,
    mediaUrl,
    thumbnailUrl,
    prompt,
    creditsPaid: 0,
    model,
    sellerUsername,
    purchasedAt: Timestamp.now(),
  };

  await setDoc(purchaseRef, savedPrompt);
}

// ============================================
// CHECK IF PURCHASED
// ============================================

export async function hasUserPurchasedPrompt(
  userId: string,
  promptId: string,
  promptType: 'video' | 'image'
): Promise<boolean> {
  const purchaseId = `${userId}_${promptId}_${promptType}`;
  const purchaseRef = doc(db, 'purchasedPrompts', purchaseId);
  const purchaseDoc = await getDoc(purchaseRef);

  return purchaseDoc.exists();
}

// ============================================
// GET USER'S PURCHASED/SAVED PROMPTS
// ============================================

export async function getUserPurchasedPrompts(
  userId: string,
  promptType?: 'video' | 'image'
): Promise<PurchasedPrompt[]> {
  let q = query(
    collection(db, 'purchasedPrompts'),
    where('buyerId', '==', userId),
    orderBy('purchasedAt', 'desc')
  );

  if (promptType) {
    q = query(
      collection(db, 'purchasedPrompts'),
      where('buyerId', '==', userId),
      where('promptType', '==', promptType),
      orderBy('purchasedAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PurchasedPrompt[];
}

// ============================================
// REMOVE SAVED PROMPT
// ============================================

export async function removeSavedPrompt(
  userId: string,
  promptId: string,
  promptType: 'video' | 'image'
): Promise<void> {
  const purchaseId = `${userId}_${promptId}_${promptType}`;
  const purchaseRef = doc(db, 'purchasedPrompts', purchaseId);

  await deleteDoc(purchaseRef);
}

// ============================================
// GET REMIXABLE CONTENT
// ============================================

interface VideoData {
  id: string;
  remixPrice?: number | null;
  views?: number;
  likes?: number;
  [key: string]: unknown;
}

interface ImageData {
  id: string;
  remixPrice?: number | null;
  [key: string]: unknown;
}

export async function getRemixableVideos(options?: {
  filter?: 'all' | 'free' | 'paid';
  limit?: number;
}) {
  const { filter = 'all', limit = 20 } = options || {};

  const q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    where('allowRemix', '==', true),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  let videos: VideoData[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter by pricing
  if (filter === 'free') {
    videos = videos.filter((v) => !v.remixPrice || v.remixPrice === 0);
  } else if (filter === 'paid') {
    videos = videos.filter((v) => v.remixPrice && v.remixPrice > 0);
  }

  return videos.slice(0, limit);
}

export async function getRemixableImages(options?: {
  filter?: 'all' | 'free' | 'paid';
  limit?: number;
}) {
  const { filter = 'all', limit = 20 } = options || {};

  const q = query(
    collection(db, 'imageJobs'),
    where('isPublic', '==', true),
    where('allowRemix', '==', true),
    where('status', '==', 'complete'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  let images: ImageData[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filter by pricing
  if (filter === 'free') {
    images = images.filter((img) => !img.remixPrice || img.remixPrice === 0);
  } else if (filter === 'paid') {
    images = images.filter((img) => img.remixPrice && img.remixPrice > 0);
  }

  return images.slice(0, limit);
}

// ============================================
// GET POPULAR REMIXABLE CONTENT
// ============================================

export async function getPopularRemixableVideos(limit = 20) {
  // Note: This would ideally be sorted by views/likes, but Firestore
  // doesn't support multiple orderBy with where clauses easily.
  // For now, we fetch all and sort in memory.
  const q = query(
    collection(db, 'videos'),
    where('isPublic', '==', true),
    where('allowRemix', '==', true)
  );

  const snapshot = await getDocs(q);
  const videos: VideoData[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by views + likes
  videos.sort((a, b) => {
    const aScore = (a.views || 0) + (a.likes || 0) * 2;
    const bScore = (b.views || 0) + (b.likes || 0) * 2;
    return bScore - aScore;
  });

  return videos.slice(0, limit);
}

export async function getPopularRemixableImages(limit = 20) {
  const q = query(
    collection(db, 'imageJobs'),
    where('isPublic', '==', true),
    where('allowRemix', '==', true),
    where('status', '==', 'complete')
  );

  const snapshot = await getDocs(q);
  const images: ImageData[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort by some metric (for images, we might not have views/likes)
  // For now, just return in order of creation
  return images.slice(0, limit);
}
