---
id: TASK-127.9
title: 'Skiva: Rundturs-e2e — inbjudan till inloggad, mot staging'
status: To Do
assignee: []
created_date: '2026-08-02 14:33'
updated_date: '2026-08-05 20:15'
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
- [ ] #1 Rundturen grön i den autentiserade staging-e2e-skarven
- [ ] #2 Flödet skapar och river sin egen testanvändare — inga rester i staging
- [ ] #3 Marcus-förkraven (OTP-livslängd 24 h, SMTP kopplad, redirect-mål registrerade) dokumenterade och avbockade före körning
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
riggen finns, redirect-målet är satt. Kvar är att skriva rundturen och bocka
AC #3:s förkrav.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
