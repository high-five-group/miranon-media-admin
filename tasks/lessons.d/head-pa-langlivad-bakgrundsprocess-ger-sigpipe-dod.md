# `| head` på en långlivad bakgrundsprocess dödar processen med SIGPIPE — inte bara utskriften

**Att pipa en långlivad process (dev-server, watcher, tail) genom `head`
stänger läsänden efter N rader — nästa write i processen får SIGPIPE och dör.
Det som skulle vara en utskriftsbegränsning blir ett processmord, mitt i
någon annans användning.** `[UNIVERSAL]`

Mätt 2026-08-13 (S103, check-in-passet): dev-servern som serverade Marcus
pågående granskning dog mitt i den — rotorsaken var ett `| head` på
serverprocessens utström i ett diagnostik-kommando. Släkt med `[[L440]]`
(pipens exitkod-maskering) — samma rotklass, pipe-semantik som ändrar det
observerade systemet, här i process-livslängds-ledet i stället för
exitkods-ledet.

**Det generella:** rör aldrig en levande processströms rör. Skriv processens
utdata till FIL (`> logg 2>&1`) och läs filen med `head`/`grep`/`tail` —
läsningen är då frikopplad från processens liv. Regeln gäller varje
long-running process vars fortsatta liv någon annan beror på.
