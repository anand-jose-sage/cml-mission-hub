"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  const { signIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-[#6B46FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 shadow-lg">
            <Image
              src="/logo.png"
              alt="CML Logo"
              width={64}
              height={64}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900">CML Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage your mission hub
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF] transition-colors"
            />
          </label>

          <label className="block mb-5">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">
              Password
            </span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B46FF]/30 focus:border-[#6B46FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{
              background: "linear-gradient(145deg, #7C5CFC, #6B46FF)",
              boxShadow: "0 4px 14px rgba(107,70,255,0.35)",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
