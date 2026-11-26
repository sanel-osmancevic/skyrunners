import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/auth";
import logo from "@/assets/logo.png";
import UserMenu from "@/components/UserMenu";

// icon: putanje za ikonicu 24×24 koja se iscrtava linijama.
const TABS = [
  { id: "home", href: "/", label: "Početna", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  {
    id: "kalendar",
    href: "/kalendar",
    label: "Kalendar",
    icon: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18",
  },
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Tabela uspeha",
    icon: "M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 21h8l-1-3H9z",
  },
] as const;

const menuItemCls = "block w-full cursor-pointer px-4 py-2 text-left hover:bg-slate-100 max-sm:py-3";

type Props = {
  name?: string | null;
  image?: string | null;
  /**
   * Aktivni tab, ili "profil" (nema tab – otvara se iz podmenija uz ime).
   * Bez njega nema tabova ni stavke „Izmeni podatke” (npr. na formi posle prve prijave).
   */
  active?: (typeof TABS)[number]["id"] | "profil";
};

export default function Header({ name, image, active }: Props) {
  // Na telefonu staje samo prvo ime.
  const [firstName, ...otherNames] = (name ?? "").split(" ");
  const member = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-8 w-8 shrink-0 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 font-semibold">
          {name?.[0] ?? "?"}
        </span>
      )}
      <span className="truncate underline-offset-4 group-hover:underline">
        {firstName}
        {otherNames.length > 0 && <span className="hidden sm:inline"> {otherNames.join(" ")}</span>}
      </span>
    </>
  );

  return (
    <header className="linije-plave bg-[length:max(100%,700px)_auto] text-white">
      <div className="mx-auto flex max-w-3xl gap-2 px-3 sm:gap-3 sm:px-4">
        {/* Logo se proteže preko cele visine zaglavlja; naslov pored njega je link za čitače ekrana i tastaturu. */}
        <Link href="/" tabIndex={-1} aria-hidden className="flex shrink-0 items-center py-1.5">
          <Image src={logo} alt="" width={81} height={104} loading="eager" className="h-22 w-auto sm:h-26" />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-between gap-2 py-2 sm:gap-3 sm:py-3">
            <Link href="/" className="shrink-0 text-xs leading-tight font-bold sm:text-lg">
              SPARTAK <br className="sm:hidden" />
              SKYRUNNERS
            </Link>
            <div className="flex min-w-0 text-sm">
              <UserMenu trigger={member} current={active === "profil"}>
                {active && (
                  <Link href="/profil/izmena" className={menuItemCls}>
                    Izmeni podatke
                  </Link>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <button type="submit" className={menuItemCls}>
                    Odjavi se
                  </button>
                </form>
              </UserMenu>
            </div>
          </div>

          {active && (
            <nav
              aria-label="Glavni meni"
              className="mb-2 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full bg-white/10 p-1 text-xs ring-1 ring-white/15 ring-inset min-[375px]:text-sm sm:mb-3 sm:gap-1"
            >
              {TABS.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  aria-current={tab.id === active ? "page" : undefined}
                  className="group flex items-center gap-2 rounded-full px-1 py-1.5 font-medium whitespace-nowrap text-white/75 transition-colors duration-200 hover:bg-white/10 hover:text-white aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-brand aria-[current=page]:shadow-sm min-[360px]:px-1.5 min-[375px]:px-2 sm:px-4"
                >
                  {/* Ikonice se vide samo gde ima mesta. */}
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hidden h-4 w-4 group-aria-[current=page]:text-accent sm:block"
                  >
                    <path d={tab.icon} />
                  </svg>
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
