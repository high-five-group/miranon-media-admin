# Basdata citeras med record-ID och pseudonym — aldrig med namn `[UNIVERSAL]`

**Ett defekt-bevis behöver postens ID och en stabil pseudonym; det behöver
aldrig personen.** Pseudonymisera vid FÖRSTA citatet, inte när någon upptäcker
saken senare — annars är uppgiften redan publicerad, och en städning på `main`
tar inte bort den ur historiken.

## Vad som hände

Basdefekt-kartläggningen bevisade dubbletter och länkfel genom att citera de
verkliga records som var fel: *"NN bär två Person-records"* är beviset. Det
är **rätt metod i fel medium**. Metoden spred sig över tre månader till varje
yta som beskrev basen — sessionsdok, research, backfill-loggar, `data-model.md`,
backlog-kort, en kodkommentar och en enhetstest-fixtur.

När `T171` punkt 1 mätte omfattningen 2026-09-18 låg **100 verkliga personer
och 13 e-postadresser** i klartext på `main` i ett **publikt** repo, över 34
filer. Tråden själv hade uppskattat *"fem kända namn"* och märkt siffran som en
undre gräns — den verkliga siffran var 20× större. Ingen enskild författare
gjorde något uppenbart fel; varje citat var rimligt i sin stund.

## Varför det inte går att mönstermatcha sig ur

E-postadresser kan grindas med en regex och en allowlist. **Namn kan inte.** Ett
personnamn i fri text är oskiljbart från vilken annan versaliserad ordföljd som
helst, och repots egna testfixturer bär avsiktligt realistiska svenska namn —
så en namnvakt hade antingen larmat på fixturerna eller missat verkligheten.

Den gränsen är mätbar bara med kontext, inte med mönster: samma sträng `Elin`
var en verklig person i backfill-loggen (prod), en seed-fixtur i ett sessionsdok
(staging) och ett generiskt bokstavsexempel i ett research-dok — tre olika rätta
svar för en och samma sökträff.

Därför bärs regeln av disciplin vid skrivtillfället, inte av en grind.

## Formen som fungerar

- **Person → `Deltagare NN`**, samma nummer för samma person i HELA repot. Det
  är stabiliteten som gör att ett dubblett-bevis fortfarande går att följa mellan
  två dokument efter pseudonymiseringen.
- **Uppenbart fiktiv form, inte ett påhittat riktigt namn.** Ett fiktivt svenskt
  namn hade blandats ihop med repots ~40 befintliga fixturnamn, och nästa läsare
  hade inte kunnat se vilket som var vad.
- **E-post → `X***@domän`.** Bär två adresser samma begynnelsebokstav får de
  skilda masker — annars går ett stavfelspar (`fornander33`/`formander33`, som
  ÄR dubblett-beviset) inte längre att skilja åt.
- **Kvar står:** record-ID:n, anmälnings-ID:n, belopp, datum utan namn. De bär
  hela bevisvärdet.

## Vad en städning på `main` inte löser

Uppgifterna finns kvar i varje commit som införde dem. En history-rewrite är ett
eget, irreversibelt beslut — den städning som gjorts skyddar alltså framtida
läsare av arbetsträdet, inte historiken. Det är ännu ett skäl att pseudonymisera
vid första citatet: det är den enda tidpunkt då åtgärden är fullständig.

Belägg: `tasks/threads/T171-personuppgifter-i-publikt-repo.md`;
`CLAUDE.md` § Instruktioner — Alltid gäller.
