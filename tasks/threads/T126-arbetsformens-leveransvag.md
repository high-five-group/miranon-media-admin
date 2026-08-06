---
owner: marcus803
updated: 2026-08-06
review_by: 2026-11-06
status: stable
lifecycle: active
---

# T126 — Arbetsformens regler når inte den som kom in genom en annan dörr

> **Registrerad** 2026-08-06 (S93, iterationsvåg 4) på Marcus order:
> *"Det här med att iterations-kadensen inte bet/funka, ska inte vara en
> lesson. Det ska bli en tråd. Rotorsak ska hittas och lösningen ska
> mekaniseras eller fixas så det aldrig blir en fråga igen."*

## Vad som hände, mätt

Marcus, 2026-08-06: *"Varför pushar du varje iterationsrunda? Det är väl inte
standardprocedur? […] Jag har påtalat det här förut men de åtgärder vi införde
då verkar ju inte bita alls."*

Under iterationsvåg 3 pushades och armerades en PR per iterationsvarv, i stället
för lokal commit per varv och EN push när Marcus är nöjd. Det är andra gången
samma sak påtalas.

## Åtgärden fanns — och lästes aldrig

Efter förra instansen (`T116`, S96, `TASK-127.2`) skrevs regeln in i
`prototype`-skillens § 5 *Iterations-kadensen*, verbatim:

> commit/push/CI ger noll under iterationen. **Per varv: lokal commit, ingen
> push** (checkpoint + ångerknapp, ~1 s). **Push + PR EN gång**, när Marcus
> säger klart

Texten bär till och med mätningen som motiverade den — `#664` 15 min i kön,
`#666` 20 min, 10–30 min per varv för sekunders arbete — plus Marcus citat
*"Vad är det som tar sådan tid???? Så här kan vi inte hålla på vid
iteration!!!"*.

**Regeln var alltså korrekt, färsk, mätunderbyggd och specifik. Den lästes
aldrig.**

## Rotorsaks-HYPOTES (ej bekräftad — se Nästa steg)

Sessionen kom in i arbetet via `session-resume` → HANDOFF-block → Marcus
punktlista. Ingen av de vägarna laddar `prototype`-skillen. Utföraren byggde i
rätt scope, mot rätt fil, med rätt kvalitetsribba — och fel kadens, utan att
någon gång passera texten som definierar kadensen.

Den generella formen, om hypotesen håller: **vi placerar arbetsformens regler i
den skill som STARTAR arbetsformen, men arbete återupptas oftare än det
startas.** Resume, handoff, "fortsätt där vi var", en ny punktlista i en
pågående tråd — varje sådan väg in hoppar över startdörren och därmed över
reglerna. Ju längre ett arbete lever, desto större andel av dess varv körs av
någon som aldrig såg dem.

**Detta är en hypotes formulerad av samma aktör som begick felet.** Den ska
prövas mot faktiskt tillstånd innan något byggs — se Nästa steg 1.

## Varför detta INTE är en lesson

Marcus beslut, och det är rätt klassning: en lesson dokumenterar ett mönster för
den som råkar läsa den. Men läsning är exakt det som fallerade — en lesson om
att regler inte nås är självmotsägande som åtgärd. `T119` har redan visat att
regler i prosa bryts av färska kontexter; att lägga till ännu en prosa-post är
att upprepa det den posten beskriver.

Kravet är därför **mekanisering eller strukturell fix**, inte dokumentation.

## Åtgärdsriktningar (EJ beslutade, EJ designade)

- **(a) Spärr vid handlingen.** `PreToolUse`-hook som nekar `git push` när
  villkoren för ett pågående iterationsvarv är uppfyllda. Denna instans har
  ovanligt tydliga signaler att haka på: filer märkta `[PROTOTYPE]`, commits med
  prototyp-prefix på grenen, och en körande dev-server. Klass: `T119`-lagret (1),
  icke-kringgåbar exekveringspunkt som prövar FORM billigt.
- **(b) Leveransväg via handoffen.** Paus-/resume-blocket bär en explicit
  ARBETSFORM-rad som resume läser upp. Billigare än (a), men fortfarande prosa —
  den flyttar bara leveransen, mekaniserar den inte.
- **(c) Skill-laddning som del av resume.** Resume identifierar pågående
  arbetsform ur handoffen och laddar motsvarande skill. Löser klassen bredare än
  (a), men kräver att arbetsformen är maskinläsbart deklarerad någonstans.
- **(d) Flytta regeln till en alltid-laddad yta** (spoke-`CLAUDE.md` eller output
  style). Enklast, men den ytan har en budget — allt kan inte bo där, och varje
  tillägg gör resten mindre läst.

Ingen av dem är vald. Riktningarna är dessutom inte ömsesidigt uteslutande:
(a)+(b) är en trolig kombination om `T119`s tre-lagers-doktrin följs.

## Nästa steg

1. **Pröva hypotesen mot faktiskt tillstånd.** Laddas `prototype` verkligen
   aldrig av `session-resume`? Finns andra vägar in i samma arbetsform, och
   missar de samma regel? Detta är ett läsande pass mot skill-filerna och
   resume-kedjan — det ska INTE göras av den som skrev hypotesen ovan utan
   verifiering mot disk.
2. **Inventera hur många andra arbetsform-regler som bor på samma sätt.** Om
   `prototype` § 5 är ensam är detta en punktfix; är den en av tio är det ett
   program. Frågan avgör vilken åtgärdsriktning som är rimlig.
3. **Välj mekanism** (Marcus) och bygg den.
4. **Bevisa tvåsidigt** — och kom ihåg `CLAUDE.md` § *En ny hook kan ALDRIG
   skarpbevisas i sessionen som byggde den*, om (a) väljs.

## Öppen skuld i samma familj, ej åtgärdad

En parkerad PR måste sättas till draft för att inte larma som armerings-kandidat
var 90:e sekund. Den regeln lever nu i exakt samma form som den denna tråd
handlar om: prosa, i ett lessons-fragment
(`tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md`), utan
mekanism. Den bör tas med när formen väljs.

## Besläktad

`T119` (mekaniserings-programmet — regler i prosa bryts av färska kontexter;
denna tråd är en instans med en identifierad leveransväg-orsak) ·
`T116`/`TASK-127.2` (förra instansen av samma kadens-fel, vars åtgärd är den som
inte bet) · `T110` (orkestrerarens felklasser) · `ADR-090` (samma klass: regel
utan leveransväg till utföraren, senare mekaniserad som hook).
