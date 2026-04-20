import { transform } from 'vite';
import fs from 'fs';

const code = fs.readFileSync('src/components/devtools/InspectorToggle.tsx', 'utf8');
const result = await transform(code, { id: 'src/components/devtools/InspectorToggle.tsx' });
console.log(result.code.substring(0, 3000));
