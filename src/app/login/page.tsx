import Image from "next/image";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getSession } from "@/lib/session";
import logo from "@/assets/logo.png";

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "Ovaj email je već povezan sa drugim načinom prijave.",
  AccessDenied: "Pristup je odbijen.",
  Configuration: "Prijava trenutno nije podešena. Javi se administratoru.",
};

// Stranica čita sesiju (cookie) – renderuje se na serveru pri svakom zahtevu.
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSession();
  if (session?.user) redirect("/");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? (ERRORS[error] ?? "Prijava nije uspela. Pokušaj ponovo.") : null;

  return (
    <main className="linije-plave flex flex-1 items-center justify-center bg-cover p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <Image src={logo} alt="" width={112} height={144} loading="eager" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-brand">SPARTAK SKYRUNNERS</h1>
          <p className="mt-1 text-sm text-slate-500">Članska zona kluba</p>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-balance text-slate-700 transition hover:bg-slate-50 min-[375px]:text-[15px] sm:gap-3 sm:px-4 sm:text-base"
          >
            <GoogleIcon />
            Prijavi se preko Google naloga
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Prvom prijavom automatski se kreira tvoj članski nalog.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
