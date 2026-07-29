// API-token-setup (T24-b) — kör EN gång före api-staging-sviten (Playwright
// project dependency). Loggar in user + admin EXAKT en gång var och persisterar
// access-tokens till fil, så svit-testerna återanvänder dem i stället för att
// logga in per test (44 logins → 2). Eliminerar GoTrue-rate-limit-429-burst (T24).
//
// Idiomatisk Playwright "authenticate once in the setup project, save the
// authentication state, and then reuse it" (playwright.dev/docs/auth § Basic +
// § Authenticate with API request). Persistens som JSON-fil (ej storageState)
// eftersom Supabase-auth ger en Bearer-JWT i svarskroppen — ingen cookie att
// fånga. Speglar e2e:s setup→storageState-mönster, för API-kontexten.
//
// Hard-fail/skip-kontraktet ärvs från getApiConfig: CI (STAGING_REQUIRED=1) →
// hard-fail om creds saknas; lokalt utan .env.test → tyst skip (då skippar även
// svit-testerna via sin egen getApiConfig, så den saknade filen läses aldrig).

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { kravStagingLedigt } from '../support/staging-preflight';
import { API_TOKENS_PATH, getApiConfig, loginUser } from './helpers';

setup('authenticate api user + admin once (T24-b)', async ({ request }) => {
  const config = getApiConfig();

  // TASK-77: EFTER getApiConfig med flit. Saknas creds skippar/kastar den
  // redan, och en körning som ändå inte når staging ska inte betala för ett
  // API-anrop mot GitHub. Projektet är dependency för api-staging OCH
  // kontraktsvakt, så båda sviterna bär preflighten via denna rad.
  kravStagingLedigt('lokal Playwright-körning (api-setup)');

  const userJwt = await loginUser(
    request,
    config.baseUrl,
    config.anonKey,
    config.userEmail,
    config.userPassword,
  );
  const adminJwt = await loginUser(
    request,
    config.baseUrl,
    config.anonKey,
    config.adminEmail,
    config.adminPassword,
  );

  await mkdir(dirname(API_TOKENS_PATH), { recursive: true });
  await writeFile(API_TOKENS_PATH, JSON.stringify({ userJwt, adminJwt }), 'utf-8');
});
