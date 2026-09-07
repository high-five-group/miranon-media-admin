# Ägarlappens levande pid är inte en levande session — en idle process höll huvudkatalogen i två dagar

**`ps -p <pid>` svarar på om en process finns, inte på om någon arbetar i
den: en Claude-process som lämnats öppen i en flik håller huvudkatalogens
ägarlapp giltig i dagar, och varje ny session tar worktree enligt ADR-090
utan att någon någonsin frigör huvudkatalogen.** Mätt 2026-09-07 (S123
resume 1): lappen från 2026-09-05 19:12 UTC (pid 10540, cwd huvudkatalogen)
svarade levande vid resume och 43 timmar senare, huvudkatalogen stod ren
men 265 commits efter `origin/main`, och Marcus konstaterade *"INGEN annan
session kan äga huvudkatalogen just nu för denna session är den enda som
är aktiv."* Lappen togs bort på hans uttryckliga order (hookens egen
anvisning: `rm` är Marcus manuella val), main snabbspolades och deployen
kunde köras därifrån. Regel: åldern på en lapp avgör fortfarande ingenting
(ADR-090), men "pid lever" är ett svagt bevis — kombinera med
huvudkatalogens avstånd till `origin/main` och ett rent träd, och lyft
frågan till Marcus som ett faktum ("lappen är två dagar gammal, trädet är
rent, 265 commits efter") i stället för att arbeta runt huvudkatalogen i
tysthet när ett skript kräver `main`.
