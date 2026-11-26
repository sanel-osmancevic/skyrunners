# Spartak SkyRunners – članska zona

Funkcionalni deo sajta kluba: prijava članova preko Google naloga, unos ličnih podataka, istrčane trke i pregled takmičara.

**Tehnologije:** Next.js 16 (App Router), Auth.js v5 (Google), Prisma 6 + SQLite (lokalno), Tailwind CSS 4, Zod.

## Kako radi

1. `/login` – dugme „Prijavi se preko Google naloga”. Prva prijava automatski kreira nalog (`User` + `Account`).
2. Ako član još nema `MemberProfile`, svaka zaštićena stranica ga šalje na `/onboarding` – formu sa podacima.
3. Posle čuvanja (i posle svake izmene podataka) ide na početnu `/`.
4. **Početna** `/` – za tekuću godinu (druge godine sa rezultatima biraju se dugmadima, `/?godina=2025`): broj istrčanih trka, kilometri, postolja ukupno i po mestima 1–3 (dugme „Detaljnije” pokazuje individualna, AGE i timska) i spisak trka člana; „Dodaj trku” (`/trke/nova`): član bira trku iz kalendara i njenu distancu, upisuje vreme i po potrebi postolje: individualno, u AGE kategoriji i/ili timsko. Kod ručno dodate trke član može da upiše i distancu koje nema („Druga distanca”), čime se ona dodaje trci. Ista trka se ne može upisati dva puta, ni kada je obrisana pa ponovo dodata sa istim datumom.
5. **Kalendar** `/kalendar` – mesečni prikaz trka po danima: sa [trka.rs](https://trka.rs), sa [runtrace.net](https://runtrace.net) i one koje su dodali članovi; klik vodi na stranicu trke. Na telefonu su u kockicama tačkice, a dodir na dan prikazuje njegove trke (inače je ispod ceo mesec po danima). Održane trke od 2026. ostaju u kalendaru i narednih godina. Ako trke nema, član je dodaje ručno (`/trke/rucno`: naziv, datum, mesto, distance) i tada je koriste svi. Ko je trku dodao (ili administrator) može da je izmeni, što menja i upisane rezultate, ili obriše, pri čemu rezultati ostaju.
6. **Tabela uspeha** `/dashboard` – sumarni podaci svih članova (tvoj red je istaknut), bez ličnih podataka (vide se ime, slika i pol kao plava ili roze tačka). Postolja su prikazana ukupno i po mestima 1–3, a „Detaljnije” kod takmičara pokazuje individualna, AGE i timska. Klik na naslov kolone sortira po njoj (ponovni klik menja smer). Na telefonu cela tabela staje u širinu ekrana, a filteri su iza dugmeta „Filteri”. Filteri: pol i datum održavanja trke (od–do). Bez filtera: svi polovi i tekuća godina. Uz izabran datum prikazuju se samo oni koji su tada trčali.
7. **Meni uz ime** – klik na ime u zaglavlju otvara „Izmeni podatke” (`/profil/izmena`) i „Odjavi se”.

| Putanja | Opis |
|---|---|
| `src/auth.ts` | Auth.js konfiguracija (Google, Prisma adapter, sesije u bazi) |
| `src/lib/session.ts` | `requireUser()` / `requireMember()` – zaštita stranica i redirect na formu |
| `src/lib/member-actions.ts` | Server akcija: validacija (Zod) i čuvanje podataka člana |
| `src/lib/member-options.ts` | Šifarnici (pol) |
| `src/lib/race-actions.ts` | Server akcije: unos, izmena i brisanje trka (samo svojih) |
| `src/lib/race-stats.ts` | Računanje sumarnih podataka (trke, km, postolja) |
| `src/lib/calendar.ts` | Računanje dana za mesečni kalendar |
| `src/lib/race-filters.ts` | Filteri po polu i periodu (početna i dashboard) |
| `src/lib/race-events.ts` | Spajanje trka iz svih izvora kalendara |
| `src/lib/runtrace.ts` | Preuzimanje trka sa runtrace.net (keš 6 sati) |
| `src/lib/runtrace-parse.ts` | Čitanje trka i distanci sa runtrace.net |
| `src/lib/club-race-actions.ts` | Server akcija: ručni unos trke za ceo klub |
| `src/lib/trka-rs.ts` | Preuzimanje trka sa trka.rs (keš 6 sati) |
| `src/lib/trka-rs-parse.ts` | Čitanje trka iz HTML-a (menja se ako trka.rs promeni izgled) |
| `src/components/MemberForm.tsx` | Forma ličnih podataka (ista za prvi unos i izmenu) |
| `src/components/RacePicker.tsx` | Izbor trke iz kalendara (sa pretragom) |
| `src/components/ResultForm.tsx` | Forma rezultata: distanca, vreme, postolje (unos i izmena) |
| `prisma/schema.prisma` | Šema baze |

> **Pre javnog objavljivanja:** [uslovi korišćenja trka.rs](https://trka.rs/terms/) traže izričitu dozvolu za
> korišćenje njihovog sadržaja. Zvaničan API ili feed nismo našli, pa se podaci čitaju sa javnih stranica.
> Isto važi za runtrace.net: njihovi uslovi zabranjuju kopiranje i distribuciju sadržaja bez zvanične
> dozvole agencije BalkanIQ.

## Pokretanje lokalno

### 1. Google OAuth ključevi (jednom)

1. https://console.cloud.google.com → napravi projekat (npr. „SkyRunners”) i izaberi ga.
2. https://console.cloud.google.com/auth/branding (**Google Auth Platform**): popuni naziv aplikacije i kontakt email,
   a tip korisnika (**Audience**) postavi na *External*.
3. https://console.cloud.google.com/auth/clients → **Create client** → *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Odmah kopiraj **Client secret** (ceo se prikazuje samo pri kreiranju) i upiši obe vrednosti u `.env`:
   ```
   AUTH_GOOGLE_ID="....apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="GOCSPX-..."
   ```
   `AUTH_SECRET` je već generisan u `.env` (novi: `npx auth secret`).

### 2. Start

```powershell
npm install
npx prisma migrate dev
npm run dev
```

Otvori http://localhost:3000.

> **Ako Node padne** sa greškom `Assertion failed ... X509_STORE_add_cert`: u tom terminalu je postavljeno
> `NODE_USE_SYSTEM_CA=1` (viđeno u terminalu Claude aplikacije). Ukloni ga za tu sesiju:
> `$env:NODE_USE_SYSTEM_CA = $null`

Pregled baze: `npx prisma studio`.

## Za produkciju

- U `prisma/schema.prisma` promeni `provider` na `postgresql` i postavi `DATABASE_URL`.
- U Google konzoli dodaj produkcijski domen i redirect `https://<domen>/api/auth/callback/google`.
- Na serveru postavi `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`.
