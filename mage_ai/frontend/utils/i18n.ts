import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTranslation from '../public/locales/zh/common.json';
import enTranslation from '../public/locales/en/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        common: zhTranslation,
      },
      en: {
        common: enTranslation,
      },
    },
    fallbackLng: 'zh',
    defaultNS: 'common',
    ns: ['common'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
