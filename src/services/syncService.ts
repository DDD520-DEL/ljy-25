import {
  User,
  BarkRecord,
  DogProfile,
  AppSettings,
  SyncPushPayload,
  SyncPullResponse,
  SyncFullResponse,
} from '@/types';

const CLOUD_STORAGE_PREFIX = 'bark-cloud-';

interface CloudUserStorage {
  users: Record<string, { password: string; user: Omit<User, 'token'> }>;
  sessions: Record<string, string>;
}

interface CloudDataStorage {
  [userId: string]: {
    records: BarkRecord[];
    dogs: DogProfile[];
    settings: AppSettings;
    deletedRecordIds: string[];
    deletedDogIds: string[];
    lastModified: number;
  };
}

function getCloudUserStorage(): CloudUserStorage {
  try {
    const data = localStorage.getItem(`${CLOUD_STORAGE_PREFIX}users`);
    return data ? JSON.parse(data) : { users: {}, sessions: {} };
  } catch {
    return { users: {}, sessions: {} };
  }
}

function setCloudUserStorage(storage: CloudUserStorage): void {
  localStorage.setItem(`${CLOUD_STORAGE_PREFIX}users`, JSON.stringify(storage));
}

function getCloudDataStorage(): CloudDataStorage {
  try {
    const data = localStorage.getItem(`${CLOUD_STORAGE_PREFIX}data`);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setCloudDataStorage(storage: CloudDataStorage): void {
  localStorage.setItem(`${CLOUD_STORAGE_PREFIX}data`, JSON.stringify(storage));
}

function initUserData(userId: string): void {
  const storage = getCloudDataStorage();
  if (!storage[userId]) {
    storage[userId] = {
      records: [],
      dogs: [],
      settings: {
        vibrationEnabled: true,
        soundEnabled: false,
        theme: 'light',
        reminders: {
          enabled: false,
          times: [],
          lastTriggeredDates: {},
        },
      },
      deletedRecordIds: [],
      deletedDogIds: [],
      lastModified: Date.now(),
    };
    setCloudDataStorage(storage);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(username: string, password: string): Promise<User> {
  await delay(500);

  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }

  const storage = getCloudUserStorage();
  const userKey = username.toLowerCase();

  if (!storage.users[userKey]) {
    throw new Error('用户不存在，请先注册');
  }

  if (storage.users[userKey].password !== password) {
    throw new Error('密码错误');
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const userData = storage.users[userKey].user;
  const user: User = {
    ...userData,
    token,
    lastLoginAt: Date.now(),
  };

  storage.sessions[token] = user.id;
  storage.users[userKey].user.lastLoginAt = user.lastLoginAt;
  setCloudUserStorage(storage);

  initUserData(user.id);

  return user;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<User> {
  await delay(500);

  if (!username || !email || !password) {
    throw new Error('请填写完整的注册信息');
  }

  if (password.length < 6) {
    throw new Error('密码至少需要6个字符');
  }

  const storage = getCloudUserStorage();
  const userKey = username.toLowerCase();

  if (storage.users[userKey]) {
    throw new Error('用户名已被注册');
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = Date.now();

  const user: User = {
    id: userId,
    username,
    email,
    token,
    createdAt: now,
    lastLoginAt: now,
  };

  storage.users[userKey] = {
    password,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  };
  storage.sessions[token] = user.id;
  setCloudUserStorage(storage);

  initUserData(userId);

  return user;
}

export async function logout(token: string): Promise<void> {
  await delay(200);
  const storage = getCloudUserStorage();
  delete storage.sessions[token];
  setCloudUserStorage(storage);
}

export async function validateToken(token: string): Promise<User | null> {
  await delay(100);
  const storage = getCloudUserStorage();
  const userId = storage.sessions[token];
  if (!userId) return null;

  for (const key of Object.keys(storage.users)) {
    if (storage.users[key].user.id === userId) {
      return {
        ...storage.users[key].user,
        token,
      } as User;
    }
  }
  return null;
}

export async function pushChanges(
  token: string,
  payload: SyncPushPayload
): Promise<{ serverTime: number; success: boolean }> {
  await delay(800);

  const storage = getCloudUserStorage();
  const userId = storage.sessions[token];
  if (!userId) {
    throw new Error('登录已过期，请重新登录');
  }

  if (userId !== payload.userId) {
    throw new Error('用户身份不匹配');
  }

  const dataStorage = getCloudDataStorage();
  const userData = dataStorage[userId];
  if (!userData) {
    initUserData(userId);
    return pushChanges(token, payload);
  }

  const existingRecords = new Map(userData.records.map((r) => [r.id, r]));
  payload.records.forEach((record) => {
    const existing = existingRecords.get(record.id);
    if (!existing || record.updatedAt >= existing.updatedAt) {
      existingRecords.set(record.id, record);
    }
  });

  const existingDogs = new Map(userData.dogs.map((d) => [d.id, d]));
  payload.dogs.forEach((dog) => {
    const existing = existingDogs.get(dog.id);
    if (!existing || dog.updatedAt >= existing.updatedAt) {
      existingDogs.set(dog.id, dog);
    }
  });

  payload.deletedRecordIds.forEach((id) => {
    existingRecords.delete(id);
    if (!userData.deletedRecordIds.includes(id)) {
      userData.deletedRecordIds.push(id);
    }
  });

  payload.deletedDogIds.forEach((id) => {
    existingDogs.delete(id);
    if (!userData.deletedDogIds.includes(id)) {
      userData.deletedDogIds.push(id);
    }
  });

  userData.records = Array.from(existingRecords.values());
  userData.dogs = Array.from(existingDogs.values());
  userData.lastModified = Date.now();

  setCloudDataStorage(dataStorage);

  return {
    serverTime: userData.lastModified,
    success: true,
  };
}

export async function pullChanges(
  token: string,
  userId: string,
  since: number
): Promise<SyncPullResponse> {
  await delay(600);

  const storage = getCloudUserStorage();
  const sessionUserId = storage.sessions[token];
  if (!sessionUserId) {
    throw new Error('登录已过期，请重新登录');
  }

  if (sessionUserId !== userId) {
    throw new Error('用户身份不匹配');
  }

  const dataStorage = getCloudDataStorage();
  const userData = dataStorage[userId];

  if (!userData) {
    return {
      records: [],
      dogs: [],
      deletedRecordIds: [],
      deletedDogIds: [],
      serverTime: Date.now(),
      hasMore: false,
    };
  }

  const changedRecords = userData.records.filter(
    (r) => r.updatedAt > since || r.createdAt > since
  );
  const changedDogs = userData.dogs.filter(
    (d) => d.updatedAt > since || d.createdAt > since
  );

  return {
    records: changedRecords,
    dogs: changedDogs,
    deletedRecordIds: userData.deletedRecordIds,
    deletedDogIds: userData.deletedDogIds,
    serverTime: userData.lastModified,
    hasMore: false,
  };
}

export async function pullAll(
  token: string,
  userId: string
): Promise<SyncFullResponse> {
  await delay(1000);

  const storage = getCloudUserStorage();
  const sessionUserId = storage.sessions[token];
  if (!sessionUserId) {
    throw new Error('登录已过期，请重新登录');
  }

  if (sessionUserId !== userId) {
    throw new Error('用户身份不匹配');
  }

  const dataStorage = getCloudDataStorage();
  const userData = dataStorage[userId];

  if (!userData) {
    initUserData(userId);
    return pullAll(token, userId);
  }

  return {
    records: userData.records,
    dogs: userData.dogs,
    settings: userData.settings,
    serverTime: userData.lastModified,
  };
}

export async function pushFull(
  token: string,
  userId: string,
  records: BarkRecord[],
  dogs: DogProfile[],
  settings: AppSettings
): Promise<{ serverTime: number; success: boolean }> {
  await delay(1200);

  const storage = getCloudUserStorage();
  const sessionUserId = storage.sessions[token];
  if (!sessionUserId) {
    throw new Error('登录已过期，请重新登录');
  }

  if (sessionUserId !== userId) {
    throw new Error('用户身份不匹配');
  }

  const dataStorage = getCloudDataStorage();
  initUserData(userId);
  const userData = dataStorage[userId];

  userData.records = [...records];
  userData.dogs = [...dogs];
  userData.settings = { ...settings };
  userData.deletedRecordIds = [];
  userData.deletedDogIds = [];
  userData.lastModified = Date.now();

  setCloudDataStorage(dataStorage);

  return {
    serverTime: userData.lastModified,
    success: true,
  };
}
