---
id: TASK-143
title: 'Utöka Användarinbjudan med namn och inbjudare — invite-user-EF:ens kontrakt'
status: To Do
assignee: []
created_date: '2026-08-05 12:42'
updated_date: '2026-08-05 12:42'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 228000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-08-05 (S96): 'Vi ska DEFINITIVT ha namn där vid inbjudan!'

BAKGRUND. TASK-127.6 byggde accept-sidan (/valkommen) mot det låsta designfacitet, men kunde inte återskapa facitets personliga hälsning. Orsaken är ett kontraktsglapp, inte ett byggfel: invite-user-EF:en (TASK-127.5, ADR-092) tar emot {email, role} och bär varken mottagarens namn eller vem som bjöd in. Att härleda ett namn ur e-postadressen är dessutom redan uttryckligen förbjudet i src/lib/auth/AuthProvider.tsx.

Bygg-agenten flaggade glappet öppet i stället för att fejka copyn — korrekt, eftersom EF-kontraktet ligger utanför en accept-sidas mandat.

OMFATTNING (att specificera vid plockning, inte låst här):
- invite-user-EF:ens indata utökas med mottagarnamn och inbjudarens identitet. Inbjudaren bör härledas SERVER-SIDE ur den verifierade JWT:n, inte tas som klient-indata — samma spoof-säkra mönster som create-event-note redan använder för författar-attribution (se supabase/config.toml § functions.create-event-note).
- Var namnet lagras: user_metadata vid inbjudan, eller egen kolumn. Påverkar 06b-datamodellens tenant_memberships-väg (ADR-092 bokför den migrationen som utanför sitt eget beslut).
- Accept-sidans copy (/valkommen) återställs till facitets personliga form.
- Invite-mallen supabase/templates/invite.html kan bära namnet — mallen är redan brandad och versionerad, men skrevs utan namn-variabel.
- Vem som bjuder in visas för mottagaren: ökar tilliten till mailet, vilket är en del av varför facit hade den.

BELÄGG: TASK-127.6:s Implementation Notes (öppen fråga 2) · TASK-127.5-kortet (EF:ens kontrakt) · ADR-092 (invite-/identitetsmodellen) · facit-bilagorna tasks/sessions/bilagor/s96-auth-prototyp-facit/.

BEROENDE: TASK-127.5 (Done) äger EF:en som ska ändras. Ingen hård blockering mot pågående skivor, men bör tas FÖRE QA-kortet TASK-127.10 — annars granskar Marcus en inbjudan som medvetet saknar det han bett om.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 invite-user-EF:en tar emot mottagarens namn och härleder inbjudarens identitet server-side ur verifierad JWT — aldrig som klient-indata
- [ ] #2 Accept-sidan (/valkommen) visar den personliga hälsningen enligt designfacitet
- [ ] #3 Invite-mailet namnger både mottagaren och vem som bjuder in
- [ ] #4 Enumeration-neutraliteten och ADMIN_EMAILS-grinden är oförändrade — utökningen får inte öppna en ny yta
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
