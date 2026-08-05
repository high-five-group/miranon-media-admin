# En write-only secret går att BEVISA, inte bara gissa

**Kan värdet inte läsas ut men en digest exponeras, är varje hypotes
verifierbar utan en enda skrivning: hasha kandidaten lokalt och jämför.
Kombinerat med funktionell enumerering rekonstrueras hela värdet — och en
destruktiv skrivning behöver aldrig ske i blindo.** `[UNIVERSAL]`

Datum: 2026-08-05 (S96, femte resumen) | Klass: destruktiva skrivningar mot
oläsbara konfigytor

## Problemet

`supabase secrets set CORS_ALLOWED_ORIGINS=…` skriver över **hela** värdet —
listan är en enda komma-separerad sträng. För att lägga till en origin måste
alla befintliga vara kända. Men värdet är write-only: CLI:t visar bara en
digest, och Management API:ts `/secrets`-endpoint returnerar **samma digest**,
inte värdet.

Vår egen bokföring dög inte som facit heller (se
[[bokforing-kan-bli-falsk-utan-att-nagon-andrar-den]]).

## Vägen fram

Två oberoende instrument, som tillsammans ger visshet:

1. **Digest-matchning.** Digesten visade sig vara rå SHA256 av strängen —
   bevisat genom att en kandidat för ETT projekt matchade exakt. Därmed blev
   varje hypotes prövbar lokalt, till noll risk och noll skrivningar.
2. **Funktionell enumerering.** En `OPTIONS`-preflight mot en Edge Function
   svarar 200 för allowlistad origin och 403 för icke-allowlistad, helt utan
   autentisering. Det ger medlemskapet för varje origin man kan gissa — men
   kan inte upptäcka poster man inte tänkt på.

Instrument 2 matar instrument 1: preflighten hittade kandidaterna, hashen
bevisade den exakta strängen inklusive ordning och separatorer.

## Vad det gav

Det dokumenterade värdet var två origins. Det verkliga var fyra — tre
Vite-portar (`5173`, `5174`, `5175`) plus preview-porten, eftersom Vite trappar
upp porten när 5173 är upptagen. **Ingen bokföring nämnde 5174 eller 5175.**
En skrivning efter dokumentationen hade tystat två fungerande
utvecklingsportar, och felet hade visat sig först när någon körde två
dev-servrar samtidigt.

Sökningen krävde tålamod: 504 whitespace- och separator-varianter av de två
kända gav noll träffar. Det var det negativa utfallet som bevisade att en post
saknades — och som motiverade portsvepet i stället för en kvalificerad gissning.

## Regeln

Innan en destruktiv skrivning mot en yta vars nuvarande värde inte kan läsas:
leta efter ett *verifierbart* spår — digest, checksumma, funktionellt svar.
Finns ett, är gissning inte längre nödvändig. Finns inget, är det en
STOPPA-grind, inte en kalkylerad risk.
