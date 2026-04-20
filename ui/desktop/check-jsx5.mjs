import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.renderer.config.mts',
  server: { middlewareMode: true },
});
const result = await server.transformRequest('/src/components/devtools/InspectorToggle.tsx');
const code = result?.code || '';
// Find jsxDEV calls
const lines = code.split('\n');
const jsxLines = lines.filter(l => /\bjsxDEV\s*\(/.test(l));
console.log(`Total lines: ${lines.length}, jsxDEV calls: ${jsxLines.length}`);
console.log('\n=== FIRST 10 jsxDEV LINES ===');
jsxLines.slice(0, 10).forEach((l, i) => console.log(`\n--- Line ${i} ---\n${l.substring(0, 200)}`));
process.exit(0);
