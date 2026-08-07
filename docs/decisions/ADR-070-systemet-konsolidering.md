# ADR-070: SYSTEMET.md — konsoliderad system-dokumentation i hub-roten (absorberar ARKITEKTUR + WORKFLOW; ersätter spoke-systemet.md)

- Status: Accepted (Session 59 — 2026-07-08; grillad samsyn S57 Del 5 [6 beslut,
  `/grill-me`] + Marcus-kvittens denna session; kanonisk samsyns-trail:
  `tasks/sessions/archive/2026-07/2026-07-07-session-59.md` Del 2–3)
- Datum: 2026-07-08
- Fas: Session 59 — process/dokumentation (migreringskartans steg 4b; ingen
  byggfas-status-ändring)

## Kontext

Det operativa systemet (roller, hub/spoke, skills, governing, lifecycle, substrat,
MCP, distribution) beskrevs på tre fragmenterade, delvis stale ytor: spokens
`docs/reference/systemet.md` (tre-aktörs, governing men innehålls-stale — 13
drift-punkter mätta i S59:s inventering, T16-fenomenet: governing garanterar
stämpel, inte innehåll), samt hub-roten `ARKITEKTUR.md` (28 rader, 2026-05-25,
stale fil-träd) och `WORKFLOW.md` (349 rader, 2026-03-20, tre-aktörs-manual).
Migreringskartan (S47 Del 3, Omskriv-kön) satte systemet.md SIST i kedjan;
steg-4-grillningen (S57 Del 5, Marcus-kvitterad) beslöt EN källa i hubben. Detta
är kartans steg 4b.

## Beslut

1. **EN källa i hub-roten.** `SYSTEMET.md` (versal-konventionen) byggs som kanonisk
   karta över HELA operativa systemet. Struktur = kandidat C "Systemkartan"
   (komponent-katalog: bird's-eye §1 + en sektion per komponent §2–§13), dubbelskikt
   per sektion ("I klartext" för Gunilla-testet + "Mekaniken" med `fil:rad`), buret
   färskhets-kontrakt ([STABIL MEKANIK] / [AKTUELLT TILLSTÅND → via Code]).
2. **Absorbera + arkivera hub-filerna.** `ARKITEKTUR.md` + `WORKFLOW.md` →
   `archive/absorberad-i-systemet/` (arkivera-inte-radera). Substans-verifiering FÖRE
   arkivering (S59 Del 3). WORKFLOW:s yt-oberoende **projekt-livscykel-operationer**
   (starta/merga spoke, inspo, synk-kommandon) hör inte hemma i SYSTEMET.md (systemets
   HUR, ej hub-projekt-administration) och saknar levande efterträdare → bevarade i
   arkiv + **tråd T70** (rigor ej tyst struken, L250).
3. **Ersätt spoke-systemet.md.** Tre-aktörs-versionen → `docs/archive/`; en
   pekare-stub bärs kvar på `docs/reference/systemet.md` (governing, för stabil
   upptäckbarhet + oförändrad governing-count). Spoke-pekarna (CLAUDE, CONTRIBUTING,
   ORDLISTA, README) omdirigerade mot hub-hemvisten.
4. **Beslut-4-förfining (öppen rivning med kvittens).** S57 Del 5 beslut 4 sa
   "C4-nedstigning" som dok-ryggrad (pekade bokstavligt mot kandidat A, ren zoom).
   Förfinat: **C4 blir nedstignings-disciplin INUTI varje komponent-sektion** (helhet
   → detalj lokalt; [TILLSTÅND]-tabeller på config-nivå), inte doket-ryggrad —
   katalog-strukturen (C) bär ryggraden. Grundat i research (Diátaxis/arc42/C4 +
   branschprecedent) + färskhets-argumentet (komponent=sektion=underhållbar färskhet).
   Ett låst beslut är inte immunt mot evidens; rivet öppet, ej tyst.
5. **Acceptansgrindar (S57 Del 5 beslut 5), alla uppfyllda:** färsk-agent-testet
   (kontextlös agent orienterade sig + besvarade 8 kontrollfrågor enbart ur doket —
   PASSERAT), `fil:rad` + färskhetsmarkör per påstående, inkonsekvens-lista (§13b),
   Gunilla-test på klartext-lagren, Marcus-slutkvittens.

## Nummer-not (transparens)

`ADR-068` är **Övnings-ramverket** (Accepted, orört av denna ADR). **Två-aktörs-ADR:n**
(aktör-modellen Code+Marcus) är WIP och onumrerad — refereras nummer-neutralt (L241;
ADR-068:s lins-not: "numret aldrig reserverat"). Marcus-kvittens S59: två-aktörs-
prövotiden är **inte bevisad** → två-aktörs-ADR:n stannar Proposed/WIP. Denna ADR (070)
är konsoliderings-ADR:n för system-DOKUMENTET, skild från båda; den graderar inte
aktör-modellen.

## Alternativ som övervägdes

- **Kandidat A (C4-zoom-ryggrad)** — bokstavlig mot beslut 4, arkitektoniskt renast,
  men splittrar en komponent över zoom-nivåer (sämre uppslag) och störst
  C4-i-prosa-risk. **Kandidat B (narrativ)** — starkast Gunilla, men sämst
  uppslag + färskhets-underhåll (komponent utspridd i berättelsen). C valdes: felläget
  är DRIFT, ej obegriplighet; dominerande bruk är uppslag; §1+§4-vinjett bär
  färsk-agent-testet ändå.
- **Absorbera WORKFLOW:s projekt-livscykel-ops i SYSTEMET.md** — avvisat (scope-glid
  mot beslut 1); deferrat till T70 i stället.
- **Full arkivering av spoke-systemet.md utan stub** — avvisat (bröt fyra levande
  spoke-länkar + krävde governing-count-sänkning → test-fixtur-churn, L165/T23-klassen).
  Stub-vägen bevarar båda.

## Konsekvenser

- EN källa per system-del; hubben har nu ett kanoniskt operativt system-dok.
- Färskhet underhållbar: en drift-punkt landar i exakt en komponent-sektion.
- Hubben saknar CI (tråd T13) → SYSTEMET.md verifieras via läs-tillbaka-pass mot
  HEAD-blob per commit (L239), inte CI-grind.
- Spoke-pekare + stub bevarar upptäckbarhet från spokens orienterings-ytor;
  governing-count oförändrad (14).
- **T22 konsumerad** (pekar-omdirigeringen gjord); **T70** bär projekt-livscykel-
  restposten; SKILLS-INVENTORY.md-innehålls-staleness bärs som öppen not i §13(b).
- Reversibelt: `git mv` tillbaka ur arkiven (fallback-vägar i respektive ARKIV-README).
