import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import QRScanner from "~/components/QRScanner";
import type { QRScanResult } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "Private QR Code Scanner" },
    { name: "description", content: "Private QR code scanner with base64 decoding - no data tracking" },
  ];
};

export default function Index() {
  const [started, setStarted] = useState(false);

  const handleScan = (result: QRScanResult) => {
    // No logging or tracking - privacy first
  };

  const handleError = (error: Error) => {
    // Only log errors locally, no tracking
    console.error("QR Scanner error:", error);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Private QR Scanner
          </h1>
          <p className="text-gray-600 mb-8">
            Secure QR code scanning with base64 decoding - your data stays private
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Private QR Scanner</h1>
          <p className="text-gray-600">Secure QR code scanning with base64 decoding - no data storage</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <QRScanner 
            onScan={handleScan}
            onError={handleError}
            className="h-96"
          />
        </div>
      </div>
    </div>
  );
}
