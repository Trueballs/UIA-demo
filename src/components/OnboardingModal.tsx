"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchUniversities, University } from "@/data/universities";

const LANGUAGES = ["English", "Spanish", "Chinese", "Hindi", "Arabic", "French", "Portuguese"];
const COUNTRIES = ["United Kingdom", "Norway"];
const DEGREES = ["Bachelor (BA)", "BSc", "Master (MA)", "MSc", "MBA", "PhD", "Exchange", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd / Final Year", "Alumni / Grad"];
const INDUSTRIES = ["Tech & IT", "Finance & Banking", "Consulting", "Marketing", "Law", "Healthcare", "Engineering", "Other"];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // University Search State
  const [uniQuery, setUniQuery] = useState("");
  const [uniSuggestions, setUniSuggestions] = useState<University[]>([]);
  const [selectedCampusUni, setSelectedCampusUni] = useState<University | null>(null);

  // Data
  const [data, setData] = useState<{
    country: string;
    language: string;
    degree: string;
    year: string;
    industry: string[];
    industryOther: string;
  }>({
    country: "",
    language: "English",
    degree: "",
    year: "",
    industry: [],
    industryOther: "",
  });

  useEffect(() => {
    // 1. Load initial data from localStorage
    const savedData = localStorage.getItem("lnbg_user_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (typeof parsed.industry === "string") {
            parsed.industry = parsed.industry ? [parsed.industry] : [];
        }
        setData(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }

    // 3. Manual open logic (clicking the button)
    const handleOpen = () => {
      // Re-load data when manually opened to be sure it's fresh
      const freshData = localStorage.getItem("lnbg_user_data");
      if (freshData) {
        try { 
            const parsed = JSON.parse(freshData);
            if (typeof parsed.industry === "string") {
                parsed.industry = parsed.industry ? [parsed.industry] : [];
            }
            setData(prev => ({ ...prev, ...parsed })); 
        } catch (e) {}
      }
      setUniQuery("");
      setUniSuggestions([]);
      setStep(1);
      setIsOpen(true);
    };

    // 4. Sync with other components (e.g. Header/Footer country change)
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const detail = { ...customEvent.detail };
        if (typeof detail.industry === "string") {
            detail.industry = detail.industry ? [detail.industry] : [];
        }
        setData(prev => ({ ...prev, ...detail }));
      }
    };

    window.addEventListener("lnbg_open_onboarding", handleOpen);
    window.addEventListener("lnbg_user_data_updated", handleUpdate as EventListener);
    
    return () => {
      window.removeEventListener("lnbg_open_onboarding", handleOpen);
      window.removeEventListener("lnbg_user_data_updated", handleUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const completeOnboardingData = () => {
    localStorage.setItem("lnbg_onboarding_done", "true");
    localStorage.setItem("lnbg_user_data", JSON.stringify(data));
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lnbg_user_data_updated", { detail: data }));
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      completeOnboardingData();
      setStep(4);
    }
  };

  const skipOnboarding = () => {
    completeOnboardingData();
    setStep(4); // Skip straight to the university search
  };

  const handleUniSearch = (val: string) => {
    try {
      setUniQuery(val || "");
      if (!val || !val.trim()) {
        setUniSuggestions([]);
        return;
      }
      const results = searchUniversities(val, data?.country, 10);
      setUniSuggestions(results || []);
    } catch (error) {
      console.error("Search error:", error);
      setUniSuggestions([]);
    }
  };

  const goToBuild = (domain: string, campus?: string) => {
    setIsOpen(false);
    let url = `/build?domain=${encodeURIComponent(domain.trim())}`;
    if (campus) url += `&campus=${encodeURIComponent(campus)}`;
    router.push(url);
  };

  const handleUniSubmit = (uni: University) => {
    if (uni.campuses && uni.campuses.length > 0) {
      setSelectedCampusUni(uni);
      setStep(5);
    } else {
      goToBuild(uni.domain);
    }
  };

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      {/* Click outside background area to close only if step 4 */}
      <div className="absolute inset-0" onClick={() => { if (step === 4) setIsOpen(false); }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="bg-white rounded-[2.5rem] w-full max-w-lg h-[600px] shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative flex flex-col overflow-hidden border border-slate-100/50"
        >
          {/* Header */}
          {step < 4 && (
            <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-between px-8 py-5">
              <div className="flex gap-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-10 bg-blue-600' : i < step ? 'w-4 bg-blue-200' : 'w-4 bg-slate-200'}`} />
                ))}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Step {step} of 3</p>
            </div>
          )}
          {step === 4 && (
            <div className="bg-slate-50 border-b border-slate-100 flex items-center justify-between px-8 py-5">
              <div className="flex gap-2.5">
                <div className="h-1.5 rounded-full transition-all duration-300 w-10 bg-blue-600" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Search</p>
            </div>
          )}

          <div className="p-6 flex-1 overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-lexend text-slate-900 tracking-tight mb-3">Where do you study?</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">We use this to curate universities and localize your experience.</p>
                </div>

                {/* Country Search */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pr-1">Country of Study</p>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto mb-6 pr-2">
                    {filteredCountries.map(country => (
                      <button
                        key={country}
                        onClick={() => setData({ ...data, country })}
                        className={`flex items-center justify-between px-5 py-3 rounded-xl text-sm font-bold transition-all ${data.country === country ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                      >
                        {country}
                        {data.country === country && <Check className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-7">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-lexend text-slate-900 tracking-tight mb-2">Your studies</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">This helps us customize the banner options for you.</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Degree Type</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {DEGREES.map(deg => (
                      <button
                        key={deg}
                        onClick={() => setData({ ...data, degree: deg })}
                        className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border ${data.degree === deg ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                      >
                        {deg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Year</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {YEARS.map(yr => (
                      <button
                        key={yr}
                        onClick={() => setData({ ...data, year: yr })}
                        className={`px-3 py-3 rounded-full text-xs font-bold transition-all border ${data.year === yr ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-lexend text-slate-900 tracking-tight mb-2">Career goals?</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Choose up to 3 industries. We'll match you with relevant career opportunities later.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Target Industry</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{(() => {
                      const arr = Array.isArray(data.industry) ? data.industry : [];
                      return arr.length;
                    })()}/3 selected</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {INDUSTRIES.map(ind => {
                      const currentIndustries = Array.isArray(data.industry) ? data.industry : [];
                      const isSelected = currentIndustries.includes(ind);
                      return (
                        <button
                          key={ind}
                          onClick={() => {
                            setData(prev => {
                              const current = Array.isArray(prev.industry) ? prev.industry : [];
                              if (current.includes(ind)) {
                                return { ...prev, industry: current.filter(i => i !== ind) };
                              } else {
                                if (current.length >= 3) return prev;
                                return { ...prev, industry: [...current, ind] };
                              }
                            });
                          }}
                          className={`px-5 py-3.5 rounded-xl text-sm font-bold transition-all border flex items-center justify-between ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                        >
                          {ind}
                          {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                  {(Array.isArray(data.industry) ? data.industry : []).includes("Other") && (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tell us more..."
                      value={data.industryOther ?? ""}
                      onChange={(e) => setData(prev => ({ ...prev, industryOther: e.target.value }))}
                      className="mt-4 w-full px-5 py-3.5 bg-slate-50 border border-blue-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 flex flex-col h-full">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-lexend text-slate-900 tracking-tight mb-2">Find your school</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Search for your university to generate your custom banner.</p>
                </div>

                <div className="relative z-50 flex-1 flex flex-col min-h-0">
                  <div className="relative shrink-0">
                    <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search for your university..."
                      value={uniQuery}
                      onChange={(e) => handleUniSearch(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && uniQuery.trim()) {
                          if (uniSuggestions.length > 0) handleUniSubmit(uniSuggestions[0]);
                          else goToBuild(uniQuery.trim());
                        }
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all shadow-sm"
                    />
                  </div>

                  <div className="overflow-y-auto mt-3 flex-1 rounded-2xl border border-slate-100/50 bg-slate-50/30">
                    {uniSuggestions && uniSuggestions.length > 0 ? (
                      // Search results
                      uniSuggestions.map((uni) => {
                        if (!uni || !uni.domain || !uni.name) return null;
                        return (
                          <button
                            key={uni.domain}
                            onClick={() => handleUniSubmit(uni)}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-blue-600 hover:text-white group/item border-b border-slate-100/30 last:border-0 bg-transparent"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={`/api/logo?domain=${encodeURIComponent(uni.domain)}`}
                                alt={uni.name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.src.includes('clearbit')) {
                                    target.src = `https://logo.clearbit.com/${uni.domain}`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-[14px] text-slate-900 group-hover/item:text-white leading-tight">{uni.name}</div>
                              <div className="text-[12px] text-slate-400 group-hover/item:text-white/70 font-medium">{uni.domain}</div>
                            </div>
                          </button>
                        );
                      })
                    ) : uniQuery.trim() ? (
                      // No results
                      <div className="px-6 py-5 text-sm text-slate-400 font-medium bg-white rounded-2xl">
                        No universities found for "{uniQuery}".<br />
                        <button 
                          onClick={() => window.location.href = 'mailto:oscar.w.skaarderud@gmail.com'}
                          className="text-blue-600 hover:underline mt-2 font-bold block"
                        >
                          Request your school (Contact us)
                        </button>
                      </div>
                    ) : (
                      // Pre-search: show all available schools
                      searchUniversities("", data.country || undefined, 50)
                      .map((uni) => (
                        <button
                          key={uni.domain}
                          onClick={() => handleUniSubmit(uni)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-blue-600 hover:text-white group/item border-b border-slate-100/30 last:border-0 bg-transparent"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={`/api/logo?domain=${encodeURIComponent(uni.domain)}`}
                              alt={uni.name}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('clearbit')) {
                                  target.src = `https://logo.clearbit.com/${uni.domain}`;
                                } else {
                                  target.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[14px] text-slate-900 group-hover/item:text-white leading-tight">{uni.name}</div>
                            <div className="text-[12px] text-slate-400 group-hover/item:text-white/70 font-medium">{uni.domain}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {uniQuery.trim() && uniSuggestions.length === 0 && (
                    <button
                      onClick={() => goToBuild(uniQuery.trim())}
                      className="w-full mt-3 bg-blue-600 text-white px-6 py-4 rounded-xl text-sm font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all shrink-0 active:scale-95"
                    >
                      Continue with "{uniQuery}"
                    </button>
                  )}
                </div>
              </div>
            )}
            {step === 5 && selectedCampusUni && (
              <div className="space-y-6 flex flex-col items-center text-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold font-lexend text-slate-900 tracking-tight mb-2">Select campus</h2>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Select your specific branch for {selectedCampusUni.name}.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 w-full overflow-y-auto max-h-[300px] pr-2 mt-4">
                  {selectedCampusUni.campuses?.map(campus => (
                    <button
                      key={campus}
                      onClick={() => goToBuild(selectedCampusUni.domain, campus)}
                      className="w-full text-left px-6 py-4 rounded-xl text-[14px] font-bold transition-all border bg-white border-slate-100 text-slate-900 hover:border-blue-600 hover:bg-blue-50/60 shadow-sm flex items-center justify-between group/campus"
                    >
                      {campus}
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover/campus:text-blue-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-8 pt-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/30 rounded-b-[2.5rem]">
            {step === 1 ? (
              <button 
                onClick={() => skipOnboarding()} 
                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold px-2 py-2 transition-colors uppercase tracking-widest"
              >
                Skip
              </button>
            ) : (
              <button 
                onClick={() => setStep(step - 1)} 
                className="text-slate-400 hover:text-slate-600 text-[11px] font-bold px-2 py-2 transition-colors uppercase tracking-widest flex items-center gap-1.5"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back
              </button>
            )}

            {step < 4 && (
              <button
                onClick={nextStep}
                className={`flex items-center gap-2.5 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                  (step === 1 && !data.country) || (step === 2 && (!data.degree || !data.year)) || (step === 3 && (!Array.isArray(data.industry) || data.industry.length === 0))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                    : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
                }`}
                disabled={(step === 1 && !data.country) || (step === 2 && (!data.degree || !data.year)) || (step === 3 && (!Array.isArray(data.industry) || data.industry.length === 0))}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
