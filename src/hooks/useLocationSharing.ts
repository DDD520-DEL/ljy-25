import { useState, useEffect, useCallback } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import { GeoLocation, LocationSharingSettings } from '@/types';
import * as locationService from '@/services/locationService';
import * as heatmapService from '@/services/heatmapService';

type CleanupTrigger = 'startup' | 'aggregation' | 'manual';

export interface CleanupLogEntry {
  timestamp: number;
  removedCount: number;
  beforeCount: number;
  afterCount: number;
  trigger: CleanupTrigger;
}

export interface HeatmapStats {
  totalCells: number;
  totalRecords: number;
  lastAggregatedAt: number;
  dataDate: string;
  nextAggregationAt: number;
  rawRecordCount: number;
  lastCleanupAt: number;
  dataRetentionDays: number;
}

export function useLocationSharing() {
  const { settings, updateSettings } = useBarkStore();
  const locationSharing = settings.locationSharing;

  const [permissionState, setPermissionState] = useState<
    PermissionState | 'unsupported' | 'loading'
  >('loading');
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [isSharingEnabled, setIsSharingEnabled] = useState(locationSharing.enabled);
  const [isLocating, setIsLocating] = useState(false);
  const [lastSharedAt, setLastSharedAt] = useState(0);

  useEffect(() => {
    const checkPermission = async () => {
      const state = await locationService.checkLocationPermission();
      setPermissionState(state);
    };
    checkPermission();
  }, []);

  useEffect(() => {
    setIsSharingEnabled(locationSharing.enabled);
  }, [locationSharing.enabled]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (permissionState === 'unsupported') {
      return false;
    }

    const granted = await locationService.requestLocationPermission();
    const newState = await locationService.checkLocationPermission();
    setPermissionState(newState);

    if (granted) {
      updateSettings({
        locationSharing: {
          ...locationSharing,
          lastGrantedAt: Date.now(),
        },
      });
    } else {
      updateSettings({
        locationSharing: {
          ...locationSharing,
          lastDeniedAt: Date.now(),
        },
      });
    }

    return granted;
  }, [permissionState, locationSharing, updateSettings]);

  const enableSharing = useCallback(async (): Promise<boolean> => {
    if (permissionState === 'unsupported') {
      return false;
    }

    if (permissionState !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return false;
      }
    }

    updateSettings({
      locationSharing: {
        ...locationSharing,
        enabled: true,
      },
    });
    setIsSharingEnabled(true);

    return true;
  }, [permissionState, requestPermission, locationSharing, updateSettings]);

  const disableSharing = useCallback(() => {
    updateSettings({
      locationSharing: {
        ...locationSharing,
        enabled: false,
      },
    });
    setIsSharingEnabled(false);
  }, [locationSharing, updateSettings]);

  const toggleSharing = useCallback(async (): Promise<boolean> => {
    if (isSharingEnabled) {
      disableSharing();
      return false;
    } else {
      return await enableSharing();
    }
  }, [isSharingEnabled, enableSharing, disableSharing]);

  const getCurrentLocation = useCallback(async (): Promise<GeoLocation | null> => {
    if (!isSharingEnabled || permissionState !== 'granted') {
      return null;
    }

    setIsLocating(true);
    try {
      const location = await locationService.getCurrentPosition();
      if (location) {
        setCurrentLocation(location);
      }
      return location;
    } finally {
      setIsLocating(false);
    }
  }, [isSharingEnabled, permissionState]);

  const shareRecordLocation = useCallback(
    async (
      recordId: string,
      location: GeoLocation,
      timestamp: number
    ): Promise<boolean> => {
      if (!isSharingEnabled) {
        return false;
      }

      const success = await locationService.uploadAnonymizedLocation(
        recordId,
        location,
        timestamp,
        locationSharing.precision
      );

      if (success) {
        setLastSharedAt(Date.now());
      }

      return success;
    },
    [isSharingEnabled, locationSharing.precision]
  );

  const setPrecision = useCallback(
    (precision: LocationSharingSettings['precision']) => {
      updateSettings({
        locationSharing: {
          ...locationSharing,
          precision,
        },
      });
    },
    [locationSharing, updateSettings]
  );

  const getNearbyHeatmap = useCallback(
    async (
      centerLocation?: GeoLocation,
      radius: number = 5000
    ) => {
      if (!isSharingEnabled) {
        return null;
      }

      const location = centerLocation || currentLocation;
      if (!location) {
        return null;
      }

      return await heatmapService.getNearbyHeatmap(
        location,
        radius,
        locationSharing.precision
      );
    },
    [isSharingEnabled, currentLocation, locationSharing.precision]
  );

  const getHeatmapStats = useCallback(
    async (): Promise<HeatmapStats | null> => {
      try {
        return await heatmapService.getHeatmapStats();
      } catch {
        return null;
      }
    },
    []
  );

  const getCleanupHistory = useCallback((): CleanupLogEntry[] => {
    try {
      return heatmapService.getCleanupHistory();
    } catch {
      return [];
    }
  }, []);

  const manualCleanup = useCallback(
    (days: number = 30) => {
      try {
        return heatmapService.clearOldRecords(days, 'manual');
      } catch {
        return { removed: 0, beforeCount: 0, afterCount: 0 };
      }
    },
    []
  );

  const forceAggregate = useCallback(async () => {
    try {
      return await heatmapService.aggregateHeatmapData(true);
    } catch {
      return null;
    }
  }, []);

  return {
    permissionState,
    isSharingEnabled,
    isLocating,
    currentLocation,
    lastSharedAt,
    precision: locationSharing.precision,
    requestPermission,
    enableSharing,
    disableSharing,
    toggleSharing,
    getCurrentLocation,
    shareRecordLocation,
    setPrecision,
    getNearbyHeatmap,
    getHeatmapStats,
    getCleanupHistory,
    manualCleanup,
    forceAggregate,
  };
}
