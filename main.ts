import { copyFileSync, existsSync, readFileSync, statSync } from "node:fs";

// Round 3 entry for news-image-20261118: "THE GLOBAL HERALD — THE WHOLE
// DAY IN ONE PAGE". The front page itself is drawn ahead of time (see
// dev/draw_frontpage_r3.py): 40 real, date-checked stories from Wednesday
// 18 November 2026 across 7 regions — the Gulf escalation first, then a
// drawn Gulf map, a day-in-order strip, and a two-column region grid.
// This program only hands the finished image in, byte for byte.

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const SOURCE = new URL("./entry.png", import.meta.url);

function fail(message: string): never {
  throw new Error(`news-image-20261118 round 3: ${message}`);
}

// The entry image must be present in the repository next to this file.
if (!existsSync(SOURCE)) {
  fail("entry.png is missing from the entry directory");
}

const image = readFileSync(SOURCE);
if (image.length === 0) {
  fail("entry.png is empty");
}

// The competition caps the image at 1 MiB; a bigger file is refused by
// the gate outright, so catch it here with the actual byte count.
if (image.length > 1048576) {
  fail(`entry.png is ${image.length} bytes, over the 1 MiB cap`);
}

// Only a PNG or a JPEG may be handed in; anything else is not an image
// the gate accepts, so refuse it here instead of shipping bad bytes.
const isPng =
  image[0] === 0x89 && image[1] === 0x50 &&
  image[2] === 0x4e && image[3] === 0x47;
const isJpeg =
  image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
if (!isPng && !isJpeg) {
  fail("entry.png is not a PNG or JPEG file");
}

// A PNG stores its width and height as big-endian uint32 values at bytes
// 16-19 and 20-23, right after the IHDR length and type. The competition
// caps the image at 1024x1024 and this page is drawn at exactly that
// size, so a PNG of any other size is a wrong file, not a valid entry.
if (isPng) {
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    fail(`entry.png is ${width}x${height}, expected 1024x1024`);
  }
}

const target = `${OUT_DIR}/entry.png`;
copyFileSync(SOURCE, target);

// Confirm the copy landed whole: the output must be the same size as
// the source, or the run did not really hand the image in.
if (statSync(target).size !== image.length) {
  fail(`copied entry.png is incomplete (${statSync(target).size} of ${image.length} bytes)`);
}
console.log(`copied entry.png (${image.length} bytes, 1024x1024) to ${target}`);
