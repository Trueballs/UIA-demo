"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HeroVisualization from "@/components/HeroVisualization";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-lexend w-full overflow-x-hidden text-slate-900 selection:bg-blue-100 selection:text-blue-700 relative">
      

      {/* FULL WIDTH COLUMN */}
      <main className="w-full flex flex-col bg-transparent relative z-10">
 
        {/* ─── TOP NAVIGATION ─── */}
        <Header />

        {/* ─── HERO SECTION ─── */}
        <section className="relative z-20 overflow-visible">
          {/* Removed ambient glows for cleaner look */}
 
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-20 md:pt-36 pb-16 md:pb-24">
            {/* SIDE-BY-SIDE Layout: Content Left, Comparison Visual Right */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 relative">
              
              {/* ── LEFT CONTENT: HEADING & CTA ── */}
              <div
                className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-3xl lg:w-[50%] z-10"
              >
                <h1 className="font-lexend font-extrabold leading-[1.1] tracking-tight text-[#1a1c20]
                  text-[32px] sm:text-[42px] md:text-[50px] lg:text-[60px] mb-10">
                  Den perfekte avslutningen <br />
                  på <span className="text-blue-600">din profil.</span>
                </h1>

                <div className="w-full lg:w-max flex justify-center lg:justify-start group">
                  <button
                    onClick={() => router.push("/build?domain=uia.no")}
                    className="px-10 md:px-12 py-5 md:py-6 bg-blue-600 text-white font-bold text-[18px] md:text-[20px] rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg flex items-center justify-center gap-4 active:scale-95"
                  >
                    Lag ditt banner
                    <svg viewBox="0 0 24 24" className="w-6 md:w-7 h-6 md:h-7 fill-none stroke-current stroke-3" strokeWidth={3}>
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── RIGHT CONTENT: THE VISUALIZATION ── */}
              <div className="w-full lg:w-[60%] lg:-mr-32 xl:-mr-40 flex justify-center lg:justify-end items-center pointer-events-none">
                <HeroVisualization />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
