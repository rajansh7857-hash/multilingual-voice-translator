// Multi-engine Translation Service with In-Memory Caching & Resilient Fallbacks
const { translate } = require('@vitalets/google-translate-api');
const { getLanguage } = require('./languageList');

// In-memory translation cache to optimize speed and avoid duplicate network calls
// Key format: `${srcLang}->${targetLang}:${text.toLowerCase().trim()}`
const translationCache = new Map();
const MAX_CACHE_SIZE = 5000;

function setCache(key, value) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest 500 entries
    const keys = Array.from(translationCache.keys()).slice(0, 500);
    keys.forEach((k) => translationCache.delete(k));
  }
  translationCache.set(key, value);
}

/**
 * Primary translation using @vitalets/google-translate-api
 */
async function translateWithGoogleApi(text, fromLang, toLang) {
  const result = await translate(text, {
    from: fromLang === 'auto' ? 'auto' : fromLang,
    to: toLang
  });
  return result.text;
}

/**
 * Fallback translation using Google Translate free web endpoint
 */
async function translateWithWebEndpoint(text, fromLang, toLang) {
  const from = fromLang === 'auto' ? 'auto' : fromLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    from
  )}&tl=${encodeURIComponent(toLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Web endpoint error: ${response.statusText}`);
  }
  const data = await response.json();
  if (data && data[0]) {
    return data[0].map((item) => item[0]).filter(Boolean).join('');
  }
  throw new Error('Unexpected translation response format');
}

/**
 * Fallback translation using MyMemory free API
 */
async function translateWithMyMemory(text, fromLang, toLang) {
  const langPair = `${fromLang}|${toLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(langPair)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MyMemory endpoint error: ${response.statusText}`);
  }
  const data = await response.json();
  if (data && data.responseData && data.responseData.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error('MyMemory translation failed');
}

/**
 * Translate single text from source language to target language
 */
async function translateText(text, fromLang = 'auto', toLang = 'en') {
  if (!text || !text.trim()) return '';

  const cleanText = text.trim();
  const normalizedFrom = fromLang.split('-')[0].toLowerCase();
  const normalizedTo = toLang.split('-')[0].toLowerCase();

  // If source and target are identical, return original
  if (normalizedFrom === normalizedTo && normalizedFrom !== 'auto') {
    return cleanText;
  }

  const cacheKey = `${normalizedFrom}->${normalizedTo}:${cleanText.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  let translated = null;

  // 1. Try Primary Google Translate API
  try {
    translated = await translateWithGoogleApi(cleanText, normalizedFrom, normalizedTo);
  } catch (err1) {
    console.warn(`[Translation] Primary API warning for ${normalizedFrom}->${normalizedTo}:`, err1.message);
    
    // 2. Try Google Web GTX Endpoint
    try {
      translated = await translateWithWebEndpoint(cleanText, normalizedFrom, normalizedTo);
    } catch (err2) {
      console.warn(`[Translation] Secondary API warning for ${normalizedFrom}->${normalizedTo}:`, err2.message);
      
      // 3. Try MyMemory Fallback
      try {
        translated = await translateWithMyMemory(cleanText, normalizedFrom, normalizedTo);
      } catch (err3) {
        console.error(`[Translation] All translation engines failed for ${normalizedFrom}->${normalizedTo}:`, err3.message);
        // Fallback to original text if everything fails
        translated = cleanText;
      }
    }
  }

  if (translated) {
    setCache(cacheKey, translated);
  }

  return translated || cleanText;
}

/**
 * Translate text to multiple target languages in parallel
 * @param {string} text - Spoken text to translate
 * @param {string} fromLang - Source language code (e.g., 'hi', 'en', 'es')
 * @param {string[]} targetLanguages - Array of target language codes (e.g. ['es', 'ja', 'fr', 'en'])
 * @returns {Promise<Object>} Map of { [targetLang]: translatedText }
 */
async function translateToMultiple(text, fromLang, targetLanguages) {
  const uniqueLangs = Array.from(new Set(targetLanguages));
  const translations = {};

  const translationPromises = uniqueLangs.map(async (targetLang) => {
    try {
      const translated = await translateText(text, fromLang, targetLang);
      translations[targetLang] = translated;
    } catch (error) {
      console.error(`Failed to translate to ${targetLang}:`, error);
      translations[targetLang] = text; // Fallback to original
    }
  });

  await Promise.all(translationPromises);
  return translations;
}

module.exports = {
  translateText,
  translateToMultiple
};

