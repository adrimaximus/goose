type SourceLocation = { fileName: string; lineNumber: string };

declare global {
  // eslint-disable-next-line no-var
  var __JSX_SOURCES__: WeakMap<object, SourceLocation> | undefined;
}

export function getElementSource(element: object): SourceLocation | null {
  return globalThis.__JSX_SOURCES__?.get(element) ?? null;
}
