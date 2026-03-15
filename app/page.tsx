import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";
import LoginForm from "@/components/forms/LoginForm";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token && await verifySessionToken(token)) {
    redirect("/bills");
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-hero">
          <h1 className="login-title">Singil</h1>
          <p className="login-sub">Split bills and collect payments easily</p>
        </div>
        <div className="login-form-card">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
