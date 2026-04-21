"use client";

import { ArrowRight } from "lucide-react";
import SplineRobot from "@/components/SplineRobot";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-40" />
      {/* Radial fade over grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0a_80%)]" />

      <div className="relative z-10 grid md:grid-cols-2 items-center min-h-screen px-6 max-w-7xl mx-auto">

        {/* LEFT */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left animate-fadeIn">

          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight bg-gradient-to-r from-white to-indigo-400 text-transparent bg-clip-text">
            Saarthi AI
          </h1>

          <p className="text-base text-zinc-400 max-w-md mb-8 leading-relaxed">
            Your AI-powered career guide that builds personalized roadmaps,
            tracks your progress, and helps you grow step by step.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => (window.location.href = "/onboarding")}
              className="btn-primary"
            >
              Get Started <ArrowRight size={16} />
            </button>
            <button
              onClick={() => (window.location.href = "/about")}
              className="btn-ghost"
            >
              See how it works
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["AI Roadmaps", "Progress Tracking", "Resource Links"].map((f) => (
              <span key={f} className="badge">{f}</span>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="h-[500px] md:h-[600px] w-full">
          <SplineRobot />
        </div>

      </div>
    </main>
  );
}