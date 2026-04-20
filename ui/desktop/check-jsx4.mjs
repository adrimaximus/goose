import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.renderer.config.mts',
  server: { middlewareMode: true },
});
const result = await server.transformRequest('/src/components/devtools/InspectorToggle.tsx');
const code = result?.code || '';
// Find lines with __source
const lines = code.split('\n');
const sourceLines = lines.filter(l => l.includes('__source'));
console.log(`Total lines: ${lines.length}, __source occurrences: ${sourceLines.length}`);
console.log('\n=== FIRST 5 __source LINES ===');
sourceLines.slice(0, 5).forEach(l => console.log(l.trim()));
process.exit(0);
