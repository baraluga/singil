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
    <form onSubmit={handleSubmit}>
      <div className="field-group">
        <label className="field-label">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="field-input"
          autoFocus
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      <button
        type="submit"
        disabled={isLoading || !password}
        className="btn-primary"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
