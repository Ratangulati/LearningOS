"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";

  // 🔁 Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  // ⏳ Prevent flicker
  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">

      {/* 🌌 Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1e3a8a,transparent_40%),radial-gradient(circle_at_80%_70%,#9333ea,transparent_40%)] opacity-30 blur-2xl" />

      {/* 💎 Glass Card */}
      <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 w-[90%] max-w-md shadow-2xl">

        {/* 🔥 Title */}
        <h1 className="text-3xl font-bold text-white text-center">
          Welcome to Saarthi AI 🚀
        </h1>

        <p className="text-gray-300 text-center mt-3 text-sm">
          Your AI-powered career companion.  
          Plan, track, and achieve your goals smarter.
        </p>

        {/* 🔐 Google Login */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          disabled={isLoading}
          className="mt-8 w-full flex items-center justify-center gap-3 
          bg-white text-black py-3 rounded-xl font-medium 
          hover:scale-105 transition duration-300 shadow-lg disabled:opacity-60"
        >
          <Image src="/google.png" alt="Google logo" width={20} height={20} />
          Continue with Google
        </button>

        {/* 🔒 Footer */}
        <p className="text-xs text-gray-400 mt-6 text-center">
          Secure login powered by Google
        </p>

      </div>
    </div>
  );
}