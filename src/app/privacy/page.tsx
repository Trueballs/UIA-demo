"use client";

import { useRouter } from "next/navigation";
import { Shield, Lock, Eye, Mail } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
    const router = useRouter();

    const sections = [
        {
            icon: <Shield className="w-5 h-5" />,
            title: "Data Protection",
            content: "Myunibanner is built with privacy as a core principle. We do not require account registration, and we do not store any personal data or contact information unless you explicitly choose to contact us via email."
        },
        {
            icon: <Lock className="w-5 h-5" />,
            title: "Image Processing",
            content: "The banners you generate are processed locally in your browser. When you click 'Export', our system generates the image on your device. We do not upload your generated banners to our servers."
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: "Cookies & Tracking",
            content: "We use minimal analytics to understand how many people are using our tool. This is completely anonymous and does not track you across other websites or identify you personally."
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans w-full overflow-x-hidden">
            <Header showBackButton />
            <main className="w-full max-w-7xl mx-auto flex flex-col relative px-6 md:px-12">
                <div className="w-full max-w-3xl mx-auto pt-16 md:pt-24 pb-24 px-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 border-b border-slate-200 pb-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Privacy Policy</h1>
                        <p className="text-slate-500 font-medium text-sm">Last Updated: April 2026</p>
                    </motion.div>
 
                    <div className="space-y-12">
                        {sections.map((sec, i) => (
                            <motion.section 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="prose prose-slate max-w-none"
                            >
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{sec.title}</h2>
                                <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                                    {sec.content}
                                </p>
                            </motion.section>
                        ))}
                    </div>

                    <div className="mt-20 pt-10 border-t border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
                        <p className="text-slate-600 mb-4">
                            If you have any concerns regarding your privacy at Myunibanner, reach out directly to Oscar:
                        </p>
                        <a href="mailto:oscar.w.skaarderud@gmail.com" className="text-blue-600 font-bold hover:underline">
                            oscar.w.skaarderud@gmail.com
                        </a>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
