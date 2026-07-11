"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Boxes } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      login,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Login yoki parol noto'g'ri");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
            <Boxes size={22} strokeWidth={2} />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-ink">Arkon</h1>
          <p className="mt-1 text-sm text-ink/50">Tizimga kirish uchun ma&apos;lumotlaringizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-3xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-ink mb-1.5">
              Login
            </label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              autoFocus
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
              Parol
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-ink/10 bg-bg px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Yuklanmoqda..." : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
