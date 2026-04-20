import type { Plugin } from "vite";

const MODULE_ID = "react/jsx-runtime";
const VIRTUAL_PREFIX = "\0jsx-source:";
const VIRTUAL_ID = VIRTUAL_PREFIX + MODULE_ID;

export function jsxSourcePlugin(): Plugin {
  return {
    name: "jsx-source-tracking",
    enforce: "pre",

    resolveId(source, _importer, options) {
      if (options.ssr) return null;
      if (source === MODULE_ID) return VIRTUAL_ID;
      return null;
    },

    async load(id) {
      if (id !== VIRTUAL_ID) return null;

      const resolved = await this.resolve(MODULE_ID, undefined, {
        skipSelf: true,
      });
      if (!resolved || resolved.id === VIRTUAL_ID) return null;

      const original = await this.load({
        id: resolved.id,
        resolveDependencies: false,
      });

      return {
        ...original,
        code: wrapModule(original.code),
        map: null,
      };
    },
  };
}

function wrapModule(code: string): string {
  const wrapper = `
const __sourceMap = globalThis.__JSX_SOURCES__ || (globalThis.__JSX_SOURCES__ = new WeakMap());

function __parseSourceFromStack(stack) {
  if (!stack) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const lines = stack.split('\\n');
  for (const line of lines) {
    const match = line.match(/at\\s+.*?\\(?(https?:\\/\\/[^)]+):(\\d+):(\\d+)\\)?/);
    if (match) {
      const rawUrl = match[1].split('?')[0];
      if (rawUrl.includes('/src/')) {
        return { fileName: rawUrl.replace(origin, '').replace(/^\\//, ''), lineNumber: match[2] };
      }
    }
    const viteMatch = line.match(/at\\s+.*?\\(?(\\/src\\/[^\\s:?]+):(\\d+):(\\d+)\\)?/);
    if (viteMatch) {
      return { fileName: viteMatch[1].replace(/^\\//, ''), lineNumber: viteMatch[2] };
    }
  }
  return null;
}

function __wrapJsx(original) {
  return function(type, config, maybeKey) {
    const el = original(type, config, maybeKey);
    if (el && typeof el === 'object') {
      const source = __parseSourceFromStack(new Error().stack);
      if (source) __sourceMap.set(el, source);
    }
    return el;
  };
}
`;

  const patchCall = `
if (typeof exports !== 'undefined') {
  if (typeof exports.jsx === 'function') exports.jsx = __wrapJsx(exports.jsx);
  if (typeof exports.jsxs === 'function') exports.jsxs = __wrapJsx(exports.jsxs);
}
`;

  return wrapper + "\n" + code + "\n" + patchCall;
}
