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
  const MUNICIPALITY_BOUNDS: { province: string; city: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
    { province: '北京', city: '北京', minLat: 39.44, maxLat: 41.06, minLng: 115.42, maxLng: 117.50 },
    { province: '天津', city: '天津', minLat: 38.57, maxLat: 40.15, minLng: 116.73, maxLng: 118.05 },
    { province: '上海', city: '上海', minLat: 30.68, maxLat: 31.87, minLng: 120.95, maxLng: 122.15 },
    { province: '重庆', city: '重庆', minLat: 28.16, maxLat: 32.21, minLng: 105.29, maxLng: 110.20 },
  ];

  const PROVINCE_BOUNDS: { province: string; city: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
    { province: '黑龙江', city: '哈尔滨', minLat: 43.40, maxLat: 53.56, minLng: 121.18, maxLng: 135.06 },
    { province: '吉林', city: '长春', minLat: 40.87, maxLat: 46.30, minLng: 121.64, maxLng: 131.31 },
    { province: '辽宁', city: '沈阳', minLat: 38.43, maxLat: 43.49, minLng: 118.83, maxLng: 125.75 },
    { province: '河北', city: '石家庄', minLat: 36.05, maxLat: 42.62, minLng: 113.45, maxLng: 119.90 },
    { province: '山东', city: '济南', minLat: 34.38, maxLat: 38.40, minLng: 114.77, maxLng: 122.71 },
    { province: '河南', city: '郑州', minLat: 31.38, maxLat: 36.37, minLng: 110.35, maxLng: 116.65 },
    { province: '山西', city: '太原', minLat: 34.58, maxLat: 40.74, minLng: 110.24, maxLng: 114.57 },
    { province: '陕西', city: '西安', minLat: 31.72, maxLat: 39.59, minLng: 105.47, maxLng: 111.16 },
    { province: '甘肃', city: '兰州', minLat: 32.62, maxLat: 42.82, minLng: 92.35, maxLng: 108.72 },
    { province: '四川', city: '成都', minLat: 26.05, maxLat: 34.32, minLng: 97.22, maxLng: 108.55 },
    { province: '湖北', city: '武汉', minLat: 29.03, maxLat: 33.27, minLng: 108.30, maxLng: 116.12 },
    { province: '湖南', city: '长沙', minLat: 24.64, maxLat: 30.16, minLng: 108.77, maxLng: 114.26 },
    { province: '江西', city: '南昌', minLat: 24.38, maxLat: 30.07, minLng: 113.55, maxLng: 118.51 },
    { province: '安徽', city: '合肥', minLat: 29.40, maxLat: 34.65, minLng: 114.88, maxLng: 119.63 },
    { province: '浙江', city: '杭州', minLat: 27.08, maxLat: 31.18, minLng: 118.02, maxLng: 123.12 },
    { province: '江苏', city: '南京', minLat: 30.76, maxLat: 35.12, minLng: 116.36, maxLng: 121.95 },
    { province: '福建', city: '福州', minLat: 23.33, maxLat: 28.31, minLng: 115.85, maxLng: 120.77 },
    { province: '广东', city: '广州', minLat: 20.13, maxLat: 25.32, minLng: 109.68, maxLng: 117.20 },
    { province: '广西', city: '南宁', minLat: 20.54, maxLat: 26.42, minLng: 104.28, maxLng: 112.13 },
    { province: '云南', city: '昆明', minLat: 21.14, maxLat: 29.22, minLng: 97.52, maxLng: 106.20 },
    { province: '贵州', city: '贵阳', minLat: 24.63, maxLat: 29.18, minLng: 103.58, maxLng: 109.59 },
    { province: '海南', city: '海口', minLat: 18.10, maxLat: 20.22, minLng: 108.62, maxLng: 111.05 },
    { province: '内蒙古', city: '呼和浩特', minLat: 37.41, maxLat: 53.55, minLng: 97.17, maxLng: 126.07 },
    { province: '新疆', city: '乌鲁木齐', minLat: 34.33, maxLat: 49.19, minLng: 73.50, maxLng: 96.40 },
    { province: '西藏', city: '拉萨', minLat: 26.50, maxLat: 36.50, minLng: 78.40, maxLng: 99.10 },
    { province: '青海', city: '西宁', minLat: 31.60, maxLat: 39.20, minLng: 89.40, maxLng: 103.07 },
    { province: '宁夏', city: '银川', minLat: 35.25, maxLat: 39.40, minLng: 104.28, maxLng: 107.70 },
  ];

  for (const region of MUNICIPALITY_BOUNDS) {
    if (lat >= region.minLat && lat <= region.maxLat && lng >= region.minLng && lng <= region.maxLng) {
      return { province: region.province, city: region.city };
    }
  }

  for (const region of PROVINCE_BOUNDS) {
    if (lat >= region.minLat && lat <= region.maxLat && lng >= region.minLng && lng <= region.maxLng) {
      return { province: region.province, city: region.city };
    }
  }

  return null;
}

const REGION_VERIFICATION_CASES: { lat: number; lng: number; expectedProvince: string; expectedCity: string; label: string }[] = [
  { lat: 31.2304, lng: 121.4737, expectedProvince: '上海', expectedCity: '上海', label: '上海人民广场' },
  { lat: 39.9042, lng: 116.4074, expectedProvince: '北京', expectedCity: '北京', label: '北京天安门' },
  { lat: 29.5630, lng: 106.5516, expectedProvince: '重庆', expectedCity: '重庆', label: '重庆解放碑' },
  { lat: 39.0842, lng: 117.2008, expectedProvince: '天津', expectedCity: '天津', label: '天津火车站' },
  { lat: 23.1291, lng: 113.2644, expectedProvince: '广东', expectedCity: '广州', label: '广州珠江新城' },
  { lat: 30.5728, lng: 104.0668, expectedProvince: '四川', expectedCity: '成都', label: '成都天府广场' },
];

export function verifyRegionMapping(): { passed: boolean; results: { label: string; passed: boolean; expected: string; actual: string }[] } {
  const results = REGION_VERIFICATION_CASES.map((testCase) => {
    const result = latLngToRegion(testCase.lat, testCase.lng);
    const actual = result ? `${result.province}·${result.city}` : '未匹配';
    const expected = `${testCase.expectedProvince}·${testCase.expectedCity}`;
    const passed = result?.province === testCase.expectedProvince && result?.city === testCase.expectedCity;
    return {
      label: testCase.label,
      passed,
      expected,
      actual,
    };
  });

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
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
