# En grön grind bevisar att inget fällde — inte att låset täcker det du tror

**[UNIVERSAL] Ett regressionslås kan tappa täckning utan att någonsin bli rött.
Möts en partiellt matchande assertion av en uppdaterings-flagga som bara skriver
om det som FÄLLER, blir resultatet ett lås som passerar varje körning och inte
längre beskriver ytan. Grönt är frånvaro av fällning, aldrig närvaro av
täckning.**

Instans (`TASK-283.4`, 2026-08-22): sex `toMatchAriaSnapshot`-referenser skulle
sättas om mot personlistans nya form — en bokstavsrad ovanför listan. Två
mekanismer möttes:

- `toMatchAriaSnapshot` matchar **partiellt**: extra syskonnoder tolereras så
  länge referensens egna noder står i samma inbördes ordning. Fyra av de sex
  referenserna passerade därför utan att innehålla den nya raden.
- `--update-snapshots` utan värde har preset `changed`. Playwright 1.62.1:s egen
  `--help`, verbatim: *"choices: 'all', 'changed', 'missing', 'none', preset:
  'changed'"* — den skriver alltså bara om en referens som fäller.

Mätt: `--update-snapshots` skrev om **2 av 6** filer, `--update-snapshots=all`
skrev om **6 av 6** (commit `dcb06829` bär sex ändrade `.aria.yml`). Med
standardflaggan hade sviten rapporterat 16 passerade / 0 fällda medan fyra lås
saknade raden — och en regression i just den raden hade fångats av ingenting.

**Det generella:** när ett lås sätts om efter en avsiktlig formändring, mät
ANTALET omskrivna referenser mot antalet du förväntade dig. Det talet, inte
grindens färg, är beviset på att låset täcker den nya formen. Frågan gäller
varje snapshot-verktyg med en `changed`- eller `missing`-default och varje
assertion som matchar delmängder i stället för helheter: den som bara reparerar
det röda lämnar det gröna ofullständiga kvar, och ofullständigheten är osynlig
per konstruktion.

**Tvåsidigt bevis hör till samma andetag.** Omskrivningen verifierades genom att
döpa om en nod i en av de nya referenserna — grinden föll (exit 1). Före
omskrivningen kunde samma provokation inte fälla någonting. Det är skillnaden
mellan ett lås och en fil som råkar ligga där.

Släkt: fragmentet `verifiera-mot-den-axel-andringen-ror-inte-mot-fixturernas-rakade-tomhet.md`
— samma rotklass, där i FIXTUR-ledet i stället för i uppdaterings-ledet.
