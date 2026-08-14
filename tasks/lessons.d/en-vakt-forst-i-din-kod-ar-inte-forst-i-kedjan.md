# En vakt först i din kod är inte först i kedjan

**En vakt som står FÖRST i DIN kod exekverar inte nödvändigtvis FÖRST i
KEDJAN — en plattformslager (t.ex. en API-gateway) kan ligga före den, och
då gäller din vakts ordning bara för anropare som når din kod.**

Supabase Edge Functions med `verify_jwt = true` har en gateway som svarar
`401` på varje anrop utan giltig JWT — INNAN funktionens egen kod körs.
En metod-vakt skriven som första rad i `index.ts` (`if (req.method !== 'X')
return 405`) ser ut som om den kör "före auth", och gör det verkligen — men
bara för de anrop som redan passerat gatewayen. En anonym begäran med fel
metod och utan `Authorization`-header får `401` från plattformen, aldrig
`405` från koden. "405 före auth" är korrekt som påstående om KODENS
ordning; det är fel som förutsägelse om vad en anropare UTIFRÅN observerar,
om anroparen aldrig når koden.

**Discriminatorn för att observera kodens egen ordning utifrån:** ett
JWT som är giltigt nog att passera gatewayens signaturkontroll men som inte
representerar en riktig användare — Supabase anon-nyckeln är exakt detta.
Den passerar `verify_jwt`, men faller i en `requireUser`-kontroll som
explicit avvisar `role === 'anon'`. Kombinerar man anon-nyckeln med fel
metod passerar anropet gatewayen och når funktionens egen metod-vakt FÖRE
`requireUser` — det enda sättet att se den interna ordningen utifrån.

**Instanser:**

- **T39-smoken, 2026-07-24** (S84, mot 13 prod-funktioner): samma gateway-
  först-effekt observerades första gången, som en klassning mellan
  405-bärande och 401-bärande funktioner i deny-smokens narrativ (aldrig en
  committad testfil — se TASK-38:s AC #2).
- **TASK-38** ("Fynd: sju EF:er saknar egen metod-vakt", rad 37 i
  Implementation Notes): dokumenterade avgränsningen explicit efter att ha
  lagt metod-vakten i sju EF:er — men hänvisade till DENNA fil innan den
  fanns (trasig referens, upptäckt och rättad `S105`, 2026-08-14).
- **`docs/reference/prod-driftsattning-runbook.md` § Steg 5** (rättad i
  samma PR som detta fragment, `S105`): runbooken hade fel förväntad
  utdata (`401 · 405 · 401`) för `log-activity`/`get-activity-log`, eftersom
  dess tre curl-anrop saknar `Authorization`-header och därför aldrig når
  koden — korrekt utfall är `401 · 401 · 401`. En fjärde, valfri probe
  (fel metod + anon-nyckelns `Bearer`-header) lades till för den som vill
  observera metod-vakten faktiskt köra.

**Generaliseringen:** varje gång ett kontrakt formuleras som "X görs före Y"
i kod som körs bakom ett plattformslager (gateway, proxy, middleware,
service mesh) — fråga om plattformslagret kan avvisa anropet INNAN X
någonsin exekverar. Om ja: kontraktet gäller för anropare som når koden, och
en "utifrån"-verifiering av kontraktet kräver ett anrop som medvetet
passerar plattformslagret men ändå faller i X.
