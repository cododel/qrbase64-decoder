import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/library";
import type { QRScanResult } from "~/types";
import { copyToClipboard, safeAtob } from "~/lib/helpers";
import { QR_SCANNER_CONFIG, ERROR_MESSAGES } from "~/lib/constants";

interface QRScannerProps {
  onScan?: (result: QRScanResult) => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface ScanState {
  isScanning: boolean;
  isInitialized: boolean;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  error: string | null;
  currentResult: QRScanResult | null; // Only current result, no history
  showPreview: boolean;
}

export default function QRScanner({ onScan, onError, className = "" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<any>(null);

  const [state, setState] = useState<ScanState>({
    isScanning: false,
    isInitialized: false,
    devices: [],
    selectedDeviceId: null,
    error: null,
    currentResult: null,
    showPreview: false,
  });

  const updateState = (updates: Partial<ScanState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Initialize QR reader
  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader();

    return () => {
      stopScanning();
      readerRef.current?.reset();
    };
  }, []);

  // Initialize devices
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        if (!readerRef.current) return;
        
        const devices = await readerRef.current.listVideoInputDevices();
        updateState({
          devices,
          selectedDeviceId: devices[0]?.deviceId || null,
          isInitialized: true,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.CAMERA_NOT_FOUND;
        updateState({ error: errorMessage, isInitialized: true });
        onError?.(new Error(errorMessage));
      }
    };

    initializeDevices();
  }, [onError]);

  const startScanning = async (deviceId?: string) => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      updateState({ isScanning: true, error: null });

      const targetDeviceId = deviceId || state.selectedDeviceId;
      
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        targetDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const qrResult: QRScanResult = {
              text: result.getText(),
              rawData: new Uint8ClampedArray(),
              format: result.getBarcodeFormat()?.toString() || "QR_CODE",
            };

            updateState({ currentResult: qrResult });
            onScan?.(qrResult);
          }

          if (error && error.message !== "No MultiFormat Readers were able to detect the code.") {
            console.warn("Scan error:", error.message);
          }
        }
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.VIDEO_INIT_FAILED;
      updateState({ isScanning: false, error: errorMessage });
      onError?.(new Error(errorMessage));
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    updateState({ isScanning: false, showPreview: false });
  };

  const takeScreenshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      updateState({ showPreview: true });
    }
  };

  const resetCamera = () => {
    updateState({ showPreview: false, currentResult: null });
  };

  const handleCopyToClipboard = async () => {
    if (state.currentResult) {
      try {
        const decodedText = safeAtob(state.currentResult.text);
        await copyToClipboard(decodedText);
      } catch (error) {
        onError?.(new Error("Failed to copy to clipboard"));
      }
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    updateState({ selectedDeviceId: deviceId });
    if (state.isScanning) {
      stopScanning();
      startScanning(deviceId);
    }
  };

  if (!state.isInitialized) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Initializing camera...</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-red-600 mb-4">Error: {state.error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row w-full h-full ${className}`}>
      {/* Camera View */}
      <div className="flex flex-col items-center justify-center md:w-1/2 border border-gray-300 p-4">
        {state.showPreview ? (
          <canvas ref={canvasRef} className="w-full max-w-lg" />
        ) : (
          <video 
            ref={videoRef} 
            className="w-full max-w-lg"
            autoPlay
            playsInline
            muted
          />
        )}
        
        <div className="flex flex-col gap-2 mt-4 w-full max-w-lg">
          {/* Device Selection */}
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={state.selectedDeviceId || ""}
            onChange={(e) => handleDeviceChange(e.target.value)}
            disabled={state.isScanning}
          >
            {state.devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!state.isScanning ? (
              <button 
                onClick={() => startScanning()}
                className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Start Scanning
              </button>
            ) : (
              <button 
                onClick={stopScanning}
                className="flex-1 p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Stop Scanning
              </button>
            )}

            {state.isScanning && !state.showPreview && (
              <button 
                onClick={takeScreenshot}
                className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Capture
              </button>
            )}

            {state.showPreview && (
              <button 
                onClick={resetCamera}
                className="flex-1 p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="md:w-1/2 p-4 border border-gray-300 h-full">
        {state.currentResult ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Decoded Content:</h3>
              <div className="bg-gray-50 p-3 rounded border font-mono text-sm whitespace-pre-wrap break-all">
                {safeAtob(state.currentResult.text)}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Format: {state.currentResult.format}</p>
              <p className="text-xs text-amber-600">⚠️ No data is stored or tracked</p>
            </div>

            <button 
              onClick={handleCopyToClipboard}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p>{state.isScanning ? "Scanning for QR codes..." : "No QR code detected"}</p>
              <p className="text-xs text-green-600 mt-2">🔒 Private scanning - no data saved</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}