---
owner: marcus803
updated: 2026-07-09
review_by: 2026-10-09
status: stable
---

# Interna identiteter i Airtable-basen — vem är kund, vem är test?

> Syfte: kanonisk roll-lista över de e-postadresser i prod-basen
> (`app8uGPrVCVOm6LfD`) som tillhör Marcus, Roger eller Lotta. Läs den före varje
> utskick, segment-export, närvaro-bulk eller datakvalitets-räkning.
>
> **Den viktigaste raden i hela filen:** två av Marcus adresser har **dubbelroll** —
> de är både testadresser och riktiga, betalande deltagares adresser. En
> adress-match är därför **aldrig** en testdata-klassificering. Se
> [`data-model.md`](data-model.md) fälla 44.

## Rollmatris

| E-post | Person-record | Riktig deltagare? | Testbruk? |
|---|---|---|---|
| `highfive.epost@gmail.com` | `rec8sFNULpjfe0Lw9` "Marcus Johansson" | **JA** — betalande Psionautics-deltagare (Event-17) | Ja, ibland |
| `inbox@marcusemails.com` | `reczBItiZhCLlE2Cs` "Marcus Johansson" | **JA** — Fjärrskådning, RIM 1, RIM 2 (Event-36/42/50) | Ja, ibland |
| `marcus@h5gruppen.se` | `recIynU41be2DcYup` "Marcus (test) Johansson" | Nej — 0 anmälningar | Ja. ⚠️ Se dubbelroll nedan |
| `test-kalla-delete@example.com` | `rec3iFLEHuRHl1QZH` "Test Källa" | Nej | Ren testrad |
| `roger@gral.se` | Roger | Verksamhetens egen | Nej |
| `lotta@outsidereality.se` | Lotta | Verksamhetens egen | Nej |

**Marcus har två legitima deltagar-identiteter** (`highfive@` → Psionautics; `inbox@`
→ FS/RIM 1/RIM 2) och får därför två Skool-inbjudningar med olika material. Det är
avsiktligt: Airtable matchar personer på e-postadress, så en sammanslagning vore
kosmetisk och skulle återuppstå vid nästa anmälan från den andra adressen. Basen
speglar hur anmälningarna faktiskt gjordes.

⚠️ **`marcus@h5gruppen.se` har en ANNAN dubbelroll:** den är Airtable-testpersona
*och* Marcus riktiga admin-mejl i `ADMIN_EMAILS`. Radera aldrig adressen ur auth-
eller admin-konfiguration i tron att den är testdata — det är bara *Person-recorden*
i Airtable som är en testpersona.

## Hur man faktiskt skiljer skräp från verklighet

**Rätt diskriminant: orphan-egenskapen, inte adressen.** En Deltagande-rad är skräp
om den saknar `Anmälan`-länk (fälla 41). Den är verklig om den hänger på en
Bekräftad, anmälan-länkad rad — oavsett vems adress det är.

Konkret för `rec8sFNULpjfe0Lw9` (`highfive.epost@gmail.com`), som efter
konsolideringen 2026-07-09 bär **båda** sorterna på samma post:

| Deltaganden | Anmälan-länk | Vad det är |
|---|---|---|
| `rec5dXdn1wRt1n28E`, `recYykKvJFZAZqtyh` (`Närvarande`) | **JA** — Bekräftad, via `Anmälan-Psionautics.se` | **Marcus riktiga deltagande** |
| `recYBNTKwqEUviXqL`, `recJVMnc1xJ9yqQsO` (`Ej avstämt`) | **ORPHAN** | Skräp (del av de 44) → T16 |

Samma person, samma post, två sorters rader. Det är därför `Närvaro (text)` visar
`2/4 (50 %)` — orphan-raderna drar ner den tills T16 raderar dem. **Adressen kan inte
avgöra saken; anmälan-länken kan.**

**Facit vid varje tveksamhet: Lottas anmälnings-CSV**
(`~/Downloads/alla-anmalda-medveten-kontakt-<datum>.csv`). Den bär `Status`,
`Betalning` och `Källa` per anmälan. Ingen skrivning mot närvarodata får ske på en
testdata-klassificering som inte först stämts av mot den.

## Hur vi bör hantera dubbelroll-adresser framåt

Det öppna problemet: när Marcus testar med en adress som också är hans riktiga
deltagar-adress, matchar A2 på e-post och länkar testanmälan till hans **riktiga**
Person → testartefakter blandas in i hans verkliga kurshistorik. Det är så de 2
orphan-Deltagandena på `rec8sFNULpjfe0Lw9` uppstod.

**Rekommendation (ej beslutad — se sessionsdok S60 Del 4):** använd
plus-adressering för allt testbruk, t.ex. `inbox+test@marcusemails.com`. Airtable
behandlar den som en distinkt sträng → egen Person-record, medan mailen fortfarande
når Marcus inkorg. Då blir de riktiga deltagar-identiteterna orörda, och
testidentiteterna blir mekaniskt separerbara (`FIND('+test', {E-post})`) i stället
för att kräva en handunderhållen lista som denna.

Tills dess: denna fil är sanningen om vem som är vem, och den ersätter
**inte** kontrollen mot CSV:n.

## Så här kontrollerar du en identitet korrekt

Identiteten kan bo på **anmälan**, inte på Personen. En Person skapad av A2 Gren 4
från en e-postlös anmälan bär varken namn eller adress (fälla 42) — en kontroll som
bara läser `Personer.E-post` **missar den** (falskt negativt, [[L256]]).

1. Slå adressen mot `Personer.E-post` (`fldcd5HnYooVZY4Ts`).
2. Slå adressen mot `Anmälningar.E-post` (`fldVY310IdOIbTkE8`) och följ
   `Anmälningar.Person` (`fldQekqRlLfup8x5K`) tillbaka.
3. **Innan någon skrivning:** stäm av mot Lottas CSV. Adress-match ensam är inget
   bevis åt något håll — varken för att något är test (fälla 44, falskt positivt)
   eller för att det inte är det (fälla 42, falskt negativt).

## Relaterat

- [`data-model.md`](data-model.md) §Kända fällor — fälla 41 (orphan-Deltaganden),
  42 (e-postlös anmälan → omatchbar Person), **44 (dubbelroll / adress-match)**.
- [`../backfill/execute-log.md`](../backfill/execute-log.md) — Event-17-korrektionen
  (156 + 64 = 220) och den återställda felreverteringen.
- Tråd **T16** (bas-maximering,
  [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)) — de
  äkta testartefakterna och de 44 orphan-Deltagandena raderas destruktivt där.
