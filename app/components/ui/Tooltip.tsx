import { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 mt-2 text-sm text-gray-200 bg-gray-800 border border-gray-600 rounded-lg shadow-xl -left-32">
          <div className="relative">
            {content}
            {/* Стрелка указывающая на элемент */}
            <div className="absolute -top-2 left-32 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
          </div>
          {/* Кнопка закрытия */}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}