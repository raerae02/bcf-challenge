const DB_NAME = "permit-radar-files";
const DB_VERSION = 1;
const STORE = "files";

type StoredFile = {
  key: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
};

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    Promise.resolve(fn(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch(reject);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeFile(key: string, file: File): Promise<void> {
  if (!isBrowser()) return;
  const record: StoredFile = {
    key,
    blob: file,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  };
  await withStore("readwrite", (store) => reqToPromise(store.put(record)));
}

export async function getFile(key: string): Promise<StoredFile | null> {
  if (!isBrowser()) return null;
  const result = await withStore("readonly", (store) =>
    reqToPromise(store.get(key) as IDBRequest<StoredFile | undefined>),
  );
  return result ?? null;
}

export async function deleteFile(key: string): Promise<void> {
  if (!isBrowser()) return;
  await withStore("readwrite", (store) => reqToPromise(store.delete(key)));
}

export async function deleteFilesByPrefix(prefix: string): Promise<void> {
  if (!isBrowser()) return;
  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
          cursor.delete();
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export function fileKey(projectId: string, index: number): string {
  return `${projectId}::${index}`;
}
