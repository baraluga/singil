"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setIsSubmitted(true);
    setIsLoading(false);
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-serif text-2xl text-ink mb-2">Check your email</h2>
        <p className="text-ink-muted text-sm">
          We sent a magic link to <strong>{email}</strong>.
          <br />
          Tap it to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <label className="block text-[11px] font-semibold tracking-[0.08em] uppercase text-ink-muted mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-surface border border-border rounded-[10px] px-3.5 py-3 text-sm text-ink placeholder-[#BEB5A8] outline-none focus:border-accent"
        />
      </div>
      {error && (
        <p className="text-[#DC2626] text-xs mb-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full bg-accent text-white rounded-[14px] py-4 text-[15px] font-semibold disabled:opacity-50"
      >
        {isLoading ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
