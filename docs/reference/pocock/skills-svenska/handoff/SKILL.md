---
name: handoff
description: Komprimera den aktuella konversationen till ett överlämningsdokument som en annan agent kan fortsätta från.
argument-hint: "Vad ska nästa session användas till?"
disable-model-invocation: true
---

Skriv ett överlämningsdokument som sammanfattar den aktuella konversationen så att en ny agent kan fortsätta arbetet. Spara dokumentet i användarens operativsystems tillfälliga katalog — inte i den aktuella arbetsytan.

Lägg till ett avsnitt med ”föreslagna skills” som rekommenderar vilka skills nästa agent bör anropa.

Duplicera inte innehåll som redan finns i andra artefakter (PRD:er, planer, ADR:er, issues, commitar eller diffar). Hänvisa i stället till dem med sökväg eller URL.

Maskera känslig information, exempelvis API-nycklar, lösenord eller personuppgifter.

Om användaren har skickat argument ska de tolkas som en beskrivning av vad nästa session fokuserar på; anpassa dokumentet efter det.
