import { createServer } from 'vite';

const server = await createServer({
  configFile: './vite.renderer.config.mts',
  server: { middlewareMode: true },
});
const mod = await server.moduleGraph.getModuleByUrl('/src/components/devtools/InspectorToggle.tsx');
if (mod) {
  console.log('=== TRANSFORMED OUTPUT ===');
  console.log(mod.code?.substring(0, 3000));
} else {
  // Force transform
  const result = await server.transformRequest('/src/components/devtools/InspectorToggle.tsx');
  console.log('=== TRANSFORMED OUTPUT ===');
  console.log(result?.code?.substring(0, 3000));
}
await server.close();
