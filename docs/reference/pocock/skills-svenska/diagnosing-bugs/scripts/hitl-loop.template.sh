#!/usr/bin/env bash
# Reproduktionsloop med människa i loopen.
# Kopiera filen, redigera stegen nedan och kör den.
# Agenten kör skriptet; användaren följer uppmaningarna i sin terminal.
#
# Användning:
#   bash hitl-loop.template.sh
#
# Två hjälpfunktioner:
#   step "<instruction>"          → visa instruktion, vänta på Enter
#   capture VAR "<question>"      → visa fråga, läs svaret till VAR
#
# I slutet skrivs insamlade värden ut som KEY=VALUE så att agenten kan tolka dem.

set -euo pipefail

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [Tryck Enter när du är klar] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -p "    > " answer
  printf -v "$var" '%s' "$answer"
}

# --- redigera nedan -----------------------------------------------------

step "Öppna appen på http://localhost:3000 och logga in."

capture ERRORED "Klicka på knappen 'Export'. Kastade den ett fel? (j/n)"

capture ERROR_MSG "Klistra in felmeddelandet (eller 'inget'):"

# --- redigera ovan ------------------------------------------------------

printf '\n--- Insamlat ---\n'
printf 'ERRORED=%s\n' "$ERRORED"
printf 'ERROR_MSG=%s\n' "$ERROR_MSG"
