import { GeoLocation, AnonymizedLocationRecord, LocationSharingSettings } from '@/types';
import * as heatmapService from './heatmapService';

const GEOHASH_PRECISION = {
  coarse: 3,
  medium: 4,
  fine: 5,
};

const GRID_SIZE_DEGREES = {
  coarse: 0.05,
  medium: 0.02,
  fine: 0.01,
};

export function getCurrentPosition(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn('位置获取失败:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }
    );
  });
}

export function requestLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(false);
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        if (result.state === 'granted') {
          resolve(true);
          return;
        }
        if (result.state === 'denied') {
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 10000 }
        );
      })
      .catch(() => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 10000 }
        );
      });
  });
}

export function checkLocationPermission(): Promise<PermissionState | 'unsupported'> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve('unsupported');
      return;
    }

    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((result) => {
        resolve(result.state);
      })
      .catch(() => {
        resolve('prompt');
      });
  });
}

export function anonymizeLocation(
  location: GeoLocation,
  precision: LocationSharingSettings['precision'] = 'medium'
): { gridLat: number; gridLng: number } {
  const gridSize = GRID_SIZE_DEGREES[precision];

  const gridLat = Math.floor(location.lat / gridSize) * gridSize;
  const gridLng = Math.floor(location.lng / gridSize) * gridSize;

  return {
    gridLat: Number(gridLat.toFixed(6)),
    gridLng: Number(gridLng.toFixed(6)),
  };
}

export function formatGridLabel(gridLat: number, gridLng: number): string {
  const latDir = gridLat >= 0 ? 'N' : 'S';
  const lngDir = gridLng >= 0 ? 'E' : 'W';
  return `${Math.abs(gridLat).toFixed(3)}°${latDir}, ${Math.abs(gridLng).toFixed(3)}°${lngDir}`;
}

export async function uploadAnonymizedLocation(
  recordId: string,
  location: GeoLocation,
  timestamp: number,
  precision: LocationSharingSettings['precision'] = 'medium'
): Promise<boolean> {
  try {
    const anonymized = anonymizeLocation(location, precision);
    const hour = new Date(timestamp).getHours();

    const record: AnonymizedLocationRecord = {
      ...anonymized,
      hour,
      timestamp,
      recordId,
    };

    await heatmapService.addAnonymizedRecord(record);
    return true;
  } catch (error) {
    console.error('上传脱敏位置数据失败:', error);
    return false;
  }
}

export function getGridSizeMeters(
  precision: LocationSharingSettings['precision'],
  latitude: number
): number {
  const gridSizeDeg = GRID_SIZE_DEGREES[precision];
  const latRadians = (latitude * Math.PI) / 180;
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(latRadians);

  const avgMeters = (metersPerDegreeLat + metersPerDegreeLng) / 2;
  return Math.round(gridSizeDeg * avgMeters);
}

export function calculateDistance(
  loc1: GeoLocation,
  loc2: GeoLocation
): number {
  const R = 6371000;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
