import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { languageOptions, translations } from "./translations";

const LANGUAGE_KEY = "expert-session-language";
const I18nContext = createContext(null);

const formatMessage = (template, vars) =>
  Object.entries(vars || {}).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );

const getStoredLanguage = () => {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) || "en";
  } catch {
    return "en";
  }
};

const setStoredLanguage = (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore storage failures so language switching still works in memory.
  }
};

export function I18nProvider({ children }) {
  const { currentUser, updateProfile } = useAuth();
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    if (currentUser?.preferredLanguage) {
      setLanguage(currentUser.preferredLanguage);
      setStoredLanguage(currentUser.preferredLanguage);
    }
  }, [currentUser?.preferredLanguage]);

  const changeLanguage = async (nextLanguage) => {
    setLanguage(nextLanguage);
    setStoredLanguage(nextLanguage);

    if (currentUser?.profileCompleted) {
      await updateProfile({
        name: currentUser.name,
        phone: currentUser.phone,
        preferredLanguage: nextLanguage
      });
    }
  };

  const t = (key, vars) => {
    const activeMessages = translations[language] || translations.en;
    const template = activeMessages[key] || translations.en[key] || key;
    return formatMessage(template, vars);
  };

  return (
    <I18nContext.Provider value={{ language, languageOptions, setLanguage: changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
