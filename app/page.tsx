import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LoginForm from "@/components/forms/LoginForm";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/bills");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-ink mb-2">Singil</h1>
          <p className="text-ink-muted text-sm">Split bills and collect payments easily</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6 shadow-md">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
