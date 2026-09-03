// [PROTOTYPE] `Intresserade as IntresseradeKonvergens` är en alias-export —
// bär den TIDIGARE, godkända prototypnamnet `IntresseradeKonvergens` (S114
// K1–K3, git-mv:ad till `./Intresserade` i TASK-374.2). Existerar ENBART för
// scripts/check-facit.sh invariant (c): grinden söker den registrerade
// markören `IntresseradeKonvergens` GLOBALT i `src/` så länge minst ett
// facit-manifest är ogodkänt (idag: s108-dokumentytan, s108-generering) —
// se .facit-policy.conf § FACIT_PROTO_MARKORER. Riven i TASK-374.4
// tillsammans med markörens avregistrering ur samma fil (samma ögonblick,
// ADR-102 § "REGEL: NÄR en markör registreras" steg 4).
export { Intresserade, Intresserade as IntresseradeKonvergens } from './Intresserade';
