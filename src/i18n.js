import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from "./locales/en";
import { he } from "./locales/he";
import { th } from "./locales/th";
import { ru } from "./locales/ru";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { zh } from "./locales/zh";

const resources = {
  en: {
    translation: en
  },
  he: {
    translation: he
  },
  th: {
    translation: th
  },
  ru: {
    translation: ru
  },
  fr: {
    translation: fr
  },
  es: {
    translation: es
  },
  de: {
    translation: de
  },
  zh: {
    translation: zh
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