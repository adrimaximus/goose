import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["common"],
  defaultNS: "common",
  resources: {
    en: {
      common: {
        "components.plan.toggle": "Toggle plan",
        "components.codeBlock.copyLabel": "Copy code",
        "components.messageBranch.previous": "Previous branch",
        "components.messageBranch.next": "Next branch",
        "components.messageBranch.page": "{{current}} of {{total}}",
        "errors.clipboardUnavailable": "Clipboard not available",
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
