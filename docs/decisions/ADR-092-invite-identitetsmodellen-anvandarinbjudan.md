# ADR-092: Invite-/identitetsmodellen — Användarinbjudan

- Status: Accepted (Marcus-kvitterad 2026-08-02, grillad samsyn i
  T95-grillningen — S95 Del 2 beslut 5 + 7)
- Datum: 2026-08-02
- Fas: 7-framdragning (T95 Spår B; `TASK-127.1`)

> **Om beslutsvägen — bokförd öppet.** Underlaget är S87-spaningen
> ([`a4-riktig-webbapp-inbjudan.md`](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md)),
> som identifierade invite-/identitetsmodellen som en av tre ADR-bara
> beslut och citerade branschmönster (Linear, codifysaas.com) + kontots
> account-takeover-risk. `/grill-me` tog riktningen till explicit samsyn
> samma dag (sessionsdok
> [S95 Del 2](../../tasks/sessions/archive/2026-08/2026-08-02-session-95.md), beslut 5
> invite-kanal + beslut 7 token-TTL) — inklusive en webbverifiering UNDER
> grillningen som falsifierade bilagans egen 7-dagars-rekommendation mot
> Supabases faktiska plattformstak. Noteras av samma skäl som i
> [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md)–
> [ADR-091](ADR-091-hosting-deploy-vercel-pro.md): en läsare ska kunna se
> vem som vägde, inte bara vad som beslutades.

## Kontext

Dagens "inbjudan" är att Marcus skapar kontot manuellt (Supabase-dashboard
eller `create-admin-user`-EF:en med `email_confirm: true`) och överlämnar
lösenordet via sidokanal — exakt så prod-smoke-usern provisionerades i
S84. Det finns noll signup-, invite-, glömt-lösenord- eller reset-route i
repot (26 route-filer genomsökta, noll träffar); auth är enbart
`supabase.auth.signInWithPassword`. Behörighet avgörs i dag av en
hårdkodad `ADMIN_EMAILS`-allowlist — en **medveten** pre-track-brygga
(kommentaren i `supabase/functions/create-admin-user/index.ts` rad 9–11
säger det explicit): den ersätts av `tenant_memberships.role IN
('owner','admin')` när `06b`-datamodellen byggs, men inte förr.

Ett naivt "skapa konto"-flöde där mottagaren själv väljer e-post eller
roll vid accept ÄR en account-takeover-väg — precis det S87-bilagan
flaggar och precis det Rogers bakgrund som f.d. cybersäkerhetsexpert gör
till en del av förstaintrycket, inte en teknisk detalj. Branschmönstret
för team-invite 2026 (bilagans källor: codifysaas.com, Linears
`linear.app/docs/invite-members`) är samstämmigt: engångs- och
tidsbegränsad token, rollen låst på inbjudan, e-postadressen ej
ändringsbar vid accept utan verifiering.

**Plattformstaket, verifierat live under grillningen (S95 Del 2 beslut
7):** Supabases "Email OTP Expiration" är EN inställning, GLOBAL för alla
e-postlänkar i projektet (invite, magic link, bekräftelselänk) — taket är
86 400 sekunder (24 timmar). Bilagans rekommenderade branschmönster på
7 dagar är därför **inte ett val inom plattformen**, oavsett vad
branschpraxis annars säger.

## Beslut

1. **Egen invite-Edge Function** (`inviteUserByEmail`, service-role-nyckel,
   anropas aldrig från klienten) bakom `ADMIN_EMAILS`-grinden — samma
   gate-mönster som `create-admin-user` redan använder.
2. **Roll och e-postadress låses av inbjudan.** Mottagaren väljer inget
   själv — kanoniserat i `ORDLISTA.md` § Användarinbjudan (S95). Accept-
   sidan (`/valkommen`, `TASK-127.6`) visar e-posten förifylld och
   OREDIGERBAR.
3. **Token-TTL: 24 timmar** (plattformens tak, inte ett önskat värde) —
   med en omskicks-väg i invite-EF:en för när mottagaren missar fönstret,
   i stället för att jaga det förkastade 7-dagarsvärdet.
4. **Icke-breaking mot framtida medlemsmodell:** invite-EF:ens kontrakt
   (roll + e-post låsta vid utfärdande) skrivs så att `ADMIN_EMAILS` kan
   bytas mot `tenant_memberships`-baserad behörighetskontroll senare utan
   att invite-flödets semantik ändras — samma brygga-till-membership-
   princip som `cors.ts` och `create-admin-user` redan är byggda mot.

## Alternativ som förkastades

- **(A) Marcus bjuder in direkt från Supabase-dashboarden.** Noll bygge,
  men mailet blir Supabases generiska mall och kräver dashboard-åtkomst
  vid varje inbjudan — svarar inte mot "professionellt förstaintryck för
  Roger & Lotta" och skalar inte till framtida användare.
- **(C) Full self-service invite-yta i appen** (adminanvändare bjuder in
  fritt via UI). Mest bygge; bedömd över-engineering för två användare
  idag (över-engineering-vakten). Öppen decline — omprövas om
  användarantalet växer väsentligt över dagens två.
- **7-dagars invite-TTL** (branschmönstret bilagan citerade). Falsifierad
  mot Supabases plattformstak (86 400 s, globalt för alla e-postlänkar i
  projektet) — inte en avvägning, en teknisk omöjlighet inom plattformen.

## Konsekvenser

- Ny Edge Function + rad i `.prod-functions-allowlist.conf`
  (fail-closed-allowlisten) — ägs av `TASK-127.5`.
- Nya routes utanför `_authenticated`: `/valkommen` m.fl. — ägs av
  `TASK-127.5`/`TASK-127.6`, inte denna skiva.
- `ADMIN_EMAILS` kvarstår som gate tills `06b`-datamodellens
  `tenant_memberships` byggs; migrationsvägen är explicit bokförd men
  INTE en del av detta beslut.
- Auth-faktorn som sätts på `/valkommen` (lösenord/passkey) är ett
  separat beslut — se [ADR-093](ADR-093-auth-faktor-strategin-losenord-passkey.md).
- ADR-bar-prövningen: svår att återställa (EF-kontrakt, route-familj och
  invite-semantik byggs ovanpå) · överraskande utan kontext (utan detta
  beslut hade ett naivt signup-flöde varit en öppen account-takeover-väg)
  · verklig avvägning (tre skilda vägar vägda, se § Alternativ). Alla tre
  villkor håller.

## Relaterat

- [S87-spaningen](../../tasks/sessions/bilagor/s87-spaning/a4-riktig-webbapp-inbjudan.md)
  — branschmönster-källor (codifysaas.com, Linear) och
  account-takeover-diagnosen.
- Sessionsdok S95 Del 2, beslut 5 (invite-kanal) + beslut 7 (token-TTL).
- [ADR-093](ADR-093-auth-faktor-strategin-losenord-passkey.md) —
  följeslagar-beslutet: vilken auth-faktor som sätts på samma accept-sida.
- [ADR-091](ADR-091-hosting-deploy-vercel-pro.md) — domänschemat
  (`admin.miranon.dev`) invite-länken pekar mot.
- `ORDLISTA.md` § Användarinbjudan.

## Updates

### 2026-08-03 (S96) — Beslut 2 preciseras: rollen låses i `app_metadata`, aldrig `user_metadata`

**Vad som var otillräckligt.** Beslut 2 sade *"Roll och e-postadress låses av
inbjudan. Mottagaren väljer inget själv"* utan att namnge det Supabase-fält
låsningen sker i. Formuleringen var korrekt som avsikt men **operativt
underspecificerad på en säkerhetskritisk punkt** — och den naiva
implementationen leder rakt in i en account-takeover-väg, alltså exakt det
denna ADR finns för att stänga.

**Fyndet.** `supabase.auth.admin.inviteUserByEmail(email, { data })` skriver
sin `data`-param till **`user_metadata`**, som är **redigerbart av mottagaren
själv** via `auth.updateUser()`. En roll lagd där kan alltså höjas av den
inbjudne — AC#2 på `TASK-127.5` (*"roll och e-post låsta i metadata;
mottagaren kan inte ändra dem"*) hade varit falskt trots grön testsvit.

**Belägget är plattformens eget, inte vår tolkning.** Supabases
databas-linter klassar `user_metadata` i säkerhetskontext som **`SECURITY`
`ERROR`** (`rls_references_user_metadata`), med motiveringen *"user_metadata
is editable by end users and should never be used in a security context"*.
Dokumentationen säger samma sak i klartext: *"user_metadata for user-editable
data and app_metadata for admin-controlled data"*, och *"user_metadata should
never be used for security-sensitive logic … because it can be modified by
the user without validation"*.

**Preciseringen.** Rollen sätts i **`app_metadata`** (endast skrivbart med
service-role-nyckel). `user_metadata` får bära icke-säkerhetsbärande
uppgifter, aldrig behörighet. Detta gäller lika för den framtida
`tenant_memberships`-modellen i beslut 4: bytet av behörighetskälla ändrar
inte var behörighet får bo under tiden.

**Konsekvens för nedströms-skivorna.** `TASK-127.6` (accept-sidan),
`TASK-127.8` (passkey-erbjudandet) och varje senare yta som läser roll ska
läsa den ur `app_metadata` — och ingen RLS-policy eller behörighetskontroll
får någonsin referera `user_metadata`.

**Hur det fångades.** Av `TASK-127.5`:s bygg-agent i dess premiss-pass
(ADR-086): den läste ADR:n, såg att fältet inte var namngivet, verifierade
mot Supabase-dokumentationen och valde `app_metadata` — i stället för att
implementera den bokstavliga men osäkra läsningen. Orkestreraren
verifierade fyndet mot förstapartskällan före denna amendering. Ingen ny ADR
mintas: detta preciserar ett befintligt beslut, det river det inte.
