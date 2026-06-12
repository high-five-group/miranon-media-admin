/**
 * Genererar favicon-fallback-setet ur public/favicon/favicon.svg
 * (den runda vit-bakgrunds-plattan, Session 16 K5d).
 *
 * Kör: node scripts/generate-favicons.mjs
 *
 * - favicon-96x96.png + 48-PNG:n i favicon.ico: transparenta hörn så den
 *   runda formen syns i fliken oavsett browser-tema.
 * - apple-touch-icon.png (180): flatten:ad mot vitt — iOS maskar själv
 *   med sin squircle och transparenta hörn blir svarta där (valet "vit
 *   kvadratisk platta bakom cirkeln" per K5d B-noten).
 * - favicon.ico byggs som modern single-entry-ICO med PNG-data (samma
 *   form som @vite-pwa/assets-generators ICO-utdata) — ingen extra
 *   ICO-dependency behövs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SVG_PATH = 'public/favicon/favicon.svg';
const SVG_SIZE = 400;
const svg = readFileSync(SVG_PATH);

function render(size) {
  return sharp(svg, { density: 72 * (size / SVG_SIZE) }).resize(size, size);
}

function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // typ: ikon
  header.writeUInt16LE(1, 4); // antal bilder
  header.writeUInt8(size === 256 ? 0 : size, 6); // bredd
  header.writeUInt8(size === 256 ? 0 : size, 7); // höjd
  header.writeUInt8(0, 8); // palett
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // färgplan
  header.writeUInt16LE(32, 12); // bitar/pixel
  header.writeUInt32LE(pngBuffer.length, 14); // datastorlek
  header.writeUInt32LE(22, 18); // dataoffset
  return Buffer.concat([header, pngBuffer]);
}

const png96 = await render(96).png({ compressionLevel: 9 }).toBuffer();
writeFileSync('public/favicon/favicon-96x96.png', png96);

const png48 = await render(48).png({ compressionLevel: 9 }).toBuffer();
writeFileSync('public/favicon/favicon.ico', pngToIco(png48, 48));

const apple = await render(180)
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync('public/favicon/apple-touch-icon.png', apple);

console.log('✔ favicon-96x96.png, favicon.ico (48 PNG-ICO), apple-touch-icon.png (vit platta)');
