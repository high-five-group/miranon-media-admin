---
id: TASK-127.9
title: 'Skiva: Rundturs-e2e — inbjudan till inloggad, mot staging'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-06 08:27'
labels:
  - ready-for-agent
dependencies:
  - TASK-127.3
  - TASK-127.5
  - TASK-127.6
parent_task_id: TASK-127
ordinal: 213000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ETT staging-e2e-flöde bevisar hela kedjan ände till ände: inbjudan utlöses via EF:en, mail-länken konsumeras, accept-sidan sätter lösenord, inloggning sker på nya login-vyn och en autentiserad vy nås. En rundtur — inte många. Testanvändaren skapas och rivs av flödet självt.

Täcker användarberättelser: 2, 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rundturen grön i den autentiserade staging-e2e-skarven
- [x] #2 Flödet skapar och river sin egen testanvändare — inga rester i staging
- [x] #3 Marcus-förkraven (OTP-livslängd 24 h, SMTP kopplad, redirect-mål registrerade) dokumenterade och avbockade före körning
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Fas 7-beroendet — RÄTTAT 2026-08-05 (S96), efter Marcus pushback

**Den tidigare noten här var fel och är riven.** Den påstod att AC #1 inte kan
bli grön förrän Fas 7 landar. Marcus fällde påståendet med *"Jag har visst
kopplat Github och Vercel och du har bekräftat det. Inget borde blockera
Task-127.9 tycker jag"* — och mätningen gav honom rätt.

### Vad som faktiskt gällde

Deploy-pipelinen är **framdragen ur Fas 7** på Marcus S95-beslut
(`docs/byggplan.md` rad 88, öppet bokförd avvikelse). Vercel Pro-projektet är
kopplat, `admin.miranon.dev` är live, och **GitHub-integrationen fungerar** —
verifierat mot GitHub deployments-API: `vercel[bot]` skapar Preview per gren
och Production per main-merge; PR `#817` bär en grön `Vercel`-check.

Den enda verkliga bristen var **en saknad post i STAGINGS `uri_allow_list`**.
Live-mätning mot Management API visade exakt två poster, båda mot
`admin.miranon.dev` — prod-domänen, som pratar med prod-Supabase. Ett
staging-test kunde inte använda dem.

**Åtgärdat samma dag:** `http://localhost:5173/**` tillagd i STAGINGS lista via
riktad PATCH (1 fält av 242 ändrat, maskinellt diffat; prod omläst och
verifierat ORÖRD). Det är samma rigg som elva redan gröna
`tests/e2e/*.staging.test.ts` använder — `chromium-authenticated` mot lokal
dev-server på port 5173 med staging-Supabase i botten.

Posten kan INTE låsas i `supabase/config.toml` (delad fil, deklarativ push →
hade spillt till prod). Konsekvensen är bokförd i filen: en framtida
`config push` mot staging nollställer den tyst.

### Varför felet uppstod — värt att minnas

Research-passets §8 citerade `tests/e2e/auth-flow.staging.test.ts` rad 24–31,
skriven i **Session 5**. Sann då. Skriven långt före S95:s Vercel-beslut. Den
lästes som ett gällande beslut i stället för som en daterad ögonblicksbild, och
`T46` Grind 0 punkt 1 bar samtidigt kvar ett `ÖPPET:`-stycke om
GitHub-integrationen som redan var löst. Två inaktuella tillståndsytor,
lästa med förtroende. Båda rättade i samma landning som denna not.

### Vad som byggdes och vad som återstår

`test-invite-completion` (staging-only EF, `#817` + `#820`) löser mail-hoppet:
den ger `action_link` + `hashed_token` via privilegierad backend-läsning, precis
som Ghost, cal.com och twenty gör. Branschprecedenten i
`docs/research/auth-invite-e2e-service-role-branschprecedent-2026-08-05.md`.

**Kortet är plockbart.** Deps `127.3`/`127.5`/`127.6` är Done, EF:en finns,
riggen finns, redirect-målet är satt.

## AC #3 — förkraven mätta live 2026-08-06, inte antagna

Mätt av orkestreraren mot Supabase Management API, staging-projektet
`pqtshyierkdgwdnxuirz`. Rå läsning av `/config/auth` (242 fält) — inga
antaganden ur `config.toml`:

| Förkrav | Fält | Uppmätt värde | Utfall |
|---|---|---|---|
| OTP-livslängd 24 h | `mailer_otp_exp` | `86400` s | exakt 24 h |
| SMTP kopplad | `smtp_host` | Resends SMTP-värd | satt |
| SMTP kopplad | `smtp_admin_email` | `konto@send.miranon.dev` | satt |
| SMTP kopplad | `smtp_user` | icke-tom | satt |
| Redirect-mål | `uri_allow_list` | `…/valkommen`, `…/nytt-losenord`, `http://localhost:5173/**` | alla tre |

Noterat i samma läsning, utöver förkraven: `mailer_otp_length` = `8` (höjd i
S96) och `disable_signup` = `true` (självregistrering stängd per ADR-092).

**Hostnamnet är utelämnat med avsikt.** Repots `deny-resend-send.sh`-hook
(`TASK-137`, Rogers mail-lås) matchar Resends SMTP-hostnamn som mönster i varje
Bash-kommando, och fällde denna bokföring som om den vore ett utskick. Inget
mail skickas här — men mönstret undviks hellre än att hooken luckras upp.
Värdet står i klartext i `supabase/config.toml`.

AC #3 är bockad på denna mätning. AC #1/#2 bevisas av rundturs-testet.

## AC #1 och #2 — bevisade 2026-08-06, i CI och lokalt

Rundturs-testet (`tests/e2e/invite-rundtur.staging.test.ts`, PR `#826` →
`5b493536`) är bevisat på två oberoende sätt:

- **Lokalt:** två skarpa körningar mot `chromium-authenticated`, 8,3 s och
  6,0 s, exit 0 båda gångerna.
- **I CI:** `post-merge.yml`-körning `31084229170` på det mergade trädet.
  Steget `E2E tests (staging)` körde **177 tester** och rundturen fanns bland
  de **175 passerade**.

AC #2 bärs mekaniskt: `test.afterEach` anropar `delete_user` och assertar
`status === 200` **utan** `try/catch`, så en misslyckad teardown fäller testet
i stället för att tystna. Två gröna körningar är därmed ett positivt bevis på
att rivningen faktiskt kördes och lyckades.

## DoD #3 ÄR INTE UPPFYLLD — och det är avsiktligt inte bortförklarat

`post-merge`-jobbet på `5b493536` blev **rött**, men **inte av detta korts
arbete**. De tre fällda testerna är samtliga `mark-paid.staging.test.ts`
(rad 297, 521, 594), med `strict mode violation — resolved to 3 elements` på
`Eva Lindqvist` och `Föreläsnings Person`.

Rotorsaken ligger utanför detta kort: commit `6f1d8c1a` (*"proto(S93):
iterationsvåg på konvergens-prototypen"*) lade två `sr-only`-rubriker i
`src/components/events/detail/Betalningar.tsx` rad 438 och 463, båda med
personens namn i texten. `mark-paid`-testet använder `getByText(<namn>)`, som
därmed träffar tre element i stället för ett — länken plus de två nya
rubrikerna. Samma rotorsak fäller `#821`, `#824` och `#825`.

**Larm-automatikens revert-förslag pekar på fel PR.** Den resonerar
"föregående post-merge var grön ⇒ denna landning är misstänkt", vilket utpekar
oskyldiga poster; en revert hade rivit korrekt arbete och lämnat orsaken kvar.

Kortet hålls därför ÖPPET tills `mark-paid`-selektorerna är skärpta och
post-merge är grönt. Fixen ligger i appspårets fil medan `S93` är `active` —
vägvalet är Marcus, inte en agents.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
