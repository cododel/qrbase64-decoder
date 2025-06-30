export interface QRScanResult {
  text: string;
  rawData: Uint8ClampedArray;
  timestamp: number;
  format: string;
}

export interface VideoConstraints {
  deviceId?: string;
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export interface ScannerState {
  isScanning: boolean;
  isInitialized: boolean;
  error: string | null;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
}

export interface QRDetectorProps {
  onScan?: (result: QRScanResult) => void;
  onError?: (error: Error) => void;
  videoConstraints?: VideoConstraints;
  className?: string;
}