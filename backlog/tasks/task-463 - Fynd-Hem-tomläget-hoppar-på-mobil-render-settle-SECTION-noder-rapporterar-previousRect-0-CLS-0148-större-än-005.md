---
id: TASK-463
title: >-
  Fynd: Hem-tomläget hoppar på mobil - render-settle, SECTION-noder rapporterar
  previousRect 0 (CLS 0,148 större än 0,05)
status: To Do
assignee: []
created_date: '2026-09-18 13:50'
updated_date: '2026-09-18 13:51'
labels:
  - fynd
dependencies: []
ordinal: 803000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Upptäckt under TASK-451.7 (Hem-skeleton reserverar plats + CLS-grind, PR #2548).

## Symptom

Hem-vyns HELT TOMMA render-pass (`events: []`, `registrations: []`, `statements: []` — alla fyra datakällor tomma samtidigt) uppvisar ett layout-shift mellan skeleton och laddat läge som INTE går under CLS-tröskeln 0,05 på mobil (390×844), trots att varje enskilt block reserverar plats korrekt.

## Mätt (inte gissat)

- Mobil, `origin/main` (temporärt återställd `src/` under TASK-451.7:s arbete — `git diff`/`checkout`-dansen, ALDRIG `git stash`): **0,19366540652956052**
- Mobil, efter TASK-451.7:s fix (Nya anmälningar/Förfallna betalningar går från två skelett-rader till en): **0,14794941194561598** — en real, mätt förbättring (23,6 %), men fortsatt över tröskeln.
- Desktop (1280×720): grönt i båda lägena (0,0606 → 0,0383 efter fix).

## Metod

`PerformanceObserver('layout-shift')` installerad via `page.addInitScript` FÖRE navigering (samma metod som `tests/support/mat-cls.ts`s `matCLSOverNavigering`), körd mot en hallbar (håll-bar) MSW-mock som parkerar `get-events`/`get-registrations`/`get-activity-log` obesvarade tills testet släpper dem — deterministiskt, inget tidsfönster att missa.

## Källdump (fyra layout-shift-källor i EN entry, mätt på BÅDA lägena — mönstret är identiskt före/efter fix, bara magnituden ändras)

```json
[
  {
    "value": 0.14794941194561598,
    "sources": [
      { "tag": "SECTION", "cls": "flex min-w-0 flex-col gap-4", "prev": { "y": 549.1875, "h": 112 }, "cur": { "y": 351.1875, "h": 94 } },
      { "tag": "SECTION", "cls": "flex min-w-0 flex-col gap-4", "prev": { "y": 709.1875, "h": 112 }, "cur": { "y": 493.1875, "h": 70 } },
      { "tag": "SECTION", "cls": "flex min-w-0 flex-col gap-3", "prev": { "y": 0, "h": 0 }, "cur": { "y": 611.1875, "h": 140 } },
      { "tag": "SECTION", "cls": "flex min-w-0 flex-col gap-3", "prev": { "y": 0, "h": 0 }, "cur": { "y": 799.1875, "h": 44.8125 } }
    ]
  }
]
```

De två första källorna (`gap-4`-sektionerna) är Nya anmälningar/Förfallna betalningar — den REDAN KÄNDA, delvis åtgärdade skeleton-vs-tomläge-asymmetrin (se TASK-451.7:s `NyaAnmalningar.tsx`/`ForfallnaBetalningar.tsx`-docblock, "MEDVETET INGEN SKELETON-RESERVATION").

De två SISTA källorna (`gap-3`-sektionerna — Genvägar och Senaste aktivitet, identifierat via klassnamn och Y-position) är det NYA fyndet: `previousRect` = `{y:0, h:0}` för BÅDA, trots att BÅDA alltid renderas (Genvägar har ingen pending-gren alls — `src/components/hem/Genvagar.tsx` har ingen datakälla och är statisk sedan första bildrutan). `previousRect: {0,0,0,0}` är Layout Instability API:ts definition för "noden fanns inte i föregående renderade bildruta" — men Genvägar FANNS, med riktig geometri, i varje tidigare uppmätt frame. Detta tyder på en TVÅ-BILDRUTORS render-settle specifikt i det helt tomma fallet, inte en skeleton-geometri-defekt av samma typ som TASK-451.7 åtgärdade.

## Misstänkt mekanism (EJ verifierad — hypotes, inte fakta)

Hem läser FYRA oberoende TanStack Query-instanser (`useDashboardEvents`, `useDashboardRegistrations`, `useLatestActivity`, plus Bevakningsrads härledda state). Att samtliga fyra settlar i EXAKT samma renderingspass är inte garanterat även om de "släpps" i samma testtick (MSW-svarens promise-kedjor kan lösa ut i olika mikrotasks). Misstänkt: när events/registrations settlar i ETT commit-pass och activityLog i ett SENARE, hinner en mellanliggande layout committas där Genvägar/Senaste aktivitet tillfälligt saknar sin vanliga geometri (t.ex. via en förälders `display`/`visibility`-tillstånd, eller en reflow-artefakt kring `scrollbar-gutter: stable` i de nyss ändrade listorna) — INTE bekräftat, kräver en riktad diagnos (t.ex. instrumentera varje Reacts commit-callback, eller `page.evaluate` per-rAF-snapshot av samtliga sex sektioners `getBoundingClientRect()` under övergången).

## Varför utanför TASK-451.7:s scope

TASK-451.7:s kontrakt var att reservera skeleton-plats för block som KAN komma (Bevakningsrad/KvittojobbBanderoll/BulkAtgardsknapp) och bygga en CLS-grind utan `utanY()`-undantag. Detta fynd är en ANNAN felklass (render-settle mellan frames, inte skeleton-vs-laddat-geometri) och kräver egen diagnos.

## Borttagen test (röd-först — klistra in och gör grön i fix-PR:en)

Nedan är EXAKT den testkropp som fanns i `tests/acceptance/hem-laddlage.acceptance.test.ts` (testet `mobil 390×844 — tom data överallt …`, borttaget ur huvudsviten TASK-451.7 runda 2 eftersom `test.fixme()` överlever hermetik-självtestet — se `tasks/lessons.d/test-fail-som-rott-forst-markor-overlever-hermetik-sjalvtestet.md`). Återinför den (utan `test.fixme()`-blocket) som rött-först-bevis i fix-PR:en för detta kort:

```ts
test.describe('CLS-grinden — Hem tomläge (AC #3, TASK-451.7)', () => {
  for (const [namn, viewport] of [
    ['desktop 1280×720', HEM_CLS_DESKTOP],
    ['mobil 390×844', HEM_CLS_MOBIL],
  ] as const) {
    test(`${namn} — tom data överallt (Nästa event/Nya anmälningar/Förfallna betalningar/Senaste aktivitet i tomläge)`, async ({
      page,
      network,
    }) => {
      await arrangeraTomCache(page);
      const mocken = hallbarMockTomtLage(network);

      const cls = await matCLSOverNavigering(page, viewport, '/hem', async (p) => {
        await expect(p.locator('main#main').getByRole('status')).toHaveCount(5);
        mocken.slappAlla();
        await expect(p.locator('main#main').getByRole('status')).toHaveCount(0);
        await expect(
          p.getByText('Inga nya anmälningar att bekräfta, läget är under kontroll.'),
        ).toBeVisible();
        await expect(p.getByText('Inga förfallna betalningar.')).toBeVisible();
      });

      test.info().annotations.push({ type: 'cls-tomlage', description: String(cls) });
      expect(cls).toBeLessThan(HEM_CLS_TROSKEL);
    });
  }
});
```

`hallbarMockTomtLage`, `HEM_CLS_DESKTOP`, `HEM_CLS_MOBIL`, `HEM_CLS_TROSKEL`, `arrangeraTomCache` finns redan i samma fil (kvar efter borttagningen, används av kortets desktop-syskontest som ÄR kvar grön i huvudsviten).

## Pekare

- TASK-451.7 (PR #2548, `hem-laddlage.acceptance.test.ts`), § "TOMLÄGES-CLS — AC #3"-docblocket.
- `tasks/lessons.d/test-fail-som-rott-forst-markor-overlever-hermetik-sjalvtestet.md` — varför testet togs bort ur huvudsviten i stället för att fixme:as.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
