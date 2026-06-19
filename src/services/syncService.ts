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

function calculateDailyTrend(
  userStorage: CloudUserStorage,
  dataStorage: CloudDataStorage,
  dateRange: { start: number; end: number }
): DailyActiveData[] {
  const allUsers = Object.values(userStorage.users);
  const daysDiff = Math.ceil((dateRange.end - dateRange.start) / 86400000);
  const days = Math.max(1, daysDiff);

  const dailyMap = new Map<string, {
    date: string;
    timestamp: number;
    activeUserIds: Set<string>;
    newUserIds: Set<string>;
    recordCount: number;
  }>();

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(dateRange.start);
    dayStart.setHours(0, 0, 0, 0);
    const d = new Date(dayStart.getTime() + i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      timestamp: d.getTime(),
      activeUserIds: new Set(),
      newUserIds: new Set(),
      recordCount: 0,
    });
  }

  allUsers.forEach((userData) => {
    const user = userData.user;
    const createdDate = new Date(user.createdAt).toISOString().split('T')[0];
    const loginDate = user.lastLoginAt > 0
      ? new Date(user.lastLoginAt).toISOString().split('T')[0]
      : null;

    if (dailyMap.has(createdDate)) {
      dailyMap.get(createdDate)!.newUserIds.add(user.id);
    }

    if (loginDate && dailyMap.has(loginDate)) {
      dailyMap.get(loginDate)!.activeUserIds.add(user.id);
    }
  });

  Object.entries(dataStorage).forEach(([userId, userData]) => {
    userData.records.forEach((record) => {
      if (record.timestamp < dateRange.start || record.timestamp > dateRange.end) return;
      const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
      const dayData = dailyMap.get(recordDate);
      if (dayData) {
        dayData.recordCount++;
        dayData.activeUserIds.add(userId);
      }
    });
  });

  return Array.from(dailyMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((d) => ({
      date: d.date,
      timestamp: d.timestamp,
      activeUsers: d.activeUserIds.size,
      newUsers: d.newUserIds.size,
      totalRecords: d.recordCount,
    }));
}

function latLngToRegion(lat: number, lng: number): { province: string; city: string } | null {
  const REGION_BOUNDS: { province: string; city: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
    { province: '黑龙江', city: '哈尔滨', minLat: 44.0, maxLat: 54.0, minLng: 121.0, maxLng: 136.0 },
    { province: '吉林', city: '长春', minLat: 40.5, maxLat: 44.0, minLng: 122.0, maxLng: 131.0 },
    { province: '辽宁', city: '沈阳', minLat: 38.5, maxLat: 43.5, minLng: 118.5, maxLng: 126.0 },
    { province: '北京', city: '北京', minLat: 39.0, maxLat: 41.5, minLng: 115.5, maxLng: 117.5 },
    { province: '天津', city: '天津', minLat: 38.5, maxLat: 40.5, minLng: 116.5, maxLng: 118.0 },
    { province: '河北', city: '石家庄', minLat: 36.0, maxLat: 42.5, minLng: 113.5, maxLng: 120.0 },
    { province: '山东', city: '济南', minLat: 34.0, maxLat: 38.5, minLng: 114.5, maxLng: 123.0 },
    { province: '河南', city: '郑州', minLat: 31.0, maxLat: 36.5, minLng: 110.0, maxLng: 116.5 },
    { province: '山西', city: '太原', minLat: 34.5, maxLat: 40.5, minLng: 110.0, maxLng: 114.5 },
    { province: '陕西', city: '西安', minLat: 31.5, maxLat: 39.5, minLng: 105.5, maxLng: 111.5 },
    { province: '甘肃', city: '兰州', minLat: 32.5, maxLat: 43.0, minLng: 92.5, maxLng: 108.5 },
    { province: '四川', city: '成都', minLat: 26.0, maxLat: 34.0, minLng: 97.0, maxLng: 108.5 },
    { province: '重庆', city: '重庆', minLat: 28.0, maxLat: 32.5, minLng: 105.0, maxLng: 110.5 },
    { province: '湖北', city: '武汉', minLat: 29.0, maxLat: 33.5, minLng: 108.5, maxLng: 116.5 },
    { province: '湖南', city: '长沙', minLat: 24.5, maxLat: 30.5, minLng: 108.5, maxLng: 114.5 },
    { province: '江西', city: '南昌', minLat: 24.5, maxLat: 30.5, minLng: 113.5, maxLng: 118.5 },
    { province: '安徽', city: '合肥', minLat: 29.0, maxLat: 34.5, minLng: 114.5, maxLng: 119.5 },
    { province: '浙江', city: '杭州', minLat: 27.0, maxLat: 31.5, minLng: 118.0, maxLng: 123.0 },
    { province: '江苏', city: '南京', minLat: 30.5, maxLat: 35.0, minLng: 116.5, maxLng: 121.5 },
    { province: '上海', city: '上海', minLat: 30.5, maxLat: 31.9, minLng: 120.5, maxLng: 122.5 },
    { province: '福建', city: '福州', minLat: 23.5, maxLat: 28.5, minLng: 115.5, maxLng: 120.5 },
    { province: '广东', city: '广州', minLat: 20.0, maxLat: 25.5, minLng: 109.5, maxLng: 117.5 },
    { province: '广西', city: '南宁', minLat: 20.5, maxLat: 26.5, minLng: 104.5, maxLng: 112.5 },
    { province: '云南', city: '昆明', minLat: 21.0, maxLat: 29.5, minLng: 97.0, maxLng: 106.5 },
    { province: '贵州', city: '贵阳', minLat: 25.0, maxLat: 29.5, minLng: 103.5, maxLng: 109.5 },
    { province: '海南', city: '海口', minLat: 18.0, maxLat: 20.5, minLng: 108.5, maxLng: 111.5 },
    { province: '内蒙古', city: '呼和浩特', minLat: 37.0, maxLat: 53.5, minLng: 97.0, maxLng: 126.5 },
    { province: '新疆', city: '乌鲁木齐', minLat: 34.0, maxLat: 49.5, minLng: 73.0, maxLng: 96.5 },
    { province: '西藏', city: '拉萨', minLat: 26.0, maxLat: 37.0, minLng: 78.0, maxLng: 99.5 },
    { province: '青海', city: '西宁', minLat: 31.5, maxLat: 39.5, minLng: 89.5, maxLng: 103.5 },
    { province: '宁夏', city: '银川', minLat: 35.0, maxLat: 39.5, minLng: 104.0, maxLng: 107.5 },
  ];

  for (const region of REGION_BOUNDS) {
    if (lat >= region.minLat && lat <= region.maxLat && lng >= region.minLng && lng <= region.maxLng) {
      return { province: region.province, city: region.city };
    }
  }
  return null;
}

function calculateRegionDistribution(
  dataStorage: CloudDataStorage,
  dateRange: { start: number; end: number }
): RegionData[] {
  const regionMap = new Map<string, {
    province: string;
    city: string;
    lat: number;
    lng: number;
    userIds: Set<string>;
    recordCount: number;
  }>();

  Object.entries(dataStorage).forEach(([userId, userData]) => {
    const recordsInRange = userData.records.filter(
      (r) => r.timestamp >= dateRange.start && r.timestamp <= dateRange.end
    );

    recordsInRange.forEach((record) => {
      if (!record.geoLocation) return;

      const region = latLngToRegion(record.geoLocation.lat, record.geoLocation.lng);
      if (!region) return;

      const key = `${region.province}-${region.city}`;
      if (!regionMap.has(key)) {
        regionMap.set(key, {
          province: region.province,
          city: region.city,
          lat: record.geoLocation.lat,
          lng: record.geoLocation.lng,
          userIds: new Set(),
          recordCount: 0,
        });
      }

      const entry = regionMap.get(key)!;
      entry.userIds.add(userId);
      entry.recordCount++;
      entry.lat = (entry.lat * (entry.recordCount - 1) + record.geoLocation.lat) / entry.recordCount;
      entry.lng = (entry.lng * (entry.recordCount - 1) + record.geoLocation.lng) / entry.recordCount;
    });
  });

  return Array.from(regionMap.values())
    .map((entry) => ({
      province: entry.province,
      city: entry.city,
      lat: Math.round(entry.lat * 10000) / 10000,
      lng: Math.round(entry.lng * 10000) / 10000,
      userCount: entry.userIds.size,
      recordCount: entry.recordCount,
    }))
    .sort((a, b) => b.recordCount - a.recordCount);
}

function calculateDashboardStats(
  userStorage: CloudUserStorage,
  dataStorage: CloudDataStorage,
  dateRange: { start: number; end: number }
): AdminDashboardStats {
  const allUsers = Object.values(userStorage.users);
  const totalUsers = allUsers.length;

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

  const dailyTrend = calculateDailyTrend(userStorage, dataStorage, dateRange);
  const regionDistribution = calculateRegionDistribution(dataStorage, dateRange);

  return {
    stats,
    dailyTrend,
    regionDistribution,
    lastUpdated: Date.now(),
    dataFrom: dateRange.start,
    dataTo: dateRange.end,
  };
}
