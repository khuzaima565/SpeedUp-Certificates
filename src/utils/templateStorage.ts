// IndexedDB storage for permanent client-side template caching
const DB_NAME = "SpeedUpCertDB";
const STORE_NAME = "templates";
const KEY = "fixed_certificate_template";

export interface StoredTemplate {
  dataUrl: string;
  width: number;
  height: number;
  fileName: string;
  updatedAt: number;
}

export function getSavedTemplate(): Promise<StoredTemplate | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(KEY);
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveTemplate(data: StoredTemplate): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve();
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.put(data, KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function clearSavedTemplate(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve();
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.delete(KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
