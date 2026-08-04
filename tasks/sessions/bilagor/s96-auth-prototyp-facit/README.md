# Auth-prototypens FACIT — login + inbjudan (S96, 2026-08-03)

> **Frågan prototyp-passet besvarade (throwaway-kontraktet klausul i,
> verbatim ur `TASK-127.2`):**
>
> **"Hur ska login-vyn och inbjudnings-sidan se ut?"** — de två skärmar som
> ÄR Roger och Lottas förstaintryck av appen.
>
> **Svar: variant B, konvergerad genom sjutton omgångar.** Varianterna A
> och C är förkastade och RADERADE ur koden. Bilderna i denna katalog är
> det låsta facit `TASK-127.3` (login) och `TASK-127.6` (inbjudan) bygger
> mot.

## Bilderna

| Fil | Vy | Vyport |
|---|---|---|
| `login-desktop.png` | Logga in | 1440×900 @2x |
| `login-mobil.png` | Logga in | 390×844 @2x |
| `inbjudan-desktop.png` | Inbjudan / aktivering | 1440×900 @2x |
| `inbjudan-mobil.png` | Inbjudan / aktivering | 390×844 @2x |

Dev-överlägg (prototyp-railen, TanStack-devtools) är dolda i bilderna —
de är inte del av facit.

## Den byggda formen

Båda skärmarna delar skal:

- **En spalt**, innehållet `max-w-xl` centrerat. Tvåspalts-hållningen från
  divergensen är riven.
- **Varm toning kant i kant** (`--mm-primary-tint` → `--mm-accent-tint`,
  `to bottom right`), satt på `<html>` — se § Rännstenen nedan.
- **Formuläret i ett vitt kort**, `rounded-2xl` (appens kort-standard, samma
  som `DashboardCard` och 38 andra ytor), `border-border-light`,
  `bg-surface`, `shadow-sm`, `p-6 sm:p-8`.
- **Fokusring även vid musklick** inuti formuläret — se § Öppet nedan.

Skillnaderna mellan skärmarna är avsiktliga:

| | login | inbjudan |
|---|---|---|
| hälsning | **inuti** kortet | ovanför kortet |
| roll-rad | — | ja |
| fotnot om länkens giltighet | — | ja, under kortet |
| rubriknivåer | H1 | H1 + H2 |

Login har inget att säga utanför kortet; inbjudan bär kontext mottagaren
saknar. En ensam textrad ovanför ett kort läser som en förlorad rubrik.

## Vad som revs på vägen, och varför

Bevarat som provenance — flera av dessa är sådant en läsare annars
återuppfinner:

1. **Fotot på Roger och Lotta** (omgång 5). Marcus: *"för att testa hur det
   blir och för att rensa bort lite saker"*. Bilden ligger kvar i `public/`.
2. **Punktlistan "vad händer nu"** (omgång 7, research-grundat). Vägde 25 av
   sidans 95 ord — den enskilt tyngsta posten — och ingen av sex live-mätta
   branschsidor har en sådan lista.
3. **Bekräfta-lösenord-fältet** (omgång 7). NN/g avråder uttryckligen;
   GitLabs skarpa invite-accept-kod använder ett enda fält. Ersatt med
   visa/dölj.
4. **Den delade rubriklinjen** (omgång 8). Löste ett problem som försvann
   när tvåspalten revs.
5. **Logotypen, i tre former** (omgångarna 9–14): favicon + textrader, fri
   logotyp mot fonden, logotyp i pill (vit respektive i toningens familj via
   S92:s steg 3/6). Marcus: *"det är inte viktigt just nu"*.
   `public/miranon-media-ordmarke.svg` ligger kvar oanvänd.

**Textmängden gick från 95 ord till 47.** Branschsnittet i research-passet
är ~17; Notion, den pratigaste av sex mätta, ligger på 35.

## Rännstenen — läs denna innan du bygger skarpt

Appen reserverar en symmetrisk scrollbar-ränna (`scrollbar-gutter: stable
both-edges`, `src/styles/base.css`) på ≥640 px. **Chromium målar aldrig
`background-image` i den ytan** — belagt spec-gap, `w3c/csswg-drafts#8099`,
oberoende bekräftat i `twbs/bootstrap#40659`.

Ett research-pass mätte tretton kandidater, inklusive två vars element
bevisligen täckte hela viewporten (`getBoundingClientRect` = `{x:0,
width:1600}`) och ändå fick tomma kanter. Det är ett måla-lager-klipp, inte
ett layout-problem. **Ingen CSS- eller JS-teknik löser det.**

Den byggda lösningen är ett **kamouflage-lager**: en platt
`background-color` under gradienten på `<html>`, satt till gradientens
exakta sRGB-mittpunkt. `background-color` målas korrekt i gutter-ytan — men
bara i canvas-bakgrundslagret. Avvikelse mot kanterna: 7/255 = 2,7 % i en
enda kanal.

**Rännstensregeln rörs ALDRIG.** Ett tidigare försök stängde av den för
auth-vyerna och införde därmed ett hopp vid övergången auth → app. Marcus
direktiv, absolut och utan undantagsklasser: *"INGET får hoppa i denna app
under några omständigheter."*

Fullt underlag:
[`docs/research/full-bredds-fond-scrollbar-gutter-2026-08-03.md`](../../../docs/research/full-bredds-fond-scrollbar-gutter-2026-08-03.md)

## Öppet vid låsningen

- **Fokusring vid musklick** i autentiseringsformulär är byggd som
  `.mm-auth-formular input[data-rac]:focus` i `base.css`, men **prövas** —
  ett research-pass löper på om undantaget alls är rätt. Faller det ska
  regeln rivas, inte ärvas in i skarp kod.
- **Prototypen använder primitiva färgtokens direkt** (`--p-gold-3` m.fl. i
  den rivna pillen). Skarp kod behöver semantiska tokens.
- **Fokusringens färg** rapporterades felaktigt av mig som fel — Marcus
  verifierade i riktig webbläsare att den är korrekt blå. Headless och
  Chrome rapporterar `outlineColor` olika; lita på riktig browser.

## Källor

- Prototypkod: `src/components/dev/prototyp-auth/VariantB.tsx`,
  route `src/routes/dev/auth-prototyp.tsx` — `[PROTOTYPE]`-SHA i
  sessionsdok S96.
- Research: `docs/research/aktiveringssida-branschmonster-2026-08-03.md`
  (branschmönster, sex live-mätta sidor + GitLab + NN/g + GOV.UK) ·
  `docs/research/full-bredds-fond-scrollbar-gutter-2026-08-03.md`
  (rännstenen).
- Throwaway-kontraktet klausul iv: prototypkoden befordras ALDRIG. Skarp
  implementation skrivs NY i `TASK-127.3` / `TASK-127.6` genom
  leverans-grindarna.
