#!/usr/bin/env bash
# scripts/task-464-1-kastbar-kod-probe.sh — kastbar probe för TASK-464.1:s
# kontrastpar (kod-only). Finns ENDAST för att empiriskt mäta vilka CI-jobb
# en ren kodändring kör efter S4/SE2-omstruktureringen — särskilt att de sju
# flyttade docs-grindarna HOPPAS och de fem kvarvarande (plus mall-parity)
# KÖR. Grenen tas bort efter mätningen.
set -euo pipefail
echo "kastbar probe — TASK-464.1 kontrastpar (kod-only)"
