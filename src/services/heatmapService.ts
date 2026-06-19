import {
  AnonymizedLocationRecord,
  NearbyHeatmapData,
  HeatmapGridCell,
  GeoLocation,
  LocationSharingSettings,
} from '@/types';
import { anonymizeLocation, calculateDistance } from './locationService';

const HEATMAP_STORAGE_PREFIX = 'bark-heatmap-';
const AGGREGATED_DATA_KEY = `${HEATMAP_STORAGE_PREFIX}aggregated`;
const RAW_RECORDS_KEY = `${HEATMAP_STORAGE_PREFIX}raw`;
const LAST_AGGREGATION_KEY = `${HEATMAP_STORAGE_PREFIX}lastAggregation`;
const NEXT_AGGREGATION_KEY = `${HEATMAP_STORAGE_PREFIX}nextAggregation`;

const GRID_SIZE = 0.02;
const DEFAULT_RADIUS = 5000;

interface RawStorage {
  records: AnonymizedLocationRecord[];
  lastUploadedAt: number;
}

interface AggregatedCell {
  gridLat: number;
  gridLng: number;
  count: number;
  lastRecordAt: number;
  hourlyCounts: Record<number, number>;
}

interface AggregatedStorage {
  cells: AggregatedCell[];
  lastAggregatedAt: number;
  dataDate: string;
  totalRecords: number;
}

function getRawStorage(): RawStorage {
  try {
    const data = localStorage.getItem(RAW_RECORDS_KEY);
    return data
      ? JSON.parse(data)
      : {
          records: [],
          lastUploadedAt: 0,
        };
  } catch {
    return { records: [], lastUploadedAt: 0 };
  }
}

function setRawStorage(storage: RawStorage): void {
  localStorage.setItem(RAW_RECORDS_KEY, JSON.stringify(storage));
}

function getAggregatedStorage(): AggregatedStorage {
  try {
    const data = localStorage.getItem(AGGREGATED_DATA_KEY);
    return data
      ? JSON.parse(data)
      : {
          cells: [],
          lastAggregatedAt: 0,
          dataDate: '',
          totalRecords: 0,
        };
  } catch {
    return { cells: [], lastAggregatedAt: 0, dataDate: '', totalRecords: 0 };
  }
}

function setAggregatedStorage(storage: AggregatedStorage): void {
  localStorage.setItem(AGGREGATED_DATA_KEY, JSON.stringify(storage));
}

function getLastAggregationDate(): string {
  return localStorage.getItem(LAST_AGGREGATION_KEY) || '';
}

function setLastAggregationDate(date: string): void {
  localStorage.setItem(LAST_AGGREGATION_KEY, date);
}

function getNextAggregationTime(): number {
  const data = localStorage.getItem(NEXT_AGGREGATION_KEY);
  return data ? parseInt(data, 10) : 0;
}

function setNextAggregationTime(timestamp: number): void {
  localStorage.setItem(NEXT_AGGREGATION_KEY, timestamp.toString());
}

function getTomorrowMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function addAnonymizedRecord(
  record: AnonymizedLocationRecord
): Promise<boolean> {
  await delay(300);

  try {
    const storage = getRawStorage();

    const existingIndex = storage.records.findIndex(
      (r) => r.recordId === record.recordId
    );
    if (existingIndex >= 0) {
      return true;
    }

    storage.records.push(record);
    storage.lastUploadedAt = Date.now();
    setRawStorage(storage);

    return true;
  } catch (error) {
    console.error('保存脱敏位置记录失败:', error);
    return false;
  }
}

export async function aggregateHeatmapData(
  force: boolean = false
): Promise<AggregatedStorage> {
  await delay(500);

  const today = new Date().toISOString().split('T')[0];
  const lastAggDate = getLastAggregationDate();

  if (!force && lastAggDate === today) {
    return getAggregatedStorage();
  }

  const rawStorage = getRawStorage();
  const aggregated = getAggregatedStorage();

  const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentRecords = rawStorage.records.filter(
    (r) => r.timestamp > cutoffTime
  );

  const cellMap = new Map<string, AggregatedCell>();

  recentRecords.forEach((record) => {
    const key = `${record.gridLat},${record.gridLng}`;
    let cell = cellMap.get(key);

    if (!cell) {
      cell = {
        gridLat: record.gridLat,
        gridLng: record.gridLng,
        count: 0,
        lastRecordAt: 0,
        hourlyCounts: {},
      };
      cellMap.set(key, cell);
    }

    cell.count++;
    cell.lastRecordAt = Math.max(cell.lastRecordAt, record.timestamp);
    cell.hourlyCounts[record.hour] = (cell.hourlyCounts[record.hour] || 0) + 1;
  });

  const cells = Array.from(cellMap.values());
  const newAggregated: AggregatedStorage = {
    cells,
    lastAggregatedAt: Date.now(),
    dataDate: today,
    totalRecords: recentRecords.length,
  };

  setAggregatedStorage(newAggregated);
  setLastAggregationDate(today);
  setNextAggregationTime(getTomorrowMidnight());

  return newAggregated;
}

export async function getNearbyHeatmap(
  centerLocation: GeoLocation,
  radius: number = DEFAULT_RADIUS,
  precision: LocationSharingSettings['precision'] = 'medium'
): Promise<NearbyHeatmapData | null> {
  await delay(400);

  const aggregated = await aggregateHeatmapData(false);

  if (aggregated.cells.length === 0) {
    return null;
  }

  const nearbyCells: HeatmapGridCell[] = [];
  let maxCount = 0;

  for (const cell of aggregated.cells) {
    const cellCenter: GeoLocation = {
      lat: cell.gridLat + GRID_SIZE / 2,
      lng: cell.gridLng + GRID_SIZE / 2,
    };

    const distance = calculateDistance(centerLocation, cellCenter);

    if (distance <= radius) {
      const intensity = cell.count;
      maxCount = Math.max(maxCount, intensity);

      nearbyCells.push({
        gridLat: cell.gridLat,
        gridLng: cell.gridLng,
        count: cell.count,
        intensity: 0,
      });
    }
  }

  nearbyCells.forEach((cell) => {
    cell.intensity = maxCount > 0 ? cell.count / maxCount : 0;
  });

  nearbyCells.sort((a, b) => b.count - a.count);

  return {
    centerLat: centerLocation.lat,
    centerLng: centerLocation.lng,
    radius,
    gridSize: GRID_SIZE,
    cells: nearbyCells,
    totalRecords: nearbyCells.reduce((sum, c) => sum + c.count, 0),
    lastUpdated: aggregated.lastAggregatedAt,
    dataDate: aggregated.dataDate,
  };
}

export async function getHeatmapStats(): Promise<{
  totalCells: number;
  totalRecords: number;
  lastAggregatedAt: number;
  dataDate: string;
  nextAggregationAt: number;
}> {
  const aggregated = getAggregatedStorage();
  const nextAgg = getNextAggregationTime();

  return {
    totalCells: aggregated.cells.length,
    totalRecords: aggregated.totalRecords,
    lastAggregatedAt: aggregated.lastAggregatedAt,
    dataDate: aggregated.dataDate,
    nextAggregationAt: nextAgg || getTomorrowMidnight(),
  };
}

export function clearOldRecords(days: number = 30): number {
  const rawStorage = getRawStorage();
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  const originalLength = rawStorage.records.length;
  rawStorage.records = rawStorage.records.filter(
    (r) => r.timestamp > cutoffTime
  );
  const removed = originalLength - rawStorage.records.length;

  if (removed > 0) {
    rawStorage.lastUploadedAt = Date.now();
    setRawStorage(rawStorage);
  }

  return removed;
}

export function generateDemoHeatmapData(
  center: GeoLocation,
  radius: number = DEFAULT_RADIUS
): NearbyHeatmapData {
  const cells: HeatmapGridCell[] = [];
  const gridSize = 0.02;
  const numCells = Math.ceil((radius / 1000) * 10);

  let maxCount = 0;
  const centerLat = center.lat;
  const centerLng = center.lng;

  for (let i = -numCells; i <= numCells; i++) {
    for (let j = -numCells; j <= numCells; j++) {
      const gridLat = Number((centerLat + i * gridSize).toFixed(6));
      const gridLng = Number((centerLng + j * gridSize).toFixed(6));

      const cellCenter: GeoLocation = {
        lat: gridLat + gridSize / 2,
        lng: gridLng + gridSize / 2,
      };

      const distance = calculateDistance(center, cellCenter);
      if (distance > radius) continue;

      const distanceFactor = Math.max(0, 1 - distance / radius);
      const randomFactor = Math.random();
      const count = Math.floor(distanceFactor * randomFactor * 50);

      if (count > 0) {
        maxCount = Math.max(maxCount, count);
        cells.push({
          gridLat,
          gridLng,
          count,
          intensity: 0,
        });
      }
    }
  }

  cells.forEach((cell) => {
    cell.intensity = maxCount > 0 ? cell.count / maxCount : 0;
  });

  cells.sort((a, b) => b.count - a.count);

  return {
    centerLat: center.lat,
    centerLng: center.lng,
    radius,
    gridSize,
    cells,
    totalRecords: cells.reduce((sum, c) => sum + c.count, 0),
    lastUpdated: Date.now(),
    dataDate: new Date().toISOString().split('T')[0],
  };
}

let aggregationTimer: number | null = null;

export function startAggregationScheduler(): void {
  if (aggregationTimer) {
    clearInterval(aggregationTimer);
  }

  const checkAndAggregate = async () => {
    const now = Date.now();
    const nextAgg = getNextAggregationTime() || getTomorrowMidnight();

    if (now >= nextAgg) {
      await aggregateHeatmapData(false);
    }
  };

  checkAndAggregate();

  aggregationTimer = window.setInterval(checkAndAggregate, 60 * 1000);
}

export function stopAggregationScheduler(): void {
  if (aggregationTimer) {
    clearInterval(aggregationTimer);
    aggregationTimer = null;
  }
}

export async function getHeatmapForGrid(
  location: GeoLocation,
  precision: LocationSharingSettings['precision'] = 'medium'
): Promise<{ gridLat: number; gridLng: number; count: number } | null> {
  const anonymized = anonymizeLocation(location, precision);
  const aggregated = getAggregatedStorage();

  const cell = aggregated.cells.find(
    (c) =>
      Math.abs(c.gridLat - anonymized.gridLat) < 0.001 &&
      Math.abs(c.gridLng - anonymized.gridLng) < 0.001
  );

  if (!cell) {
    return null;
  }

  return {
    gridLat: cell.gridLat,
    gridLng: cell.gridLng,
    count: cell.count,
  };
}
