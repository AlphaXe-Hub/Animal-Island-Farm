import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from '../locales/en'
import { zh } from '../locales/zh'

const STORAGE_KEY = 'aif_lang'

export type AppLang = 'zh' | 'en'

function initialLanguage(): AppLang {
  const s = localStorage.getItem(STORAGE_KEY)
  if (s === 'en' || s === 'zh') return s
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: initialLanguage(),
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

export function setAppLanguage(lng: AppLang): void {
  localStorage.setItem(STORAGE_KEY, lng)
  void i18n.changeLanguage(lng)
}

export default i18n
