import { BrowserQRCodeReader } from "@zxing/library";
import type { QRScanResult, VideoConstraints } from "~/types";
import { QR_SCANNER_CONFIG, ERROR_MESSAGES } from "./constants";

export class QRScanner {
  private reader: BrowserQRCodeReader;
  private controls: any = null; // @zxing/library doesn't export IScannerControls
  private onScan?: (result: QRScanResult) => void;
  private onError?: (error: Error) => void;

  constructor() {
    this.reader = new BrowserQRCodeReader();
  }

  public setCallbacks(
    onScan?: (result: QRScanResult) => void,
    onError?: (error: Error) => void
  ): void {
    this.onScan = onScan;
    this.onError = onError;
  }

  public async startScanning(
    videoElement: HTMLVideoElement,
    deviceId?: string
  ): Promise<void> {
    try {
      this.controls = await this.reader.decodeFromVideoDevice(
        deviceId || null,
        videoElement,
        (result, error) => {
          if (result) {
            const qrResult: QRScanResult = {
              text: result.getText(),
              rawData: new Uint8ClampedArray(), // @zxing doesn't provide raw data directly
              format: result.getBarcodeFormat()?.toString() || "QR_CODE",
            };
            this.onScan?.(qrResult);
          }

          if (error && this.onError) {
            // Only report meaningful errors, not every scan attempt failure
            if (error.message !== "No MultiFormat Readers were able to detect the code.") {
              this.onError(new Error(`${ERROR_MESSAGES.QR_SCAN_FAILED}: ${error.message}`));
            }
          }
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`${ERROR_MESSAGES.VIDEO_INIT_FAILED}: ${errorMessage}`);
    }
  }

  public stopScanning(): void {
    if (this.controls) {
      this.controls.stop();
      this.controls = null;
    }
  }

  public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    try {
      return await this.reader.listVideoInputDevices();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.CAMERA_NOT_FOUND);
    }
  }

  public reset(): void {
    this.reader.reset();
  }

  public dispose(): void {
    this.stopScanning();
    this.reset();
  }
}