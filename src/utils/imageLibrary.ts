export type LibraryPostType = 'radio' | 'health' | 'notice' | 'other';
export type LibraryImage = {
  id: string;
  image: Blob;
  title: string;
  postType: LibraryPostType;
  createdAt: string;
  sourceUrl?: string;
  shopName?: string;
  memo?: string;
};

const DB_NAME = 'rooms-eyecatch-library';
const STORE = 'images';

function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listLibraryImages(): Promise<LibraryImage[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => { db.close(); resolve((request.result as LibraryImage[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function saveLibraryImage(input: Omit<LibraryImage, 'id' | 'createdAt'>) {
  const record: LibraryImage = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const db = await database();
  return new Promise<LibraryImage>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(record);
    request.onsuccess = () => { db.close(); resolve(record); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}
