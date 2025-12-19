module.exports = {
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
  },
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
