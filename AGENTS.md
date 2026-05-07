# AGENTS.md - Miranon Media Odoo testspår

## Projektkontext

Detta repo innehåller ett pågående custom webapp-projekt för Miranon Media. Odoo-spåret är ett separat experiment och får inte störa huvudprojektet.

Odoo-appen **Evenemang** är primärt fokus för detta testspår. Appar observerade i användarens Odoo-startskärm är: Diskutera, Försäljning, Anslagstavlor, Fakturering, Hemsida, Evenemang, Appar och Inställningar. Detta ska verifieras mot faktisk Odoo-instans/UI innan tekniska slutsatser dras.

## Kritisk Git-Regel

- Odoo-arbete ska ske på separat branch.
- Standardbranch för Odoo-testspåret är `odoo-autonomous-test-plan`.
- Gör inte Odoo-relaterade ändringar direkt på `main`, `master`, `develop` eller annan huvudbranch.
- Rör inte orelaterade uncommitted changes.
- Stagea och committa endast Odoo-relaterade filer.

## Regler För Odoo-Relaterade Uppdrag

- Ändra inte befintlig applikationskod om uppdraget inte uttryckligen ber om det.
- Lägg Odoo-relaterade filer i `odoo-migration-test-plan/`, `odoo-migration-workbench/` eller annan tydligt Odoo-namngiven katalog.
- Gör inga externa skrivningar till Odoo, Airtable, Shopify eller andra system om det inte är säkert verifierat att målmiljön är en testmiljö.
- Gör inga riktiga betalningar.
- Skapa inga riktiga fakturor i produktion.
- Skicka inga riktiga kundmail.
- Behandla persondata försiktigt.
- Exponera aldrig secrets.
- Gissa aldrig fältnamn, tabellnamn, relationer, modeller, workflows eller affärsregler.
- Verifiera alltid mot faktisk data.
- Markera alltid skillnad mellan observerade fakta, rimliga antaganden, hypoteser, öppna frågor och blockerare.
- Prioritera testbarhet, reversibilitet och liten första scope.
- Odoo Online ska betraktas som första testnivå.
- Odoo-appen Evenemang ska studeras extra djupt före Odoo-mapping, importmallar eller POC.
- Hemsida, Försäljning och Fakturering ska studeras som direkt angränsande appar till eventflödet.
- Diskutera, Anslagstavlor, Appar och Inställningar ska studeras som sekundära stödappar.
- Odoo.sh/custom modules ska endast föreslås när standard-Odoo, Studio eller import inte räcker.
- Custom webappen är ett aktivt parallellt huvudspår och får inte skadas.

## Kvalitetskrav

- Skriv på svenska.
- Var konkret.
- Skapa praktiska checklistor och beslutspunkter.
- Skydda huvudspåret.
- Skapa tydliga artefakter.
- Dokumentera vad som faktiskt gjordes, vad som inte gick, och varför.
- Märk all overifierad information tydligt.
- Gör aldrig produktionspåverkande åtgärder utan verifierad testmiljö.
