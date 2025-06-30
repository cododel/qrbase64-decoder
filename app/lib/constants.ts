export const QR_SCANNER_CONFIG = {
  DEFAULT_WIDTH: 640,
  DEFAULT_HEIGHT: 480,
  SCAN_INTERVAL: 100, // ms between scan attempts
  VIDEO_TIMEOUT: 5000, // ms to wait for video to initialize
} as const;

export const CAMERA_CONSTRAINTS = {
  DEFAULT: {
    video: {
      width: { ideal: QR_SCANNER_CONFIG.DEFAULT_WIDTH },
      height: { ideal: QR_SCANNER_CONFIG.DEFAULT_HEIGHT },
      facingMode: "environment" as const,
    },
    audio: false,
  },
} as const;

export const ERROR_MESSAGES = {
  CAMERA_ACCESS_DENIED: "Camera access denied",
  CAMERA_NOT_FOUND: "No camera found",
  QR_SCAN_FAILED: "Failed to scan QR code",
  VIDEO_INIT_FAILED: "Failed to initialize video",
  UNSUPPORTED_BROWSER: "Browser does not support camera access",
} as const;