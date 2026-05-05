"use client";

import { Scale, Copyright, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
    const terms = [
        {
            icon: <Scale className="w-5 h-5" />,
            title: "Usage Agreement",
            content: "By using Myunibanner, you agree to generate and use the content for personal LinkedIn profile enhancement only. You may not use this tool for mass commercial distribution or any form of impersonation."
        },
        {
            icon: <Copyright className="w-5 h-5" />,
            title: "Intellectual Property",
            content: "All university logos, crests, and brand trademarks remain the exclusive property of their respective institutions. Myunibanner provides these assets as a service to students of these institutions and does not claim any ownership over university brand assets."
        },
        {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "Fair Use",
            content: "You are responsible for ensuring that your use of the generated banner complies with your institution's and LinkedIn's community guidelines. Myunibanner is a tool provided 'as-is' without warranties of any kind."
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
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Terms of Service</h1>
                        <p className="text-slate-500 font-medium text-sm">Last Updated: April 2026</p>
                    </motion.div>
 
                    <div className="space-y-12">
                        {terms.map((term, i) => (
                            <motion.section 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="prose prose-slate max-w-none"
                            >
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{term.title}</h2>
                                <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                                    {term.content}
                                </p>
                            </motion.section>
                        ))}
                    </div>

                    <div className="mt-20 pt-10 border-t border-slate-200 text-center">
                        <p className="text-slate-600 font-medium">
                            By continuing to use Myunibanner, you agree to these simplified, student-first terms of service.
                        </p>
                    </div>
                </div>

            </main>
            <Footer />
        </div>
    );
}
