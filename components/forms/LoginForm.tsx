"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError("Wrong password.");
      setIsLoading(false);
      return;
    }

    router.push("/bills");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-sm text-ink placeholder-[#BEB5A8] outline-none focus:border-accent"
          autoFocus
        />
      </div>
      {error && <p className="text-[#DC2626] text-xs mb-3">{error}</p>}
      <button
        type="submit"
        disabled={isLoading || !password}
        className="w-full bg-accent text-white rounded-[14px] py-4 text-[15px] font-semibold disabled:opacity-50"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
