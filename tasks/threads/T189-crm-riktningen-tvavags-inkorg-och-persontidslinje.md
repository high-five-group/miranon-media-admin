---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: stable
lifecycle: paused
---

# T189 — CRM-riktningen: appen ska "ha koll på allt"

> Tråd-kort (ADR-053), fött i S128 (2026-09-19) ur grillningen om nya
> miranon.se (systertråd `T79`). ADR-053-triage: blockerar ej + värdefullt →
> defer. Grillnings-kandidat när researchen landat — Marcus startar.

## Vad Marcus sa

Frågan gällde kontaktformuläret på nya sajten. I dag skickar det ett mail
till administratören och loggas ingenstans. Marcus, ordagrant:

> nu med den nya sajten så vill jag bygga en inkorg i appen för detta, så
> mailkontakt kan loggas på alla personer också. Det är ju leads.

Och när orkestreraren föreslog att börja med enbart mottagning och loggning:

> Vi måste ju lägga grunden för ett branschledande CRM, appen måste ha koll
> på allt. Ingen mening med att bara ha steg 1 i appen, då kan det lika
> gärna vara som det är idag.

## Varför egen tråd

Riktningen gäller **hela admin-appen**, inte sajten: en tvåvägs-inkorg (ta
emot, svara från appen, fånga svaret tillbaka) och EN tidslinje per person
där meddelanden står bredvid utskick, anmälningar, betalningar och närvaro.
Den ska inte glida in i sajtens spec tyst — därav egen tråd och eget PRD.

## Beslutat i S128

| Beslut | Innebörd |
|---|---|
| 16 | Kontaktformuläret (med filuppladdning) ska landa i en inkorg i appen och loggas på personen som lead |
| 17 | Inkorgen byggs som HEL tvåvägs-funktion eller inte alls — aldrig en halv inkorg |
| 18 | Inkorgen grindar INTE sajtlanseringen: vid lansering mailar formuläret som i dag OCH lagrar varje meddelande i den slutliga modellen (tråd, meddelande, person, filer); gränssnittet släpps som eget spår när helheten är klar |

Förbehåll på beslut 18: om fasningen håller (t.ex. trådning av svar som
skett utanför appen under mellantiden) prövas av research-passet nedan.

## Öppet

- Datamodellen, var meddelandena ska bo (basen eller Supabase, jfr
  `ADR-110`), Resends inkommande mail på en subdomän (miranon.se:s mail
  ligger hos Microsoft 365 och rörs inte), skydd mot att skräp skapar
  personer i kundregistret, och om mail som skickas utanför appen kan fångas:
  `docs/research/kontakt-inkorg-i-appen-konversationslogg-2026-09-19.md`
  (pågick vid registreringen).
- Filuppladdningens form:
  `docs/research/publik-filuppladdning-kontaktformular-2026-09-19.md`
  (pågick vid registreringen).
- Förhållandet till `T93` (AI-assistenten): en assistent som "agerar som
  användaren" läser samma tidslinje — beslutas inte här.
- Inkorgen blir appens sjätte facit-lösa yta och går genom tvåfas-prototypen
  (`ADR-103`).

Fullständigt sammanhang:
[`tasks/sessions/2026-09-19-session-128.md`](../sessions/2026-09-19-session-128.md)
Del 4.
