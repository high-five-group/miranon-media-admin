---
owner: marcus803
updated: 2026-07-09
review_by: 2026-10-09
status: stable
---

# Testkonton och interna identiteter i Airtable-basen

> Syfte: kanonisk lista över de e-postadresser och Person-records i prod-basen
> (`app8uGPrVCVOm6LfD`) som **inte är kunder**. Läs den innan varje utskick,
> segment-export, närvaro-bulk eller datakvalitets-räkning. Räkna aldrig
> testidentiteter ur ett enskilt symptom-pass — det ger systematisk
> underskattning (se §Varför denna fil finns).

## Marcus testkonton — får ALDRIG få utskick eller Skool-access

| E-post | Person-record | Anteckning |
|---|---|---|
| `marcus@h5gruppen.se` | `recIynU41be2DcYup` "Marcus (test) Johansson" | ⚠️ **Dubbelroll** — se nedan. |
| `highfive.epost@gmail.com` | `rec8sFNULpjfe0Lw9` "Marcus Johansson" | Har en **namnlös dubblett-Person** `rectU34rbPfo6VD10` vars *anmälan* (`recbW1xZBot0MXumQ`) bär adressen. Fälla 42. |
| `inbox@marcusemails.com` | `reczBItiZhCLlE2Cs` | Låg i tre material-listor vid segment-exporten 2026-07-09. |
| `test-kalla-delete@example.com` | `rec3iFLEHuRHl1QZH` "Test Källa" | Ren testrad. |

⚠️ **`marcus@h5gruppen.se` har dubbelroll.** Den är BÅDE en Airtable-testpersona
OCH Marcus riktiga admin-mejl i `ADMIN_EMAILS` (se
`tasks/sessions/archive/2026-05/2026-05-04-security-hardening.md`). Radera aldrig
adressen ur auth-/admin-konfiguration i tron att den är testdata — det är bara
*Person-recorden* i Airtable som är en testpersona.

## Roger & Lotta — verksamhetens egna adresser

Kunder är de inte, men de kan förekomma som deltagare. Behandla dem inte som
testdata; exkludera dem medvetet, aldrig av misstag.

| E-post | Person |
|---|---|
| `roger@gral.se` | Roger |
| `lotta@outsidereality.se` | Lotta |

## Så här kontrollerar du korrekt

Identiteten kan bo på **anmälan**, inte på Personen. En Person skapad av A2 Gren 4
från en e-postlös anmälan bär varken namn eller adress (fälla 42) — en kontroll som
bara läser `Personer.E-post` **missar den**.

Kontrollera därför i två steg:

1. Slå adressen mot `Personer.E-post` (`fldcd5HnYooVZY4Ts`).
2. Slå adressen mot `Anmälningar.E-post` (`fldVY310IdOIbTkE8`) och följ
   `Anmälningar.Person` (`fldQekqRlLfup8x5K`) till Person-recorden.

Steg 2 är det som fångar dubblett-Personerna. Vid segment-exporten 2026-07-09 gav
steg 1 ensamt svaret "inga testpersoner" — ett **falskt negativt**; steg 2 fann två.

## Varför denna fil finns

`data-model.md` fälla 41 skrev "3 testpersoner" utifrån vilka som hade
**orphan-Deltaganden**. Det var ett symptom-urval, inte en identitets-lista: en
testidentitet med korrekt anmälan-länk syns inte i ett orphan-pass. Två sådana låg
kvar i segment-exportens material-listor 2026-07-09 och hade fått Skool-access.

Regeln som följer: testidentiteter räknas **ur denna fil**, aldrig ur det symptom
man just råkar leta efter. Lägg till nya adresser här när de skapas — inte i
efterhand när de dyker upp i ett utskick.

## Relaterat

- [`data-model.md`](data-model.md) §Kända fällor — fälla 41 (orphan-Deltaganden),
  fälla 42 (e-postlös anmälan → omatchbar Person).
- [`../backfill/execute-log.md`](../backfill/execute-log.md) — Event-17-korrektionen.
- Tråd **T16** (bas-maximering, [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md))
  — testpersonernas records ska raderas destruktivt där, inte här.
