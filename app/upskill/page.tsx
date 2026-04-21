"use client";

import { useEffect, useState } from "react";
import SkillCard from "@/components/SkillCard";
import PageLoader from "@/components/PageLoader";

type Skill = {
  title: string;
  description: string;
  roadmap?: { title: string; link: string }[];
};

export default function UpskillPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch("/api/upskill");
        const data = await res.json();
        setSkills(data.skills.slice(0, 12));
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white relative">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1e3a8a,transparent_40%),radial-gradient(circle_at_80%_70%,#9333ea,transparent_40%)] opacity-30 blur-2xl" />

      {/* HEADER */}
      <div className="relative z-10 px-6 pt-8 pb-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 text-transparent bg-clip-text">
          Upskill for the Future
        </h1>

        <p className="text-gray-400 mt-3 max-w-2xl text-sm md:text-base">
          Discover the most in-demand skills shaping today’s tech industry.
          Explore curated learning paths, understand what companies are hiring for,
          and start building real-world expertise—one skill at a time.
        </p>
      </div>

      {/* 🔥 GRID */}
      <div className="relative z-10 px-6 pb-10">
        {loading ? (
          <PageLoader title="Loading skills" subtitle="Finding top skills for your growth..." />
        ) : (
          <div className="grid gap-6 
            grid-cols-1 
            sm:grid-cols-2 
            md:grid-cols-3 
            lg:grid-cols-4">

            {skills.map((skill, i) => (
              <SkillCard
                key={i}
                skill={skill}
                onClick={() => setSelected(skill)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🔥 MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">

          <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10 shadow-xl">

            <h2 className="text-xl font-bold mb-2">
              {selected.title}
            </h2>

            <p className="text-gray-300 mb-4">
              {selected.description}
            </p>

            <h3 className="font-semibold mb-2">Roadmap:</h3>

            <ul className="space-y-2">
              {selected.roadmap?.map((step, i) => (
                <li key={i}>
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    🔗 {step.title}
                  </a>
                </li>
              ))}
            </ul>

            <button
              onClick={() => setSelected(null)}
              className="mt-4 bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </main>
  );
}