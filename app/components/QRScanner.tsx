import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/library";
import type { QRScanResult, DecodingMethod, DecodingResult } from "~/types";
import { copyToClipboard } from "~/lib/helpers";
import { QR_SCANNER_CONFIG, ERROR_MESSAGES } from "~/lib/constants";
import { decodeContent, detectEncodingType, DECODING_OPTIONS } from "~/lib/decoders";

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
  decodingMethod: DecodingMethod;
  decodingPassword: string;
  decodingResult: DecodingResult | null;
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
    decodingMethod: "base64", // По умолчанию Base64
    decodingPassword: "",
    decodingResult: null,
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

            // Автоматически определяем тип кодирования и декодируем
            const detectedMethod = detectEncodingType(qrResult.text);
            const decodingResult = decodeContent(qrResult.text, detectedMethod);
            
            updateState({ 
              currentResult: qrResult,
              decodingMethod: detectedMethod,
              decodingResult
            });
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
    updateState({ 
      showPreview: false, 
      currentResult: null, 
      decodingResult: null,
      decodingPassword: ""
    });
  };

  const handleDecodingMethodChange = (method: DecodingMethod) => {
    if (state.currentResult) {
      const decodingResult = decodeContent(
        state.currentResult.text, 
        method, 
        method === "password-protected" ? state.decodingPassword : undefined
      );
      updateState({ 
        decodingMethod: method, 
        decodingResult,
        decodingPassword: method !== "password-protected" ? "" : state.decodingPassword
      });
    } else {
      updateState({ decodingMethod: method });
    }
  };

  const handlePasswordChange = (password: string) => {
    updateState({ decodingPassword: password });
    
    if (state.currentResult && state.decodingMethod === "password-protected") {
      const decodingResult = decodeContent(state.currentResult.text, "password-protected", password);
      updateState({ decodingResult });
    }
  };

  const handleCopyToClipboard = async () => {
    if (state.decodingResult && state.decodingResult.success) {
      try {
        await copyToClipboard(state.decodingResult.decodedText);
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
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-300">Инициализация камеры...</span>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-red-400 mb-4">Ошибка: {state.error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row w-full h-full ${className}`}>
      {/* Camera View */}
      <div className="flex flex-col items-center justify-center md:w-1/2 border border-gray-600 p-4 bg-gray-900">
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
            className="w-full p-2 border border-gray-600 rounded bg-gray-800 text-white"
            value={state.selectedDeviceId || ""}
            onChange={(e) => handleDeviceChange(e.target.value)}
            disabled={state.isScanning}
          >
            {state.devices.map(device => (
              <option key={device.deviceId} value={device.deviceId} className="bg-gray-800">
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!state.isScanning ? (
              <button 
                onClick={() => startScanning()}
                className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Начать сканирование
              </button>
            ) : (
              <button 
                onClick={stopScanning}
                className="flex-1 p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Остановить
              </button>
            )}

            {state.isScanning && !state.showPreview && (
              <button 
                onClick={takeScreenshot}
                className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Снимок
              </button>
            )}

            {state.showPreview && (
              <button 
                onClick={resetCamera}
                className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Сброс
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="md:w-1/2 p-4 border border-gray-600 h-full bg-gray-800">
        {state.currentResult ? (
          <div className="space-y-4">
            {/* Decoder Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Метод декодирования:
              </label>
              <select
                value={state.decodingMethod}
                onChange={(e) => handleDecodingMethodChange(e.target.value as DecodingMethod)}
                className="w-full p-2 border border-gray-600 rounded text-sm bg-gray-700 text-white"
              >
                {DECODING_OPTIONS.map(option => (
                  <option key={option.id} value={option.id} className="bg-gray-700">
                    {option.icon} {option.name}
                  </option>
                ))}
              </select>
              
              {/* Password Input for Password-Protected */}
              {state.decodingMethod === "password-protected" && (
                <div className="mt-2">
                  <input
                    type="password"
                    placeholder="Введите пароль для расшифровки"
                    value={state.decodingPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded text-sm bg-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Original Content */}
            <div>
              <h3 className="font-semibold text-sm text-gray-400 mb-1">Оригинальное содержимое:</h3>
              <div className="bg-gray-700 p-2 rounded border border-gray-600 font-mono text-xs break-all max-h-20 overflow-y-auto text-gray-300">
                {state.currentResult.text}
              </div>
            </div>

            {/* Decoded Content */}
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center text-white">
                Декодированное содержимое:
                {state.decodingResult && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    state.decodingResult.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {state.decodingResult.success ? '✓ Успешно' : '⚠ Ошибка'}
                  </span>
                )}
              </h3>
              
              {state.decodingResult ? (
                <div className="bg-gray-700 p-3 rounded border border-gray-600 font-mono text-sm whitespace-pre-wrap break-all max-h-40 overflow-y-auto text-gray-200">
                  {state.decodingResult.success ? 
                    state.decodingResult.decodedText : 
                    `Ошибка: ${state.decodingResult.error}`
                  }
                </div>
              ) : (
                <div className="bg-gray-700 p-3 rounded border border-gray-600 text-gray-400 text-sm">
                  Выберите метод декодирования
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-400">
              <p>Формат QR: {state.currentResult.format}</p>
            </div>

            <button 
              onClick={handleCopyToClipboard}
              disabled={!state.decodingResult || !state.decodingResult.success}
              className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Копировать декодированный текст
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <p>{state.isScanning ? "Сканирование QR кодов..." : "QR код не обнаружен"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}