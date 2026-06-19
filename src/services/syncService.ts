import {
  User,
  BarkRecord,
  DogProfile,
  AppSettings,
  SyncPushPayload,
  SyncPullResponse,
  SyncFullResponse,
  AdminUser,
  AdminDashboardData,
  AdminDashboardStats,
  DailyActiveData,
  RegionData,
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
        locationSharing: {
          enabled: false,
          precision: 'medium',
          lastGrantedAt: 0,
          lastDeniedAt: 0,
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

const ADMIN_STORAGE_KEY = `${CLOUD_STORAGE_PREFIX}admins`;
const ADMIN_SESSIONS_KEY = `${CLOUD_STORAGE_PREFIX}admin-sessions`;

interface AdminStorage {
  admins: Record<string, { password: string; admin: Omit<AdminUser, 'token'> }>;
}

function getAdminStorage(): AdminStorage {
  try {
    const data = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // ignore
  }
  const defaultAdmin: AdminStorage = {
    admins: {
      admin: {
        password: 'admin123',
        admin: {
          id: 'admin_001',
          username: 'admin',
          email: 'admin@barktracker.com',
          role: 'super_admin',
          createdAt: Date.now() - 86400000 * 365,
          lastLoginAt: 0,
        },
      },
    },
  };
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultAdmin));
  return defaultAdmin;
}

function setAdminStorage(storage: AdminStorage): void {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(storage));
}

function getAdminSessions(): Record<string, string> {
  try {
    const data = localStorage.getItem(ADMIN_SESSIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setAdminSessions(sessions: Record<string, string>): void {
  localStorage.setItem(ADMIN_SESSIONS_KEY, JSON.stringify(sessions));
}

function generateMockDailyTrend(days: number): DailyActiveData[] {
  const data: DailyActiveData[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const baseActive = 80 + Math.floor(Math.random() * 60);
    const baseNew = 5 + Math.floor(Math.random() * 15);
    const baseRecords = 200 + Math.floor(Math.random() * 300);
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      activeUsers: baseActive + Math.floor(Math.sin(i * 0.5) * 20),
      newUsers: baseNew + Math.floor(Math.random() * 5),
      totalRecords: baseRecords + Math.floor(Math.sin(i * 0.3) * 100),
    });
  }
  return data;
}

const CHINA_REGIONS: Omit<RegionData, 'userCount' | 'recordCount'>[] = [
  { province: '广东', city: '广州', lat: 23.1291, lng: 113.2644 },
  { province: '广东', city: '深圳', lat: 22.5431, lng: 114.0579 },
  { province: '北京', city: '北京', lat: 39.9042, lng: 116.4074 },
  { province: '上海', city: '上海', lat: 31.2304, lng: 121.4737 },
  { province: '浙江', city: '杭州', lat: 30.2741, lng: 120.1551 },
  { province: '江苏', city: '南京', lat: 32.0603, lng: 118.7969 },
  { province: '四川', city: '成都', lat: 30.5728, lng: 104.0668 },
  { province: '湖北', city: '武汉', lat: 30.5928, lng: 114.3055 },
  { province: '陕西', city: '西安', lat: 34.3416, lng: 108.9398 },
  { province: '山东', city: '青岛', lat: 36.0671, lng: 120.3826 },
  { province: '福建', city: '厦门', lat: 24.4798, lng: 118.0894 },
  { province: '辽宁', city: '沈阳', lat: 41.8057, lng: 123.4315 },
  { province: '湖南', city: '长沙', lat: 28.2282, lng: 112.9388 },
  { province: '河南', city: '郑州', lat: 34.7466, lng: 113.6254 },
  { province: '重庆', city: '重庆', lat: 29.4316, lng: 106.9123 },
];

function generateMockRegionData(): RegionData[] {
  return CHINA_REGIONS.map((region) => ({
    ...region,
    userCount: 50 + Math.floor(Math.random() * 200),
    recordCount: 200 + Math.floor(Math.random() * 1000),
  }));
}

function calculateDashboardStats(
  userStorage: CloudUserStorage,
  dataStorage: CloudDataStorage,
  dateRange: { start: number; end: number }
): AdminDashboardStats {
  const allUsers = Object.values(userStorage.users);
  let totalUsers = allUsers.length;

  let totalRecords = 0;
  let activeUsersToday = 0;
  let activeUsersYesterday = 0;
  let newUsersToday = 0;
  let newUsersYesterday = 0;
  let recordsToday = 0;
  let recordsYesterday = 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  allUsers.forEach((userData) => {
    const user = userData.user;
    if (user.createdAt >= todayStart && user.createdAt <= dateRange.end) {
      newUsersToday++;
    }
    if (user.createdAt >= yesterdayStart && user.createdAt < todayStart) {
      newUsersYesterday++;
    }
    if (user.lastLoginAt >= todayStart) {
      activeUsersToday++;
    }
    if (user.lastLoginAt >= yesterdayStart && user.lastLoginAt < todayStart) {
      activeUsersYesterday++;
    }
  });

  Object.values(dataStorage).forEach((userData) => {
    const recordsInRange = userData.records.filter(
      (r) => r.timestamp >= dateRange.start && r.timestamp <= dateRange.end
    );
    totalRecords += recordsInRange.length;

    recordsInRange.forEach((record) => {
      if (record.timestamp >= todayStart) {
        recordsToday++;
      }
      if (record.timestamp >= yesterdayStart && record.timestamp < todayStart) {
        recordsYesterday++;
      }
    });
  });

  if (totalRecords === 0) {
    totalRecords = 2847;
    recordsToday = 156;
    recordsYesterday = 142;
  }
  if (totalUsers === 0) {
    totalUsers = 342;
    activeUsersToday = 128;
    activeUsersYesterday = 115;
    newUsersToday = 12;
    newUsersYesterday = 8;
  }

  return {
    totalUsers,
    totalRecords,
    activeUsersToday,
    activeUsersYesterday,
    newUsersToday,
    newUsersYesterday,
    recordsToday,
    recordsYesterday,
    averageRecordsPerUser: totalUsers > 0 ? Math.round((totalRecords / totalUsers) * 10) / 10 : 0,
  };
}

export async function adminLogin(username: string, password: string): Promise<AdminUser> {
  await delay(600);

  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }

  const storage = getAdminStorage();
  const adminKey = username.toLowerCase();

  if (!storage.admins[adminKey]) {
    throw new Error('管理员账号不存在');
  }

  if (storage.admins[adminKey].password !== password) {
    throw new Error('密码错误');
  }

  const token = `admin_token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const adminData = storage.admins[adminKey].admin;
  const admin: AdminUser = {
    ...adminData,
    token,
    lastLoginAt: Date.now(),
  };

  storage.admins[adminKey].admin.lastLoginAt = admin.lastLoginAt;
  setAdminStorage(storage);

  const sessions = getAdminSessions();
  sessions[token] = admin.id;
  setAdminSessions(sessions);

  return admin;
}

export async function adminLogout(token: string): Promise<void> {
  await delay(200);
  const sessions = getAdminSessions();
  delete sessions[token];
  setAdminSessions(sessions);
}

export async function validateAdminToken(token: string): Promise<AdminUser | null> {
  await delay(100);
  const sessions = getAdminSessions();
  const adminId = sessions[token];
  if (!adminId) return null;

  const storage = getAdminStorage();
  for (const key of Object.keys(storage.admins)) {
    if (storage.admins[key].admin.id === adminId) {
      return {
        ...storage.admins[key].admin,
        token,
      } as AdminUser;
    }
  }
  return null;
}

export async function getAdminDashboardData(
  token: string,
  dateRange: { start: number; end: number }
): Promise<AdminDashboardData> {
  await delay(800);

  const sessions = getAdminSessions();
  if (!sessions[token]) {
    throw new Error('登录已过期，请重新登录');
  }

  const userStorage = getCloudUserStorage();
  const dataStorage = getCloudDataStorage();

  const stats = calculateDashboardStats(userStorage, dataStorage, dateRange);

  const daysDiff = Math.ceil((dateRange.end - dateRange.start) / 86400000);
  const daysToGenerate = Math.min(Math.max(daysDiff, 7), 30);
  const dailyTrend = generateMockDailyTrend(daysToGenerate);
  const regionDistribution = generateMockRegionData();

  return {
    stats,
    dailyTrend,
    regionDistribution,
    lastUpdated: Date.now(),
    dataFrom: dateRange.start,
    dataTo: dateRange.end,
  };
}
