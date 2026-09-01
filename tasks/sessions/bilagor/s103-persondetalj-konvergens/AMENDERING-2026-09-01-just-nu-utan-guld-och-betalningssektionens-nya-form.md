# Amendering 2026-09-01 — "Just nu" tappar guldet helt, betalningssektionen får bank-anatomi

**Yta:** `persondetaljen` i
`tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` (Marcus
2026-08-12: *"godkänner"*, stämpel-SHA `4648823a`). Skarp källa för
huvudändringen: `src/components/persons/PersonDetail.tsx` § `VariantD` — en
`kallor`-fil, alltså en DIREKT ändring av ytan, inte en ripple.

**Klass:** *ny form* — Marcus egna domar i iterationsloopen 2026-09-01 på
grenen `fix/hem-betalningskort-marcus-iteration`.

**Varför denna fil finns:** bokförings-uppdraget namngav tre kataloger
(`s102-hem-konvergens`, `s93-atgardssida-promovering`,
`s93-hallplats-prototyp`) men beskrev "Just nu"-blockets rivning under den
andra rubriken. Blocket bor i `PersonDetail.tsx`, som är `kallor` i **detta**
manifest och inget annat — mätt mot samtliga `facit.json` i
`tasks/sessions/bilagor/`. Sidofilen skrivs därför här, och divergensen
rapporteras i stället för att byggas vidare på (ADR-086). Samma klass av
upptäckt som `s93-hallplats-prototyp/AMENDERING-2026-08-31-atgardspanelens-betalningsblock.md`
gjorde 2026-08-31.

---

## FÖRST: samma icke-innehållslåsta läge

`persondetaljen` **saknar `referenser`-nyckeln** (mätt 2026-09-01), och de
fyra `.aria.yml`-referenserna under
`tests/visual/__aria__/persondetalj-promoverings-grind.spec.ts/` renderas med
miljöflaggan **AV** — Betalningar-sektionen syns därför inte i den mekaniska
grinden alls. Se `AMENDERING-2026-08-31-betalningar-sektionen.md` § FÖRST för
belägget; det upprepas inte.

```bash
bash scripts/check-facit.sh   # exit 0, före och efter
```

**Men "Just nu"-blocket är en PROD-YTA, flagg-oberoende.** Till skillnad från
allt annat i denna sidofil gäller den ändringen omedelbart för Lotta, utan
någon flagga att slå på. Det är också skälet att den fick två domar på en dag.

---

## 1. "Just nu": guld-fond → guld-kontur → INGEN TON (`02e9f9af`, `4c290fc1`)

**Båda guld-varianterna är prövade och rivna, i den ordningen.** Historiken
står kvar i koden därför att den är hela skälet att inte försöka en tredje
gång.

### Steg 1 — guld-FONDEN revs

Marcus dom, ordagrant:

> *"'Just nu-blocket' på persondetalj-sidan måste justeras, det funkar inte
> att ha gul bakgrund på det, det skär sig med färgerna som 'event-raderna'
> har. Jag tror det bästa är att kanske enbart ha gul kontur."*

**Krocken var äkta, och satt i LAGREN.** Blocket bar `bg-primary-tint`
(`#fbf3e0`, varm gul). Raderna INUTI bär `bg-bg-emphasized` (`#edeee9`, kall
neutralgrå) PLUS en kursfärgad vänsterkant (blå/grön/koppar via
`kursfargForKurs`). Tre kulörfamiljer på tre lager ovanpå varandra — och
fonden var den enda av de tre som inte bar någon information.

Steg 1 bytte till `border border-primary-border bg-surface
contrast-more:border-text` och mintade en ny semantisk roll
`--mm-primary-border`, eftersom en kant som bär en yta ENSAM måste klara
1.4.11-golvet 3:1 mot vit botten och ingen befintlig primär-roll gjorde det
(mätt, sRGB mot `#ffffff`): `primary-pale` 1,43:1 ✗ · `primary-muted` 2,33:1 ✗
· `primary` 2,57:1 ✗ · **ny `primary-border` (gold-600) 3,43:1 ✓**.

### Steg 2 — guld-KONTUREN revs samma dag

> *"Ta bort den oranga konturen på just nu blocket, jag vill inte ha den."*

**Slutsatsen är inte "fel ton" utan "ingen ton":** blocket är en sektion bland
systrarna, inte en hero.

**Formen är ÅTERANVÄND, inte omskriven.** Blocket bär nu `kortKlass` — exakt
samma sträng som Ström- och tomläges-blocken i samma komponent redan
använder, och samma form som `Sektion`s behållare (`bg-bg-muted`, transparent
kant, `contrast-more:border-border-strong`).

**Föräldralös token borttagen:** `--mm-primary-border` och dess
Tailwind-brygga `--color-primary-border` hade efter rivningen noll konsumenter
(verifierat med repo-bred grep före och efter) och är borta. Inga föräldralösa
tokens kvar efter passet.

### Vad som INTE ändrades i blocket

**Event-raderna är byte för byte orörda i alla tre varianterna** — grå yta,
kursfärgad vänsterkant, hover-formen, klickbarheten, `bg-emphasized`-skrimmet.
Det var aldrig de som var fel. B3:s facit-krav (ENBART aktiva anmälningar,
raden FYLLD i vila och klickbar till anmälan, ingen dagar-kvar-pill) är
oförändrat uppfyllt.

### En systeryta med motsatt lösning — flaggad, inte tyst avgjord

Granskningsblocket i betalningsinkorgen fick samma dag guld-tint **MED**
kontur (`d7749203`). Det är den motsatta lösningen på samma fråga: där bär
fyllnaden ytan och kanten förstärker, här bär ingendera. Vill Marcus ha EN
form bär de två blocken den lätt — flaggat för hans dom, inte ändrat på eget
bevåg.

## 2. Betalningssektionen — ripple genom delade komponenter

`PersonDetail.tsx` monterar `PersonBetalningar`, som monterar
`InbetalningsLista`. Ingen av de två är `kallor` i detta manifest, men deras
nya form syns på ytan — samma ripple-klass som
`AMENDERING-2026-08-31-inbetalningsradernas-formsprak-346-14.md` bokförde.

**Statuskort av toppen (`2f95d175`).** Marcus: *"Det är något med den översta
raden i betalningsblocket som stör mig, borde vi inte boxa in den snyggare?"*
MÄTT vad som störde: sammanfattningsmeningen låg på sektionens grå botten
(vänsterkant 0) medan varje event-rad låg i ett eget `bg-bg-muted px-3`-kort —
en andra vänsterlinje 12 px in, i SAMMA ton som botten bakom den. Tre
fragment, tre kanter, ingen av dem en yta. Status + event + knapp bor nu i ETT
vitt kort (`rounded-2xl border-transparent bg-surface p-3
contrast-more:border-border-strong`) med en gemensam vänsterlinje; event-kortens
egna grå ytor är rivna.

**Bank-anatomi i historiken (`cc124b96`).** Marcus jämförde listan med sin
banks transaktionslista och dömde formen *"barnsligt … inte klart"*.
Kort-per-rad ersattes av EN sammanhängande listyta med hårlinjer
(`divide-y divide-border rounded-xl border border-transparent bg-surface px-3`,
kopierad ordagrant ur `EventinnehallYta`/`PlatserYta`), betalsättet som
titelled, beloppet i egen högerställd `tabular-nums`-kolumn med datans eget
tecken, radrytm ≈ 60 px. **Detta river den kortform
`AMENDERING-2026-08-31-inbetalningsradernas-formsprak-346-14.md` och
`e727fdb7` beskriver** — hårlinje-listan är tillbaka, nu med sifferkolumn.

**Högerkolumnen centrerad (`1ccd46f4`).** Marcus: *"Priset och åtgärdsknappen
(de tre prickarna) borde sitta centrerade på raden, höjdmässigt."* Löst
strukturellt: panelerna (radera-bekräftelse, makulera-formulär) och felrutorna
flyttade UT ur textkolumnen till egna full-bredds-noder under kärnraden, så
centreringen omfattar radens INFORMATION och inte en transient panel.

**Inline scroll, omslaget rivet, eyebrow-rubrik (`b6f36ecd`).** Marcus: *"Det
funkar inte, ta bort den mörkare grå bakgrund på 'senaste inbetalningar'."*
Det `bg-bg-emphasized`-omslag pass 8 gav gruppen skapade TRE nivåer nesting;
korten ligger nu direkt på samma botten som statuskortet. Taket "Visar X av Y"
(`SENASTE_ANTAL = 5`) är rivet till förmån för `max-h-96 overflow-y-auto` —
ordagrant klassuppsättningen `hem/NyaAnmalningar.tsx` och
`hem/ForfallnaBetalningar.tsx` redan bär, inklusive `tabIndex={0}` +
`aria-label` (WCAG 2.1.1, axe `scrollable-region-focusable`). Rubriken blev
eyebrow (`font-medium text-caption uppercase tracking-wide`), fortfarande ett
`h3`.

> **Distinktionen mot Hem-domen är bokförd i koden så nästa läsare inte rättar
> tillbaka:** Marcus rev samma klass på Hem-blocket samma dag, och den
> rivningen står. Skillnaden är ROLLEN, inte formen — på Hem var eyebrown ENDA
> rubriken över en lista man skulle agera på; här sitter den som UNDER-etikett
> under sektionens riktiga `h2` "Betalningar".

**Menyavdelaren villkorad (`2f95d175`).** Marcus: *"Varför är det en
separatorlinje över 'radera'?"* Villkoret var bara "finns en destruktiv post",
vilket ritade en linje ovanför en ENSAM Radera-post — det vanligaste läget av
alla. För skärmläsaren var det dessutom ett annonserat gruppbyte som inte
hände.

**Glyfen bort (`2f95d175`).** Sedel-glyfen satt på VARJE normal rad i en lista
som per definition består av inbetalningar. `Undo2` (återbetalning) följde med,
mätt och inte antaget: `inbetalningsBelopp` skriver redan "1 000 kr
återbetalt". `Ban` + genomstrykning står kvar — de bär information ingen annan
del av raden bär i alla lägen.

**Noteringen syns på raden (`5bdd7f48`).** En notering registrerad på
inbetalningen renderas som sekundär rad i EXAKT samma klass som
makulerings-skälet (`w-full text-caption text-text-muted`). Kedjan är kod men
**inte deployad** — migration FÖRE EF-deploy är tvingande.

## 3. Terminologin

- **"Saknas" → "Kvar att betala"** i personkortets översikt och rader
  (`776250a8`).
- **"Inget öppet belopp enligt basen" → "Inget kvar att betala"**.
- **`Förfallen`-pillen** går genom `StatusBadge ton="warning"` med `ikon`
  (`7f2f11a7`).
- **"öppen/öppna betalning(ar)" → "kvarvarande"** i inkorgens strängar
  (`e14d3909`) — personkortets egna strängar bar inte den jargongen.

Kodidentifierare är orörda genomgående (`saknas`, `saknasTotalt`, basens
`Saknas (kr)`, `useOppnaBetalningar`, `OppenBetalning`), liksom "Öppna" som
VERB.

## Vad som INTE ändrats

- **B1, B2, B4, B5, B6, B7** — namnet, kontaktraderna, flaggans skrivyta,
  interaktionsströmmen, och blockordningen i sin helhet. Endast B3:s
  ytbehandling och Betalningar-sektionens inre form.
- **Sidramen** (`AMENDERING-2026-08-23-sidram-promovering.md`) — orörd.
- **Radera/makulera-radernas villkor**
  (`AMENDERING-2026-08-31-radera-makulera-raderna.md`) — `kanVisa`,
  `kanSkickaIgen`, `kanKoaOm`, `kanRadera`, `kanMakulera` är oförändrade. En
  makulerad inbetalning erbjuder aldrig "Skicka igen" (mätt invariant).

## Omstämplings-läge

**Inget är omstämplat, och inget stämpel-fält är rört.** `godkand` står kvar
med Marcus 2026-08-12-kvittens och SHA `4648823a`.

`bash scripts/check-facit.sh` → **exit 0**, före och efter.
