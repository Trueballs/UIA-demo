"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function AntigravityBackground() {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const particles = Array.from({ length: 25 })

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[#0a0c1a]">
            {/* Ambient Gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] -mr-[300px] -mt-[300px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[140px] -ml-[200px] -mb-[200px]" />
            
            {/* Floating Particles */}
            {particles.map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/[0.03] border border-white/5"
                    style={{
                        width: Math.random() * 200 + 40,
                        height: Math.random() * 200 + 40,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, Math.random() * -100 - 50, 0],
                        x: [0, Math.random() * 50 - 25, 0],
                        scale: [1, 1.1, 1],
                        rotate: [0, 45, 0],
                    }}
                    transition={{
                        duration: Math.random() * 15 + 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Micro Particles */}
            {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                    key={`micro-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-blue-400/20"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.1, 0.5, 0.1],
                        y: [0, -40, 0],
                    }}
                    transition={{
                        duration: Math.random() * 5 + 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    )
}
