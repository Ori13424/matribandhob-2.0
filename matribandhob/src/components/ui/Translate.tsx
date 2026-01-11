"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export const Translate = ({ tid, className }: { tid: string, className?: string }) => {
  const { t, lang } = useLanguage();

  return (
    <div className={`relative inline-block ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={lang}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {t(tid)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};