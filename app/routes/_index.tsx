import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import QRScanner from "~/components/QRScanner";
import type { QRScanResult } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "QR Code Scanner" },
    { name: "description", content: "Modern QR code scanner with advanced detection capabilities" },
  ];
};

export default function Index() {
  const [started, setStarted] = useState(false);
  const [scanHistory, setScanHistory] = useState<QRScanResult[]>([]);

  const handleScan = (result: QRScanResult) => {
    console.log("QR Code scanned:", result);
    setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
  };

  const handleError = (error: Error) => {
    console.error("QR Scanner error:", error);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            QR Code Scanner
          </h1>
          <p className="text-gray-600 mb-8">
            Advanced QR code scanning with modern detection technology
          </p>
          <button 
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium rounded-lg transition-colors shadow-lg"
          >
            Start Scanning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
          <p className="text-gray-600">Scan QR codes using your camera</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <QRScanner 
            onScan={handleScan}
            onError={handleError}
            className="h-96"
          />
        </div>

        {scanHistory.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Scans ({scanHistory.length})
            </h2>
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <div key={scan.timestamp} className="p-3 bg-gray-50 rounded border">
                  <div className="font-mono text-sm break-all mb-1">
                    {scan.text.length > 100 ? `${scan.text.slice(0, 100)}...` : scan.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(scan.timestamp).toLocaleString()} • {scan.format}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
