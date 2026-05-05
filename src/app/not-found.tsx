'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page immediately or after a short delay
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 2000); // Slightly longer delay to show the layout

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F4F1] font-sans flex justify-center w-full px-4 md:px-8 xl:px-12 py-4 md:py-6 gap-6 xl:gap-8 box-border overflow-x-hidden">
      <main className="w-full xl:w-[60%] flex flex-col shrink-0 relative bg-[#F5F4F1]">
        <Header />
        
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
            <h1 className="text-6xl md:text-8xl font-black text-[#1e2d78] uppercase tracking-tighter mb-4 font-[family-name:var(--font-playful)]">404</h1>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em] mb-8">Page Not Found</p>
            <div className="w-12 h-1 bg-[#1e2d78]/10 mx-auto mb-8 rounded-full" />
            <p className="text-gray-400 font-medium max-w-xs mx-auto">
                Redirecting you back to the home page...
            </p>
        </div>

        <Footer />
      </main>
    </div>
  );
}
