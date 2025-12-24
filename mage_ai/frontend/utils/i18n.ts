import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import moment from 'moment';
import 'moment/locale/zh-cn';

import zhTranslation from '../public/locales/zh/common.json';
import enTranslation from '../public/locales/en/common.json';

const mapMomentLocale = (language?: string) => {
  if (!language) {
    return 'en';
  }

  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh')) {
    return 'zh-cn';
  }
  if (normalized.startsWith('en')) {
    return 'en';
  }

  return normalized;
};

const resolveLanguage = (language?: string) => mapMomentLocale(language);

const syncMomentLocale = (language?: string) => {
  moment.locale(resolveLanguage(language));
};

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
  })
  .then(() => {
    syncMomentLocale(i18n.resolvedLanguage || i18n.language);
  });

syncMomentLocale(i18n.resolvedLanguage || i18n.language);
i18n.on('languageChanged', syncMomentLocale);

export default i18n;
