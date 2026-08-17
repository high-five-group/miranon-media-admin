# Go-live-planen — Lotta in i appen

> **Äger:** sekvensen och go/no-go-kriterierna för Lotta-inbjudan.
> **Kartlägger:** korten i `backlog/` (detaljer bor där, aldrig här) och
> sessionsdok S102 (narrativ). Statuskolumnen uppdateras vid varje
> landning — en rad som ljuger är värre än ingen rad (ADR-100-andan).
> Född: S102-resume 2026-08-11, Marcus order "säkra det i fil".

**Målet:** Lotta inbjuden, inloggad och skarpt arbetande i appen, med
feedback-loop tillbaka till oss (hennes fynd → dagliga fix-vågor).

**Kritisk väg:** steg 1 → 2 → 3 → 5 → 8. Övriga steg löper parallellt.

## Stegen

| # | Steg | Ägare | Status 2026-08-11 |
|---|------|-------|-------------------|
| 1 | Granska + stämpla åtgärdsytan (`147.10`) | Marcus | **KLAR 2026-08-11** — hover/omklick levererade (#1166), Marcus-stämpel `efc4091a`, `147.10` Done, 147-kedjan stängd |
| 2 | Prod-mailvägen live (`176`+`177`, Grind F + T51) | Båda | **KLAR 2026-08-11** — skarpt mail delivered, Reply-To rätt, loggrad sekundexakt; `176`+`177` Done |
| 3 | QA-vandring hela Lotta-flödet (`147.9`) | Marcus | **KVAR 2026-08-17** — kortet står `To Do`; Marcus vandring |
| 4 | Roger-punkterna: moms, org-uppgifter, prisfält (ADR-109) | Marcus | VÄNTAR — ett telefonsamtal + GO till Code |
| 5 | Inbjudnings-repetition (`127.10`) + PWA (`126.3`/`126.5`) | Båda | **KVAR 2026-08-17** — `127.10` står `To Do`; steg 6 (passkey) blockerat av `231` (passkeys AVSTÄNGDA server-side i prod — Marcus klick i Supabase-dashboarden). Övriga åtta steg körbara nu |
| 6 | Bas-synk staging → prod (bilagor/kvitto/flagga/anteckningar) | Båda | **KLAR 2026-08-11** — `Bilagor` + `Kvitton` skapade i prod (spegelnamn verifierade); Väntelista-fältet uppskjutet (ingen skrivare) |
| 7 | Rent bord: grön natt före inbjudan | Code | **2026-08-17** — ärenden 0 ✓, arkivsvepet ✓, rotorsaks-flottan landad (`238`/`250`/`251`/`255`/`256`/`261`/`266`) ✓; ÅTERSTÅR en grön natt, tidigast 2026-08-18 (se noten under go/no-go) |
| 8 | Bjud in Lotta + "så här börjar du"-mail (Code skriver utkast) | Marcus | VÄNTAR på 1–7 |

## Parallella spår, i prioritetsordning

1. **S103 — person-vyerna**: **KLART 2026-08-15** (S103 Del 16, promoveringen
   exekverad ände-till-ände; skarpa routes disk-verifierade 2026-08-17).
2. **Hem-vyns omdesign**: egen ny session (Marcus startar). Underlag:
   `tasks/sessions/bilagor/s102-hem-konvergens/` (Morgonkoll-facitet;
   k10-facitet arkiverat till
   `tasks/sessions/archive/bilagor/s55-hem-konvergens/`, superseded vid
   TASK-243.1-promoveringen 2026-08-16).
3. **Fas 6.5 — Aktivitetslogg (xAPI)**, "historik-grejen": **KLART
   2026-08-14** (S105 Del 11 — Fas 6.5 ✅ KLAR, alla 19 kort stängda).
   Marcus dag 1-krav därmed uppfyllt.
4. **S104 — segment-ytan** (`181`): EFTER inbjudan — Lotta behöver den
   inte dag 1; trygghetstriaden skyddar sändytorna.
5. **Dokument-ytan** (`147.6`): EFTER inbjudan om Marcus inte säger
   annat — kräver bas-synken (steg 6) för verklig data i prod.

## Go/no-go-kriterier före steg 8

- [x] Åtgärdsytan stämplad (`147.10` Done, 2026-08-11)
- [x] Ett skarpt bekräftelsemail mottaget + loggrad verifierad
      (`176`+`177` Done, 2026-08-11)
- [ ] `147.9`-vandringen gjord, fynden åtgärdade eller medvetet
      deferrade
- [ ] Inbjudnings-repetitionen lyckad på Marcus egen testadress
      (`127.10`)
- [x] Bas-synken applicerad och verifierad (steg 6, 2026-08-11 —
      Bilagor + Kvitton i prod, spegelnamn lästa)
- [x] S103:s person-vyer promoverade (S103 Del 16, 2026-08-15 — verifierat
      mot disk 2026-08-17: `src/routes/_authenticated/personer/index.tsx` +
      `$personId.tsx` är skarpa routes, noll prototyp-markörer, ingen
      kvarvarande dev-variant)
- [x] Aktivitetsloggen (S105) levererad till hem-vyn — Marcus dag 1-krav
      (S105 Del 11, 2026-08-14 — Fas 6.5 ✅ KLAR, samtliga 19 kort stängda)
- [ ] En grön natt (nightly utan larm) — **kan inte uppfyllas 2026-08-17**;
      se noten nedan

> **Statusmätning 2026-08-17 (S102 resume 8).** Raderna ovan mättes om mot
> disk efter att kolumnen stått orörd sedan 2026-08-11: **två kriterier var
> redan uppfyllda** utan att bockas (person-vyerna, aktivitetsloggen). Tre
> står kvar: `147.9`, `127.10` och den gröna natten.
>
> **Nightly-kriteriet mäter inte appens funktion.** Nattens körning
> (2026-08-17 02:21Z) fälldes av tre jobb: Länkkontroll (ADR-082:s medvetet
> valda kostnad), Backlog-stängning (`cancelled` mot 10-min-taket) och
> Kontraktsvakten (fixtur-drift). Ingen av dem rör appens beteende för en
> slutanvändare. Fixarna för två av dem landade 2026-08-17 07:13–08:05Z —
> alltså EFTER nattens körning, som därför inte kunde bli grön. Första
> natten som ens kan bli grön är 2026-08-18. Kriteriet är ett proxy-mått
> för "rent bord" och bör vägas som sådant, inte som ett funktionsbevis —
> avgörandet är Marcus.

## Beslutslogg (Marcus, 2026-08-11)

- Omklick: testmail-knappen står kvar vid fel — retry-möjlighet.
- Prod-deploy: full app-paritet (33 EF:er), inte bara sändvägens fem.
- S103 före Lotta; S104 + dokumentytan efter.
- Bas-synken körs som två faser: read-only diff → apply på GO.
- Aktivitetsloggen (Fas 6.5) ska hinna till Lotta dag 1 — S105 startad.
- Justeringslistan från mailtestet tas muntligt vid nästa S102-resume.
