"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") || "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-neutral-950 mb-3">🔒</div>
          <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Tracker</h1>
          <p className="text-sm text-neutral-500 mt-1">Enter password to continue</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-cyan-400"
        />
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-white text-neutral-950 rounded-lg py-2 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-neutral-950" />}>
      <LoginForm />
    </Suspense>
  );
}
