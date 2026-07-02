---
name: setup-pre-commit
description: Sätt upp Husky-pre-commit-hooks med lint-staged (Prettier), typkontroll och tester i det aktuella repot. Använd när användaren vill lägga till pre-commit-hooks, sätta upp Husky, konfigurera lint-staged eller lägga till formatering, typkontroll och tester vid commit.
---

# Sätt upp pre-commit-hooks

## Det här sätts upp

- **Husky**-hook för pre-commit.
- **lint-staged** som kör Prettier på alla stage:ade filer.
- Prettier-konfiguration, om den saknas.
- Skripten **typecheck** och **test** i pre-commit-hooken.

## Steg

### 1. Identifiera pakethanterare

Kontrollera `package-lock.json` (npm), `pnpm-lock.yaml` (pnpm), `yarn.lock` (yarn) och `bun.lockb` (bun). Använd den som finns. Använd npm som standard om det är oklart.

### 2. Installera beroenden

Installera som devDependencies:

```
husky lint-staged prettier
```

### 3. Initiera Husky

```bash
npx husky init
```

Detta skapar katalogen `.husky/` och lägger till `prepare: "husky"` i package.json.

### 4. Skapa `.husky/pre-commit`

Skriv denna fil (ingen shebang behövs för Husky v9+):

```
npx lint-staged
npm run typecheck
npm run test
```

**Anpassa:** ersätt `npm` med den identifierade pakethanteraren. Om repot saknar skriptet `typecheck` eller `test` i package.json, utelämna respektive rad och berätta det för användaren.

### 5. Skapa `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. Skapa `.prettierrc` om den saknas

Skapa bara filen om ingen Prettier-konfiguration finns. Använd dessa standardvärden:

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. Verifiera

- [ ] `.husky/pre-commit` finns och är körbar.
- [ ] `.lintstagedrc` finns.
- [ ] Skriptet `prepare` i package.json är `"husky"`.
- [ ] Prettier-konfiguration finns.
- [ ] Kör `npx lint-staged` för att verifiera att den fungerar.

### 8. Committa

Stage:a alla ändrade och skapade filer och committa med meddelandet: `Add pre-commit hooks (husky + lint-staged + prettier)`

Detta kör de nya pre-commit-hookarna — ett bra röktest för att allt fungerar.

## Noteringar

- Husky v9+ behöver inte shebangs i hook-filer.
- `prettier --ignore-unknown` hoppar över filer som Prettier inte kan tolka, exempelvis bilder.
- Pre-commit kör först lint-staged (snabbt, endast stage:ade filer) och därefter full typkontroll och tester.
