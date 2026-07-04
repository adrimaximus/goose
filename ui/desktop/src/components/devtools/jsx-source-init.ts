// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFiberFromElement(element: HTMLElement): any {
    const key = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return key ? (element as any)[key] : null;
}
