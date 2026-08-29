# Kör repots pinnade CLI via `npx`, aldrig den globala installationen

**[UNIVERSAL] Ett globalt installerat CLI kan vara en annan version än repots
pinnade — och skillnaden syns som ett obegripligt fel, inte som ett
versionsmeddelande.** Mätt 2026-08-29 (S113): global `supabase` 2.75.0 föll på
`functions deploy generate-event-attachment` med *"failed to read file: open
/* Kvitto-mallens EGNA CSS …"* — CLI:t läste TS-strängmodulen `kvitto.css.ts`
som en sökväg. `npx supabase` (repo-pinnad 2.116.0) deployade utan anmärkning.
Fem andra EF:er utan `static_files` gick igenom på den gamla versionen, så
felet var osynligt tills den sjätte. Regel: alltid `npx <cli>` i repot;
verktygsversionen är en del av reproducerbarheten, inte miljöbrus.
