---
owner: marcus803
updated: 2026-08-21
review_by: 2026-11-21
status: stable
lifecycle: paused
---

# T159 — Driftdetektor mot Elfsight-kalendern

> Registrerad i S110 (2026-08-21) ur vakt-grillningens fråga 2. Detta är ett
> **medvetet bortval**, inte en glömska — och tråden finns för att bortvalet
> ska kunna omprövas mot en nedskriven trigger i stället för mot minnet.

## Vad den skulle göra

Diffa Elfsight Event Calendar-widgetens publika konfiguration
(`core.service.elfsight.com/p/boot/?w=8d8c059d-05b7-4f64-8468-ab24d7c9cc57`)
mot `Eventplanering.AnmälningsURL (kopiera denna)` och larma när en
kalenderposts anmälningslänk inte längre stämmer med basens kanoniska form.

Den fångar alltså felet **innan någon anmäler sig** — till skillnad från
`ADR-122`s A1-vakt, som fångar det vid första anmälan.

## Varför den inte byggs nu

Marginalvinsten efter rotfixen och A1-vakten är **en enda anmälan**.

| | Utan vakt (mätt, S110) | Med A1-vakt | Med A1-vakt + driftdetektor |
|---|---|---|---|
| Rader innan upptäckt | **64** | **1** | **0** |
| Upptäckt av | slumpsvep 4 månader senare | första anmälan | innan första anmälan |

Steget 64 → 1 är nästan hela värdet. Steget 1 → 0 kostar:

- ett **research-pass** mot en **oofficiell** endpoint — stabilitet och
  användarvillkor är båda okända, och Elfsight kan ändra formen utan förvarning
- en körplats och en larmkanal
- löpande underhåll av ett externt beroende vi inte styr — det enda i hela
  `ADR-122`-designen som har den egenskapen

Det är "byggt ifall" ovanpå en grind som redan håller, vilket den
dubbelriktade över-engineering-vakten säger ska skäras.

## Trigger för omprövning

Tråden tas upp igen om **något av dessa** inträffar:

1. Rotfixen visar sig inte hålla — nya felskrivna kalenderlänkar uppstår efter
   att `AnmälningsURL`-rutinen införts.
2. En felmatchning slinker igenom A1-vakten ändå (dvs. korsfältsvalideringen
   visar sig otillräcklig i praktiken).
3. Kunder hinner se fel datum i formuläret tillräckligt ofta för att det blir
   ett bemötandeproblem — den enda skada A1-vakten strukturellt inte kan
   förhindra, eftersom den verkar efter att formuläret visats.

## Skarv

- [`ADR-122`](../../docs/decisions/ADR-122-eventlankens-vakt-och-atgardskon.md)
  § Öppet — bortvalet bokfört i beslutet självt.
- `T158` — kalenderlänk-driftens moderfråga; `ADR-122` stänger dess
  vakt-designdel, denna tråd bär resten.
- Rotfixen (kalenderlänkarna på miranon.se) ägs av Marcus/Roger och är
  förutsättningen för att bortvalet håller.
