# ADR-046: Felmeddelande-wiring via aria-describedby — explicit aria-errormessage rivs

- Status: Accepted
- Datum: 2026-06-11
- Fas: 3.5

## Kontext

ARIA-UPGRADE §1 (Formularfalt) krävde explicit `aria-errormessage`-wiring på
fält med validering, med rationale att describedby och errormessage inte är
utbytbara. Fas 3-primitiverna Input/Select implementerade kravet ovanpå
react-aria-components inbyggda FieldError-mekanism. Session 14 K2 flaggade
risken för dubbel-annonsering; Session 15 K4a-forensiken + Marcus
skärmläsarpass gav beslutsunderlaget:

1. **DOM-forensik (K4a, 2026-06-11):** På Input pekar `aria-describedby`
   (React Arias automatik) och `aria-errormessage` (vår explicita wiring) på
   SAMMA element — samma feltext refereras två vägar. På Select når vår
   `aria-errormessage` aldrig DOM (attributet droppas av trigger-buttonens
   context-merge) och `aria-invalid` saknas på triggern — wiringen är död
   kod och JSDoc-löftet osant mot renderad DOM.
2. **Förstapartskälla:** React Aria associerar fel via
   `aria-describedby`/FieldError och har medvetet valt bort errormessage pga
   skärmläsarstöd (öppet byte-önskemål: adobe/react-spectrum#7425, utan
   åtagande).
3. **AT-stöd (a11ysupport.io, test uppdaterat 2025-12-24):** 18/22 — JAWS,
   NVDA (Chrome/Firefox), Orca, TalkBack, VoiceOver-iOS stödjer
   errormessage; VoiceOver-macOS, NVDA-Edge och Narrator saknar stöd.
4. **Marcus skärmläsarpass (VoiceOver/Safari, 2026-06-11):** upplevd
   dubbel-uppläsning av feltext på både Input och Select.

## Beslut

Projektets explicita `aria-errormessage`-wiring i Input.tsx och Select.tsx
tas bort, inklusive den `useId`-baserade errorId-mekanik som blir oanvänd.
React Arias FieldError/`aria-describedby`-mekanism är den enda
felmeddelande-associationen. JSDoc saneras så den beskriver faktisk
renderad DOM. ARIA-UPGRADE §1-kravet rivs öppet med erratum-not och pekare
hit (kvittens-rivning per konstitutionens web-research-disciplin — inte
tyst rivning).

## Alternativ som övervägdes

**Alt B — Behåll dubbel-wiring på Input och laga Select.** Avvisat:
Select-lagningen kräver `aria-invalid` på en listbox-trigger som React Aria
medvetet inte sätter (off-spec-terräng), och dubbel-uppläsningsrisken på
Input kvarstår i AT som stödjer båda attributen — Marcus-passet hörde den
i VoiceOver/Safari.

**Alt C — Endast aria-errormessage (ta bort describedby).** Avvisat: mot
förstapartskällans default och sämst AT-täckning (VoiceOver-macOS, NVDA-Edge
och Narrator läser då inget fel alls).

## Konsekvenser

- Input/Select bär `aria-describedby` → FieldError-elementet; feltexten
  refereras EN väg. Ingen visuell eller övrig beteendeändring.
- ARIA-UPGRADE §1 (Formularfalt) bär erratum-not; ursprungstexten bevaras
  (immutabilitets-mönstret från decisions-README § Korrigering).
- ARIA-UPGRADE §2/EAA-raderna om programmatiskt fastställbara fel uppfylls
  via describedby-vägen + React Arias fält-state; Fas 7-auditens
  E5-checkrad läses genom denna ADR.
- **Omprövningsvillkor:** när AT-stödet för `aria-errormessage` är komplett
  i de stora kombinationerna (a11ysupport-matrisen) och/eller React Aria
  själv byter mekanism (#7425) — då omprövas wiringen uppströms i
  primitiverna, inte per vy.
