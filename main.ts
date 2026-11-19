import { copyFileSync, existsSync, readFileSync } from "node:fs";

// Round 2 entry: a fresh front page, "THE GLOBAL HERALD", summing up
// Wednesday 18 November 2026 — the Gulf escalation as the U.S. strikes
// Qeshm Island and Iran answers with drones at Kuwait and Bahrain, the
// Kerch Bridge hit again, Xi meeting Putin before the Trump talks,
// Peltola winning Alaska, and Ebola doubling in Congo. Copy the image
// byte-for-byte to the output dir.
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = new URL("./entry.png", import.meta.url);
if (!existsSync(src)) {
  throw new Error("entry.png is missing from the entry directory");
}
const buf = readFileSync(src);
const isPng =
  buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
if (!isPng && !isJpg) throw new Error("entry.png is not a PNG or JPEG");
// The entry is built at exactly 1024x1024, the competition's cap, so
// refuse a PNG of any other size instead of handing in a wrong-sized
// image: a PNG stores its width and height as big-endian uint32s at
// bytes 16-19 and 20-23 of the file, right after the IHDR length/type.
if (isPng) {
  const pngWidth = buf.readUInt32BE(16);
  const pngHeight = buf.readUInt32BE(20);
  if (pngWidth !== 1024 || pngHeight !== 1024) {
    throw new Error(
      `entry.png is ${pngWidth}x${pngHeight}, expected 1024x1024`,
    );
  }
}
copyFileSync(src, `${out}/entry.png`);
