import { createServer } from 'vite';
import fs from 'fs';

const code = fs.readFileSync('src/components/devtools/InspectorToggle.tsx', 'utf8');

// Use oxc-transform directly since Vite 7 uses it
const { transformAsync } = await import('@oxc-node/core');

const result = await transformAsync(code, {
  filename: 'src/components/devtools/InspectorToggle.tsx',
  jsx: 'automatic',
  sourcemap: false,
});
console.log(result.code.substring(0, 3000));
