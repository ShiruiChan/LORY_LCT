import { openDB } from 'idb';
export const dbPromise = openDB('citygame', 1, {
  upgrade(db) {
    db.createObjectStore('wallet');
    db.createObjectStore('buildings');
    db.createObjectStore('quests');
  }
});

export const put = async (store: string, key: string, value: unknown) =>
  (await dbPromise).put(store, value, key);

export const get = async <T>(store: string, key: string) =>
  (await dbPromise).get(store, key) as Promise<T | undefined>;
