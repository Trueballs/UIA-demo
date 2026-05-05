"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "English" | "Norwegian";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  English: {
    // Header
    "header.badge": "100% Free · No account required",

    // Hero
    "hero.headline": "Wear your uni with pride",
    "hero.subtext": "Join 10,000+ students who finally stand out.",
    "hero.cta": "GET MY BANNER",
    "hero.takes": "Takes 5 seconds. No account required.",
    "hero.annotation": "No design skills needed",
    "hero.before": "Before",
    "hero.after": "After",

    // Marquee
    "marquee.heading": "Trusted by students worldwide",

    // How it works
    "how.heading": "How to use our service",
    "how.step1.label": "Step 1",
    "how.step1.title": "Find Your University",
    "how.step1.desc": "Search for your university to instantly load the official logo and brand colors from our database.",
    "how.step2.label": "Step 2",
    "how.step2.title": "Customize Style",
    "how.step2.desc": "Choose from professional layout templates and add your personalized headline to stand out.",
    "how.step3.label": "Step 3",
    "how.step3.title": "Export Banner",
    "how.step3.desc": "Once you are happy with the preview, one-click export to get your high-resolution PNG, ready for LinkedIn.",

    // FAQ
    "faq.heading": "FAQ",
    "faq.q1": "How does Myunibanner work?",
    "faq.a1": "Search for your university, choose a design, add your headline, and export your banner in one click. Our tool automatically fetches official logos and brand colors so you don't have to design anything manually.",
    "faq.q2": "Is the service really free?",
    "faq.a2": "Yes, Myunibanner is completely free for students and professionals in the UK who want to upgrade their LinkedIn profile quickly and professionally.",
    "faq.q3": "Does it work for my university?",
    "faq.a3": "We support a wide range of UK universities with their official logos and brand colors. If your school is missing, we would love to add it for you!",
    "faq.q3.button": "Request your school (Contact us)",
    "faq.q4": "What format will I receive the banner in?",
    "faq.a4": "You will receive a high-resolution .png file, perfectly tailored to LinkedIn's official dimensions (1584 x 396 pixels).",
    "faq.q5": "Do I need an account to use the tool?",
    "faq.a5": "No, you can generate and download your banner immediately without needing to log in or share any personal data.",
    "faq.q6": "Can I use the tool on mobile?",
    "faq.a6": "Absolutely! The site is fully responsive, though we recommend using a desktop for the best overall user experience.",

    // Footer
    "footer.nav": "Navigation",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact",
    "footer.created": "Created by Oscar",
  },
  Norwegian: {
    // Header
    "header.badge": "100% Gratis · Ingen konto nødvendig",

    // Hero
    "hero.headline": "LinkedIn-banneret som får rekrutterere til å stoppe.",
    "hero.subtext": "Bli med studenter over hele verden som endelig skiller seg ut.",
    "hero.cta": "FÅ MITT BANNER",
    "hero.takes": "Tar 5 sekunder. Ingen konto nødvendig.",
    "hero.annotation": "Ingen designerfaring nødvendig",
    "hero.before": "Før",
    "hero.after": "Etter",

    // Marquee
    "marquee.heading": "Brukt av studenter over hele verden",

    // How it works
    "how.heading": "SLIK BRUKER DU TJENESTEN",
    "how.step1.label": "Steg 1",
    "how.step1.title": "Finn ditt universitet",
    "how.step1.desc": "Søk etter ditt norske eller britiske universitet for å laste inn den offisielle logoen og merkefargene fra vår database.",
    "how.step2.label": "Steg 2",
    "how.step2.title": "Tilpass stilen",
    "how.step2.desc": "Velg blant profesjonelle layoutmaler og legg til din personlige overskrift for å skille deg ut.",
    "how.step3.label": "Steg 3",
    "how.step3.title": "Eksporter banner",
    "how.step3.desc": "Når du er fornøyd med forhåndsvisningen, eksporter med ett klikk for å få din høyoppløslige PNG, klar for LinkedIn.",

    // FAQ
    "faq.heading": "Spørsmål & Svar",
    "faq.q1": "Hvordan fungerer Myunibanner?",
    "faq.a1": "Søk etter ditt universitet, velg et design, legg til din overskrift og eksporter banneret med ett klikk. Verktøyet henter automatisk offisielle logoer og merkefarger.",
    "faq.q2": "Er tjenesten virkelig gratis?",
    "faq.a2": "Ja, Myunibanner er helt gratis for studenter og fagfolk som ønsker å oppgradere LinkedIn-profilen sin raskt og profesjonelt.",
    "faq.q3": "Fungerer det for mitt universitet?",
    "faq.a3": "Vi støtter et bredt utvalg av norske og britiske universiteter med offisielle logoer og merkefarger. Hvis skolen din mangler, legger vi den gjerne til!",
    "faq.q3.button": "Be om din skole (Kontakt oss)",
    "faq.q4": "Hvilket format mottar jeg banneret i?",
    "faq.a4": "Du mottar en høyoppløslig .png-fil, perfekt tilpasset LinkedIns offisielle dimensjoner (1584 x 396 piksler).",
    "faq.q5": "Trenger jeg en konto for å bruke verktøyet?",
    "faq.a5": "Nei, du kan generere og laste ned banneret ditt umiddelbart uten å logge inn eller dele personlige data.",
    "faq.q6": "Kan jeg bruke verktøyet på mobil?",
    "faq.a6": "Absolutt! Siden er fullt responsiv, men vi anbefaler å bruke datamaskin for best mulig opplevelse.",

    // Footer
    "footer.nav": "Navigasjon",
    "footer.privacy": "Personvernerklæring",
    "footer.terms": "Vilkår for bruk",
    "footer.contact": "Kontakt",
    "footer.created": "Laget av Oscar",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "English",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Language switching removed — always use English
  const language: Language = "English";
  const setLanguage = (_lang: Language) => {};

  const t = (key: string): string => {
    return translations["English"][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
