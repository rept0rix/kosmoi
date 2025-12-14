import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from "./locales/en";
import { he } from "./locales/he";
import { th } from "./locales/th";

const resources = {
  en: {
    translation: en
  },
  he: {
    translation: he
  },
  th: {
    translation: th
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;