
import { useLanguage } from "@/context/LanguageContext";
import { en } from "@/locales/en";
import { bn } from "@/locales/bn";

export function useTranslation() {
    const { lang } = useLanguage();

    const t = lang === 'bn' ? bn : en;

    return t;
}
