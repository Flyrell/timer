import { rm } from 'node:fs/promises';

const outdir = './dist';
await rm(outdir, { recursive: true, force: true });

// biome-ignore lint/correctness/noUndeclaredVariables: Bun is globally available
await Bun.build({
    outdir,
    minify: true,
    entrypoints: ['./index.html'],
});
