"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("uia_demo_auth") === "true") {
      router.replace("/build?domain=uia.no");
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "UIA2026") {
      localStorage.setItem("uia_demo_auth", "true");
      router.push("/build?domain=uia.no");
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-lexend flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <Image
          src="/norske-universiteter/UiA/Logo/uia-horizontal-with-name-positive.png"
          alt="UiA logo"
          width={200}
          height={60}
          className="object-contain"
          unoptimized
        />

        <p className="text-slate-600 text-center text-[15px]">
          Demo laget for Universitetet i Agder
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="Passord"
            className={`w-full px-5 py-4 rounded-2xl border text-[15px] outline-none transition-all bg-white ${
              error ? "border-red-400 placeholder-red-300" : "border-slate-200 focus:border-blue-400"
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-[13px] text-center">Feil passord. Prøv igjen.</p>
          )}
          <button
            type="submit"
            className="w-full py-4 bg-[#C8102E] text-white font-bold text-[16px] rounded-2xl hover:bg-[#a00e27] transition-all active:scale-95"
          >
            Gå til demo
          </button>
        </form>
      </div>
    </div>
  );
}
