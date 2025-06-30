import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import QRScanner from "~/components/QRScanner";
import type { QRScanResult } from "~/types";

export const meta: MetaFunction = () => {
  return [
    { title: "QR Scanner - Декодер" },
    { name: "description", content: "QR сканер с поддержкой множественных методов декодирования" },
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="max-w-md mx-auto text-center p-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            QR Scanner
          </h1>
          <p className="text-gray-300 mb-8">
            Сканирование QR кодов с поддержкой различных методов декодирования
          </p>
          <button 
            onClick={() => setStarted(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-colors shadow-lg"
          >
            Начать сканирование
          </button>
        </div>
      </div>
    );
  }

      return (
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto p-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-2">QR Scanner</h1>
            <p className="text-gray-300">Сканирование QR кодов с поддержкой различных методов декодирования</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
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
