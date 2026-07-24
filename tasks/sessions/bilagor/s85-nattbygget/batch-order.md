# Nattbyggets batch-order (S86) — dukad i S85

> Durabel go-yta: S86 startar med session-start-rutinen, re-verifierar
> § Förkrav och avfyrar § Ordern på Marcus "go". Ordern är
> batch-kvittot (ADR-071 beslut 1); utan Marcus explicita "go" körs
> ingenting. Dukad 2026-07-25 i S85; källa: T86 § Körplanen punkt 4 +
> S83 Del 8 § Kvar efter S83.

## Ordern (avfyras på Marcus "go" i S86)

`/work-batch` · **max-kort 6** · korten **17.7 · 18.15 · 18.16 ·
18.17 · 18.18 · 18.19** (nattbyggets sex, alla `ready-for-agent` med
AC #1 avbockad; substratets deps styr plockordningen).

- **Varje skiva är pilot-skiva** (T86 beslutsläge 3): loggrad i
  T86-kortets § Pilot-loggen (fynd · åtgärdade · avfärdade · routade ·
  klass · tid · missar nedströms).
- **Granskningsfärdigt läge per ADR-071 beslut 3:** skivor med
  design-review-grind i DoD drivs till kod, mekanisk facit-avprickning,
  CI grön per jobb och AC bockade; kortet står `In Progress` med not —
  Done-flippen är Marcus i morgongranskningen. Skivor utan
  människo-grind drivs till Done per tvåstegs-stängningen.
- **Landningsform: ADR-076,** inte ADR-071 beslut 5:s trunk-push —
  branch + PR + `gh pr merge --auto --merge` per skiva (merge-commit;
  squash river SHA-bevisen). Tvåstegs-stängningen gäller:
  leverans-commit (kod + kort) · stängnings-commit (final-summary +
  status) efter CI-verifiering per jobb.
- **Rött-först per S80-amenderingen av ADR-071:** lokalt körutdrag är
  bäraren (testnamn + observerat felutfall + antal, citerat på kortet);
  rött + grönt pushas IHOP — aldrig avsiktligt röda körningar i kön.
- **Halt-first (ADR-071 beslut 4):** batchen stannar vid FÖRSTA
  STOPPA-/abort-utfall; kortet återställs To Do med avbrotts-not;
  batch-rapporten pekar ut det. Aldrig samma kort två gånger i samma
  batch. Ingen skiva hoppar över konventions-bilagan nedan.
- **F6-experimentet (T89, omlandat hit per S83 Del 5):** EN skiva körs
  på lägre effort; väggklocka + utfall + grindar jämförs mekaniskt mot
  batchens baslinje och loggas för T89. **Föreslaget F6-fönster:
  18.16** (Code-designval, öppet för Marcus-veto vid "go": minst
  design-rymd — grön knapp-regeln är låst, skivan är kodifiering +
  audit + e2e — alltså mest mekaniskt mätbar).
- **INSTANT-regeln (ADR-078) gäller varje skiva:** navigering väntar
  aldrig på data som redan finns i cachen · partiell placeholder
  kräver skydd för fält som saknas (`?? 0`-klassen mot aggregat) ·
  prefetch på avsikt · skeleton i slutgeometri eller inte alls ·
  golvet deklareras mätt, döljs inte.
- **L328:** inga docs-landningar under en långsam svits fönster;
  staging-mutexen serialiserar sviterna själv.

## Förkrav (verifierade i S85 — RE-VERIFIERAS vid S86-start)

- [ ] `main` grön per jobb (efter audit-läkningen PR #169) + rent träd.
- [ ] `ready-for-agent` ×6 i substratet (läses via backlog-CLI:t).
- [ ] Review-piloten aktiv (hub-plugin 1.20.x, `claude plugin list`).
- [ ] Numreringen omläst OMEDELBART före första skrivning — inte bara
      vid sessionsstart (S83:s kollisions-lärdom, S84-fallet).
- [ ] Ingen ny audit-advisory (`npx audit-ci --config audit-ci.jsonc`).

## Konventions-bilagan — läses av VARJE skiv-agent före implementation

> **Detta är en batch-lokal LÄSKOPIA, inte konventionernas hem.**
> Hem-frågan (UI-KONVENTIONER.md / DESIGN-SYSTEM-SPEC / Storybook) är
> öppen — grillnings-/ADR-klass, S83 Del 7 + L337. Källpekarna nedan
> är sanningen; vid konflikt vinner KORTETS Implementation Notes
> (facit) över bilagan, och bilagan över egen improvisation. Att
> uppfinna egen grammatik där repot redan har en är F4-klassens fel —
> S83 pass 4 fångade det TVÅ gånger inom en timme.

1. **Formklassen (K75–K84)** — `CreateEventForm.tsx` +
   `ManuellAnmalanForm.tsx` (JSDoc-huvudena): stor rund chevron + h1
   med avgränsande linje + kontextrad · grupprubriker UTANFÖR de
   tonala korten (`DetaljGrupp`) · label-över-fält · RAC-primitiver
   (`DatumFalt`/`AntalFalt`), aldrig text-Inputs · fel visas först vid
   Spara-försöket · knappraden primär först, vänsterställd · `px-4` =
   kortens inner-inset.
2. **Märknings-regeln (K84)** — `ManuellAnmalanForm.tsx`: markera
   UNDANTAGEN, inte normen. Allt krävs ⇒ ingen märkning alls;
   frivilliga fält bär "(valfritt)"; `isRequired` står kvar för
   a11y-golvet (skärmläsar-annonseringen), aldrig visuell asterisk.
3. **Slot-modellen (PRD-beslut 6)** — `EventCard.tsx`: kort alltid
   likformiga; alla metarader renderas ALLTID med platshållare vid
   saknat värde; status-slotten är SEMANTISK (avvikelser ersätter
   dagar-kvar; Planerat/Genomfört tysta); texten bär ALLTID — färg/
   dimning är förstärkning, aldrig ensam bärare (WCAG 1.4.1);
   dämpning är text-token-buren, ALDRIG kort-opacity (axe-empirin).
4. **Chevron-grammatiken + hover-plattan** — `NavCard.tsx` +
   `detail/Atgarder.tsx`: chevron höger (18 px, aria-hidden) betyder
   att raden leder vidare (ingen-chevron-regeln REVS öppet, spec §14).
   Åtgärdsrader: vänsterställda med ikon-kolumn 16 px + hover-plattan
   (K56: `-mx-2 px-2 rounded-lg` + `bg-emphasized` + `motion-safe`);
   K54-vakten: aldrig `w-full` ihop med `-mx-2`. NavCard-rader: INGEN
   hover-bakgrund (M3 prövad och förkastad — medvetet facit-beslut).
   Siffer-rutan i Åtgärds-gruppen: nummer ensamt, vit ruta
   (`bg-surface`), aria-hidden dekor (18.15-facitet).
5. **Månadsrubriks-formen** — `EventsList.tsx`: `font-semibold
   text-small text-text-secondary`, ALDRIG ALL CAPS (S83 pass
   4-fångst #1). Laddlägen: skeleton i listans SLUTGEOMETRI.
6. **Navigering ≠ handling** — länkar bär navigeringens nedtonade
   vikt och ärver ALDRIG åtgärdsradernas handlings-form (S83 pass
   4-fångst #2; jfr `EventCard`:s länk-mönster).

## Efter batchen (morgonen — T86 § Körplanen punkt 5–6)

Marcus granskningsvåg = escapes-facit för pilot-loggen +
pilot-triagens Marcus-moment (blocker-fynd + avfärdande-stickprov).
Review-utfallen hanteras per ADR-071 S76-amenderingen (FIX /
FACIT-REVIDERING / ITERATION). Därefter T85-korrigeringssessionen
(sekvens låst) — och konventions-hemmets grillning när Marcus öppnar
den.
