"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown, Check, Search, Linkedin, Twitter, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const LANGUAGES = ["English", "Spanish", "Chinese", "Hindi", "Arabic", "French", "Portuguese"];
const COUNTRIES = ["United Kingdom", "Norway"];

export default function Footer() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("United Kingdom");
  const [searchQuery, setSearchQuery] = useState("");
  const settingsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const savedData = localStorage.getItem("lnbg_user_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.country) setSelectedCountry(parsed.country);
      } catch (e) {}
    }

    const handleUserDataUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.country) setSelectedCountry(customEvent.detail.country);
      }
    };

    window.addEventListener("lnbg_user_data_updated", handleUserDataUpdate as EventListener);
    return () => window.removeEventListener("lnbg_user_data_updated", handleUserDataUpdate as EventListener);
  }, []);

  const handleLangSelect = (lang: string) => {};


  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setIsSettingsOpen(false);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("lnbg_user_data");
      const data = existing ? JSON.parse(existing) : {};
      data.country = country;
      localStorage.setItem("lnbg_user_data", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("lnbg_user_data_updated", { detail: data }));
    }
  };

  return (
    <footer className="w-full backdrop-blur-md py-6 md:py-12 border-t border-slate-200 mt-0" style={{ backgroundColor: 'rgba(248, 250, 252, 0.85)' }}>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-16 text-center md:text-left">
        <div className="text-slate-500 font-medium text-sm md:text-base">
          Created by <a href="https://oscarwoldskaarderud.dev" target="_blank" rel="noopener noreferrer" className="text-slate-900 font-bold hover:text-blue-600 transition-all no-underline">Oscar</a> (oscar.w.skaarderud@gmail.com)
        </div>
        
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 md:gap-20 text-slate-500 font-medium text-sm md:text-base">
          <a href="/privacy" className="hover:text-blue-600 transition-colors no-underline">Privacy</a>
          <a href="/terms" className="hover:text-blue-600 transition-colors no-underline">Terms</a>
          <a href="https://www.linkedin.com/in/oscar-wold-skaarderud-613644340" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors no-underline">Contact</a>
        </div>
      </div>
    </footer>
  );
}
