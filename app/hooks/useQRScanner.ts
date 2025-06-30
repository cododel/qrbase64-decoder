import { useEffect, useRef, useState, useCallback } from "react";
import type { QRScanResult, ScannerState, CameraDevice } from "~/types";
import { ERROR_MESSAGES } from "~/lib/constants";

interface UseQRScannerOptions {
  onScan?: (result: QRScanResult) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean;
}

interface UseQRScannerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  state: ScannerState;
  startScanning: (deviceId?: string) => Promise<void>;
  stopScanning: () => void;
  switchDevice: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
}

export function useQRScanner(options: UseQRScannerOptions = {}): UseQRScannerReturn {
  const { onScan, onError, autoStart = false } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    isInitialized: false,
    error: null,
    devices: [],
    selectedDeviceId: null,
  });

  const updateState = useCallback((updates: Partial<ScannerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      // Request camera permissions first
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === "videoinput")
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
          kind: device.kind,
        }));

      return videoDevices;
    } catch (error) {
      const message = error instanceof Error ? error.message : ERROR_MESSAGES.CAMERA_ACCESS_DENIED;
      throw new Error(message);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await getDevices();
      updateState({ devices, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      updateState({ error: errorMessage });
      onError?.(new Error(errorMessage));
    }
  }, [getDevices, updateState, onError]);

  const startScanning = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) {
      throw new Error("Video element not available");
    }

    try {
      updateState({ isScanning: true, error: null });

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const video = videoRef.current;
      video.srcObject = stream;
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(void 0);
        video.onerror = () => reject(new Error(ERROR_MESSAGES.VIDEO_INIT_FAILED));
        video.play();
      });

      updateState({ 
        selectedDeviceId: deviceId || null,
        isInitialized: true 
      });

      // Note: Actual QR scanning would need @zxing/library integration
      // This is a placeholder for the scanning logic
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      updateState({ isScanning: false, error: errorMessage });
      onError?.(new Error(errorMessage));
      throw error;
    }
  }, [updateState, onError]);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    updateState({
      isScanning: false,
      isInitialized: false,
      selectedDeviceId: null,
    });
  }, [updateState]);

  const switchDevice = useCallback(async (deviceId: string) => {
    stopScanning();
    await startScanning(deviceId);
  }, [stopScanning, startScanning]);

  // Initialize devices on mount
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Auto-start scanning if requested
  useEffect(() => {
    if (autoStart && state.devices.length > 0 && !state.isScanning) {
      const preferredDevice = state.devices.find(device => 
        device.label.toLowerCase().includes("back") || 
        device.label.toLowerCase().includes("environment")
      ) || state.devices[0];
      
      startScanning(preferredDevice.deviceId).catch(console.error);
    }
  }, [autoStart, state.devices, state.isScanning, startScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    state,
    startScanning,
    stopScanning,
    switchDevice,
    refreshDevices,
  };
}