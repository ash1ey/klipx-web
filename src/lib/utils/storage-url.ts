/**
 * Converts various Firebase/GCS storage URL formats to the proper Firebase Storage download URL format.
 *
 * The URLs from Firestore might be in different formats:
 * 1. GCS API URL: https://storage.googleapis.com/download/storage/v1/b/BUCKET/o/PATH?generation=...&alt=media
 * 2. GCS direct: https://storage.googleapis.com/BUCKET/PATH
 * 3. Firebase Storage (correct): https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media
 *
 * This converts all formats to the Firebase Storage format which respects storage.rules
 */
export function convertToFirebaseStorageUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Already in correct Firebase Storage format
  if (url.includes('firebasestorage.googleapis.com')) {
    return url;
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    console.warn('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not set');
    return url;
  }

  // Format 1: GCS API URL
  // https://storage.googleapis.com/download/storage/v1/b/BUCKET/o/PATH?generation=...&alt=media
  const gcsApiMatch = url.match(/storage\.googleapis\.com\/download\/storage\/v1\/b\/([^/]+)\/o\/([^?]+)/);
  if (gcsApiMatch) {
    const [, , encodedPath] = gcsApiMatch;
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }

  // Format 2: GCS direct URL
  // https://storage.googleapis.com/BUCKET/PATH
  const gcsDirectMatch = url.match(/storage\.googleapis\.com\/([^/]+)\/(.+)/);
  if (gcsDirectMatch) {
    const [, , path] = gcsDirectMatch;
    const encodedPath = encodeURIComponent(path);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }

  // Return original if no conversion needed
  return url;
}

/**
 * Hook-friendly version that handles arrays of URLs
 */
export function convertUrls(urls: (string | undefined | null)[]): (string | null)[] {
  return urls.map(convertToFirebaseStorageUrl);
}
