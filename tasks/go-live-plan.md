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
| 1 | Granska + stämpla åtgärdsytan (`147.10`) | Marcus | PÅGÅR — hover/omklick-fixen i kön (PR #1166); ny stämpel krävs efter formändringen |
| 2 | Prod-mailvägen live (`176`+`177`, Grind F + T51) | Båda | PÅGÅR — secret ✓, 33 EF:er deployade ✓, deny-probes 8/8 ✓; ÅTERSTÅR testevent + bekräftelse + inkorgsverifikat |
| 3 | QA-vandring hela Lotta-flödet (`147.9`) | Marcus | VÄNTAR på steg 1–2 |
| 4 | Roger-punkterna: moms, org-uppgifter, prisfält (ADR-109) | Marcus | VÄNTAR — ett telefonsamtal + GO till Code |
| 5 | Inbjudnings-repetition (`127.10`) + PWA (`126.3`/`126.5`) | Båda | VÄNTAR — förkraven klara (`143`+`144` Done); `126.3` byggbar på GO |
| 6 | Bas-synk staging → prod (bilagor/kvitto/flagga/anteckningar) | Båda | PÅGÅR — diff-fas (read-only research); apply ENDAST på Marcus GO |
| 7 | Rent bord: grön natt före inbjudan | Code | PÅGÅR — 10 röda ärenden stängda ✓, arkivsvepet ✓ (PR #1164), `197`-fixen + `169`-bockningen i bygge |
| 8 | Bjud in Lotta + "så här börjar du"-mail (Code skriver utkast) | Marcus | VÄNTAR på 1–7 |

## Parallella spår, i prioritetsordning

1. **S103 — person-vyerna** (D-varianten redo att granskas): FÖRE
   Lotta — kärnyta i hennes vardag. Marcus återupptar och granskar.
2. **Hem-vyns omdesign**: egen ny session (Marcus startar). Underlag:
   `tasks/sessions/bilagor/s55-hem-konvergens/` (k10-facit).
3. **Fas 6.5 — Aktivitetslogg (xAPI)**, "historik-grejen": egen ny
   session. I plan (byggplan §Fas 6.5, est. 1 session). Väg: grillning
   → PRD → skivor, med k10-facitbilderna + Fas 6.5-spec som underlag.
4. **S104 — segment-ytan** (`181`): EFTER inbjudan — Lotta behöver den
   inte dag 1; trygghetstriaden skyddar sändytorna.
5. **Dokument-ytan** (`147.6`): EFTER inbjudan om Marcus inte säger
   annat — kräver bas-synken (steg 6) för verklig data i prod.

## Go/no-go-kriterier före steg 8

- [ ] Åtgärdsytan stämplad (`147.10` Done)
- [ ] Ett skarpt bekräftelsemail mottaget + loggrad verifierad
      (`176`+`177` Done)
- [ ] `147.9`-vandringen gjord, fynden åtgärdade eller medvetet
      deferrade
- [ ] Inbjudnings-repetitionen lyckad på Marcus egen testadress
      (`127.10`)
- [ ] Bas-synken applicerad och verifierad (steg 6) — annars felar
      bilagor/kvitto/flagga i prod
- [ ] S103:s person-vyer promoverade
- [ ] En grön natt (nightly utan larm)

## Beslutslogg (Marcus, 2026-08-11)

- Omklick: testmail-knappen står kvar vid fel — retry-möjlighet.
- Prod-deploy: full app-paritet (33 EF:er), inte bara sändvägens fem.
- S103 före Lotta; S104 + dokumentytan efter.
- Bas-synken körs som två faser: read-only diff → apply på GO.
