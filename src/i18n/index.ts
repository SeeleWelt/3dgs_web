import zh from './locales/zh';
import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import ja from './locales/ja';
import ru from './locales/ru';
import es from './locales/es';
import { createI18n } from 'vue-i18n'

// 语言配置
const messages = {
  zh,
  en,
  de,
  fr,
  ja,
  ru,
  es
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'zh',
  fallbackLocale: 'zh',
  messages,
})

export default i18n

// 语言列表
export const languages = [
  { code: 'zh', name: '中文', flagClass: 'cn' }, // 中国
  { code: 'en', name: 'English', flagClass: 'gb' }, // 英国（英语）
  { code: 'de', name: 'Deutsch', flagClass: 'de' }, // 德国
  { code: 'fr', name: 'Français', flagClass: 'fr' }, // 法国
  { code: 'ja', name: '日本語', flagClass: 'jp' }, // 日本
  { code: 'ru', name: 'Русский', flagClass: 'ru' }, // 俄罗斯
  { code: 'es', name: 'Español', flagClass: 'es' } // 西班牙
]