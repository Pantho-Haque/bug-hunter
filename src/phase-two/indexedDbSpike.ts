const databaseName = 'codequest-phase-two-spike';
const storeName = 'snapshots';

interface SnapshotRecord {
  id: 'current' | 'recovery';
  source: string;
  updatedAt: string;
  version: 1;
}

interface LoadResult {
  record: SnapshotRecord;
  recovered: boolean;
}

function isSnapshotRecord(value: unknown): value is SnapshotRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    (record.id === 'current' || record.id === 'recovery') &&
    typeof record.source === 'string' &&
    typeof record.updatedAt === 'string' &&
    record.version === 1
  );
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () =>
      reject(request.error ?? new Error('IndexedDB request failed.')),
    );
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('abort', () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.')),
    );
    transaction.addEventListener('error', () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed.')),
    );
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  const request = indexedDB.open(databaseName, 1);
  request.addEventListener('upgradeneeded', () => {
    if (!request.result.objectStoreNames.contains(storeName)) {
      request.result.createObjectStore(storeName, { keyPath: 'id' });
    }
  });
  return requestResult(request);
}

export async function saveSpikeSnapshot(
  source: string,
  simulateQuota = false,
): Promise<SnapshotRecord> {
  if (simulateQuota)
    throw new DOMException(
      'The storage quota test stopped this write.',
      'QuotaExceededError',
    );

  const database = await openDatabase();
  try {
    const readTransaction = database.transaction(storeName, 'readonly');
    const previous = await requestResult(
      readTransaction.objectStore(storeName).get('current'),
    );
    await transactionComplete(readTransaction);

    const next: SnapshotRecord = {
      id: 'current',
      source,
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    const writeTransaction = database.transaction(storeName, 'readwrite');
    const store = writeTransaction.objectStore(storeName);
    const recovery: SnapshotRecord = isSnapshotRecord(previous)
      ? { ...previous, id: 'recovery' }
      : { ...next, id: 'recovery' };
    store.put(recovery);
    store.put(next);
    await transactionComplete(writeTransaction);
    return next;
  } finally {
    database.close();
  }
}

export async function loadSpikeSnapshot(): Promise<LoadResult> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const currentRequest = store.get('current');
    const recoveryRequest = store.get('recovery');
    const [current, recovery] = await Promise.all([
      requestResult(currentRequest),
      requestResult(recoveryRequest),
      transactionComplete(transaction),
    ]);

    if (isSnapshotRecord(current)) return { record: current, recovered: false };
    if (isSnapshotRecord(recovery))
      return { record: recovery, recovered: true };
    throw new Error('No valid current or recovery snapshot exists.');
  } finally {
    database.close();
  }
}

export async function corruptCurrentSnapshot(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction
      .objectStore(storeName)
      .put({ id: 'current', source: 42, version: 999 });
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function clearSpikeDatabase(): Promise<void> {
  const database = await openDatabase();
  database.close();
  await requestResult(indexedDB.deleteDatabase(databaseName));
}
