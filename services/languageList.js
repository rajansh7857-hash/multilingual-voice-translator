// Supported Languages Configuration for PolyGlot Live
// Maps language codes to BCP-47 recognition/synthesis tags, native names, and emojis

const SUPPORTED_LANGUAGES = [
  { code: 'en', bcp47: 'en-US', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', bcp47: 'es-ES', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'hi', bcp47: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', bcp47: 'fr-FR', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', bcp47: 'de-DE', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', bcp47: 'ja-JP', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', bcp47: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
  { code: 'ar', bcp47: 'ar-SA', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'ru', bcp47: 'ru-RU', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'pt', bcp47: 'pt-BR', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'it', bcp47: 'it-IT', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ko', bcp47: 'ko-KR', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'bn', bcp47: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', bcp47: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', bcp47: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', bcp47: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', bcp47: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ur', bcp47: 'ur-PK', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'tr', bcp47: 'tr-TR', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'vi', bcp47: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', bcp47: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'nl', bcp47: 'nl-NL', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', bcp47: 'pl-PL', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'uk', bcp47: 'uk-UA', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  { code: 'th', bcp47: 'th-TH', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  { code: 'sv', bcp47: 'sv-SE', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'el', bcp47: 'el-GR', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', bcp47: 'cs-CZ', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'ro', bcp47: 'ro-RO', name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  { code: 'hu', bcp47: 'hu-HU', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  { code: 'he', bcp47: 'he-IL', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' }
];

function getLanguage(code) {
  if (!code) return SUPPORTED_LANGUAGES[0];
  const normalized = code.toLowerCase().trim();
  return (
    SUPPORTED_LANGUAGES.find(
      (lang) =>
        lang.code.toLowerCase() === normalized ||
        lang.bcp47.toLowerCase() === normalized ||
        lang.bcp47.split('-')[0].toLowerCase() === normalized
    ) || SUPPORTED_LANGUAGES[0]
  );
}

module.exports = {
  SUPPORTED_LANGUAGES,
  getLanguage
};

