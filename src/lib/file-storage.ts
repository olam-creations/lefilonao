import { isDevMode } from './dev';

const DB_NAME = 'lefilonao_files';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

interface StoredFile {
  id: string;
  data: ArrayBuffer;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  uploadedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function idbUpload(file: File, category: string): Promise<StoredFile> {
  const db = await openDB();
  const id = generateId();
  const data = await file.arrayBuffer();
  const stored: StoredFile = {
    id,
    data,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    category,
    uploadedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(stored);
    tx.oncomplete = () => resolve(stored);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDownload(id: string): Promise<StoredFile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'Le fichier dépasse la taille maximale de 10 Mo';
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Type de fichier non supporté. Formats acceptés : PDF, DOC, DOCX, JPG, PNG';
  }
  return null;
}

export interface UploadResult {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export async function uploadFile(file: File, category: string): Promise<UploadResult> {
  const error = validateFile(file);
  if (error) throw new Error(error);

  if (isDevMode()) {
    const stored = await idbUpload(file, category);
    return {
      id: stored.id,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      mimeType: stored.mimeType,
      uploadedAt: stored.uploadedAt,
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Échec de l\'upload');
  return res.json();
}

export async function downloadFile(id: string): Promise<Blob | null> {
  if (isDevMode()) {
    const stored = await idbDownload(id);
    if (!stored) return null;
    return new Blob([stored.data], { type: stored.mimeType });
  }

  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) return null;
  return res.blob();
}

export async function deleteFile(id: string): Promise<void> {
  if (isDevMode()) {
    return idbDelete(id);
  }

  const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Échec de la suppression');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
