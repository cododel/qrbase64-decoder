import type { DecodingMethod, DecodingResult, DecodingOption } from "~/types";

// Доступные методы декодирования
export const DECODING_OPTIONS: DecodingOption[] = [
  {
    id: "base64",
    name: "Base64",
    description: "Декодирование Base64 строк",
    icon: "🔤"
  },
  {
    id: "url",
    name: "URL Decode",
    description: "Декодирование URL-кодированных строк",
    icon: "🌐"
  },
  {
    id: "hex",
    name: "Hex",
    description: "Декодирование шестнадцатеричных строк",
    icon: "🔢"
  },
  {
    id: "rot13",
    name: "ROT13",
    description: "Декодирование ROT13 шифра",
    icon: "🔄"
  },
  {
    id: "caesar",
    name: "Caesar Cipher",
    description: "Декодирование шифра Цезаря (сдвиг на 3)",
    icon: "🏛️"
  },
  {
    id: "reverse",
    name: "Reverse",
    description: "Обращение строки задом наперед",
    icon: "↩️"
  },
  {
    id: "password-protected",
    name: "Password Protected",
    description: "Простое XOR шифрование с паролем",
    icon: "🔐",
    requiresPassword: true
  },
  {
    id: "json",
    name: "JSON",
    description: "Форматирование JSON с отступами",
    icon: "📋"
  },
  {
    id: "none",
    name: "Без декодирования",
    description: "Показать оригинальный текст как есть",
    icon: "📝"
  }
];

// Base64 декодирование
function decodeBase64(text: string): DecodingResult {
  try {
    // Проверяем, является ли строка валидным Base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) {
      return {
        success: false,
        decodedText: text,
        originalText: text,
        method: "base64",
        error: "Не является валидным Base64"
      };
    }
    
    const decoded = atob(text);
    return {
      success: true,
      decodedText: decoded,
      originalText: text,
      method: "base64"
    };
  } catch (error) {
    return {
      success: false,
      decodedText: text,
      originalText: text,
      method: "base64",
      error: "Ошибка декодирования Base64"
    };
  }
}

// URL декодирование
function decodeURL(text: string): DecodingResult {
  try {
    const decoded = decodeURIComponent(text);
    return {
      success: true,
      decodedText: decoded,
      originalText: text,
      method: "url"
    };
  } catch (error) {
    return {
      success: false,
      decodedText: text,
      originalText: text,
      method: "url",
      error: "Ошибка URL декодирования"
    };
  }
}

// Hex декодирование
function decodeHex(text: string): DecodingResult {
  try {
    // Убираем пробелы и проверяем валидность hex
    const cleanHex = text.replace(/\s/g, '');
    if (!/^[0-9A-Fa-f]*$/.test(cleanHex) || cleanHex.length % 2 !== 0) {
      return {
        success: false,
        decodedText: text,
        originalText: text,
        method: "hex",
        error: "Не является валидным Hex"
      };
    }
    
    const decoded = cleanHex.match(/.{2}/g)?.map(byte => 
      String.fromCharCode(parseInt(byte, 16))
    ).join('') || '';
    
    return {
      success: true,
      decodedText: decoded,
      originalText: text,
      method: "hex"
    };
  } catch (error) {
    return {
      success: false,
      decodedText: text,
      originalText: text,
      method: "hex",
      error: "Ошибка Hex декодирования"
    };
  }
}

// ROT13 декодирование
function decodeROT13(text: string): DecodingResult {
  const decoded = text.replace(/[A-Za-z]/g, (char) => {
    const start = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
  });
  
  return {
    success: true,
    decodedText: decoded,
    originalText: text,
    method: "rot13"
  };
}

// Caesar cipher декодирование (сдвиг на 3)
function decodeCaesar(text: string): DecodingResult {
  const decoded = text.replace(/[A-Za-z]/g, (char) => {
    const start = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - start - 3 + 26) % 26) + start);
  });
  
  return {
    success: true,
    decodedText: decoded,
    originalText: text,
    method: "caesar"
  };
}

// Обращение строки
function decodeReverse(text: string): DecodingResult {
  const decoded = text.split('').reverse().join('');
  
  return {
    success: true,
    decodedText: decoded,
    originalText: text,
    method: "reverse"
  };
}

// Простое XOR шифрование с паролем
function decodePasswordProtected(text: string, password: string): DecodingResult {
  try {
    if (!password) {
      return {
        success: false,
        decodedText: text,
        originalText: text,
        method: "password-protected",
        error: "Пароль обязателен"
      };
    }
    
    // Простое XOR декодирование
    let decoded = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = password.charCodeAt(i % password.length);
      decoded += String.fromCharCode(textChar ^ keyChar);
    }
    
    return {
      success: true,
      decodedText: decoded,
      originalText: text,
      method: "password-protected"
    };
  } catch (error) {
    return {
      success: false,
      decodedText: text,
      originalText: text,
      method: "password-protected",
      error: "Ошибка декодирования с паролем"
    };
  }
}

// JSON форматирование
function decodeJSON(text: string): DecodingResult {
  try {
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, 2);
    
    return {
      success: true,
      decodedText: formatted,
      originalText: text,
      method: "json"
    };
  } catch (error) {
    return {
      success: false,
      decodedText: text,
      originalText: text,
      method: "json",
      error: "Не является валидным JSON"
    };
  }
}

// Без декодирования
function decodeNone(text: string): DecodingResult {
  return {
    success: true,
    decodedText: text,
    originalText: text,
    method: "none"
  };
}

// Основная функция декодирования
export function decodeContent(
  text: string, 
  method: DecodingMethod, 
  password?: string
): DecodingResult {
  switch (method) {
    case "base64":
      return decodeBase64(text);
    case "url":
      return decodeURL(text);
    case "hex":
      return decodeHex(text);
    case "rot13":
      return decodeROT13(text);
    case "caesar":
      return decodeCaesar(text);
    case "reverse":
      return decodeReverse(text);
    case "password-protected":
      return decodePasswordProtected(text, password || '');
    case "json":
      return decodeJSON(text);
    case "none":
    default:
      return decodeNone(text);
  }
}

// Автоматическое определение типа кодирования
export function detectEncodingType(text: string): DecodingMethod {
  // Base64 проверка
  if (/^[A-Za-z0-9+/]*={0,2}$/.test(text) && text.length % 4 === 0) {
    try {
      atob(text);
      return "base64";
    } catch (e) {
      // Не Base64
    }
  }
  
  // URL encoding проверка
  if (text.includes('%') && /^[A-Za-z0-9%._~:/?#[\]@!$&'()*+,;=-]*$/.test(text)) {
    return "url";
  }
  
  // Hex проверка
  if (/^[0-9A-Fa-f\s]*$/.test(text) && text.replace(/\s/g, '').length % 2 === 0) {
    return "hex";
  }
  
  // JSON проверка
  if ((text.startsWith('{') && text.endsWith('}')) || 
      (text.startsWith('[') && text.endsWith(']'))) {
    try {
      JSON.parse(text);
      return "json";
    } catch (e) {
      // Не JSON
    }
  }
  
  // По умолчанию Base64 (как было изначально)
  return "base64";
}