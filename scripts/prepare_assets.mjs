#!/usr/bin/env node
// Extrait public/anatomy.glb depuis danse-comparateur-handoff.zip (source de vérité
// du handoff, committée en binaire dans le dépôt) puis corrige l'en-tête GLB dans
// l'ordre du spec glTF 2.0 : magic, version, length (le GLB du handoff est stocké
// magic, length, version — piège documenté dans le README du handoff).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const zipPath = join(root, "danse-comparateur-handoff.zip");
const outPath = join(root, "public", "anatomy.glb");
const member = "danse-comparateur/public/anatomy.glb";

function extractFromZip(zip, name) {
  const buf = readFileSync(zip);
  // localise l'entête central (EOCD)
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("EOCD introuvable");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("central header invalide");
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.subarray(off + 46, off + 46 + nameLen).toString("utf8");
    if (name === member) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const dataOff = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataOff, dataOff + compSize);
      return method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`membre ${member} introuvable dans ${zip}`);
}

function fixGlbHeader(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("pas un GLB");
  const version = buf.readUInt32LE(4);
  const length = buf.readUInt32LE(8);
  if (version === 2 && length === buf.length) return buf; // déjà conforme
  const out = Buffer.from(buf);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(buf.length, 8);
  return out;
}

if (!existsSync(outPath)) {
  mkdirSync(dirname(outPath), { recursive: true });
  const glb = extractFromZip(zipPath, member);
  writeFileSync(outPath, fixGlbHeader(glb));
  console.log(`anatomy.glb extrait de ${member} (en-tête corrigé)`);
} else {
  const fixed = fixGlbHeader(readFileSync(outPath));
  if (!fixed.equals(readFileSync(outPath))) {
    writeFileSync(outPath, fixed);
    console.log("en-tête GLB corrigé (magic, version, length)");
  }
}
console.log("public/anatomy.glb prêt");
