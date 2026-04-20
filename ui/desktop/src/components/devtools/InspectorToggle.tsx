/* eslint-disable no-undef */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ScanSearch, X, Copy, PlusCircle, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'react-toastify';
import { getElementSource } from './jsx-source-init';

interface InspectorInfo {
    componentName: string;
    fileName: string;
    lineNumber: string;
    columnNumber?: string;
    fullIdentifier: string;
}

interface InspectorItem {
    id: string;
    element: HTMLElement;
    rect: DOMRect;
    info: InspectorInfo;
}

interface Point {
    x: number;
    y: number;
}

interface InspectorState {
    active: boolean;
    paused: boolean;
    multiSelectMode: boolean;
    hoverItem: InspectorItem | null;
    selectedItems: InspectorItem[];
    x: number;
    y: number;
    rulerStart: Point | null;
    rulerEnd: Point | null;
    rulerStartItem: InspectorItem | null;
    rulerEndItem: InspectorItem | null;
}

const InspectorToggle = () => {
    const [inspectorState, setInspectorState] = useState<InspectorState>({
        active: false,
        paused: false,
        multiSelectMode: false,
        hoverItem: null,
        selectedItems: [],
        x: 0,
        y: 0,
        rulerStart: null,
        rulerEnd: null,
        rulerStartItem: null,
        rulerEndItem: null
    });

    const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);
    const dragStartTimeRef = useRef(0);
    const dragStartPosRef = useRef({ x: 0, y: 0 });
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    const inspectorStateRef = useRef(inspectorState);
    const enabledRef = useRef(false);

    useEffect(() => {
        inspectorStateRef.current = inspectorState;
        enabledRef.current = inspectorState.active;
    }, [inspectorState]);

    const toggleInspector = () => {
        setInspectorState(prev => ({
            ...prev,
            active: !prev.active,
            paused: false,
            multiSelectMode: false,
            hoverItem: null,
            selectedItems: [],
            rulerStart: null,
            rulerEnd: null,
            rulerStartItem: null,
            rulerEndItem: null
        }));
    };

    const toggleMultiSelect = () => {
        setInspectorState(prev => ({
            ...prev,
            multiSelectMode: !prev.multiSelectMode,
            paused: false
        }));
        toast.info(inspectorState.multiSelectMode ? "Multi-Select OFF" : "Multi-Select ON (Click multiple items)");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getComponentName = useCallback((fiber: any): string => {
        if (!fiber) return 'Unknown';
        const type = fiber.type;
        if (typeof type === 'string') return type;
        if (typeof type === 'function') return type.displayName || type.name || 'Anonymous';
        if (typeof type === 'object' && type !== null) {
            if (type.displayName) return type.displayName;
            if (type.render && (type.render.displayName || type.render.name)) return type.render.displayName || type.render.name;
        }
        return 'Unknown';
    }, []);

    const getElementDetails = (element: HTMLElement) => {
        let details = '';
        if (element.id) details += `#${element.id}`;
        if (element.classList.length > 0) {
            const classes = Array.from(element.classList).slice(0, 2).join('.');
            details += `.${classes}`;
        }
        return details;
    };

    const cleanPath = (path: string) => {
        const parts = path.split('src/');
        return parts.length > 1 ? 'src/' + parts[1] : path;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseDebugStack = (fiber: any): { fileName: string; lineNumber: string } | null => {
        const stack = fiber._debugStack;
        if (!stack || typeof stack !== 'object' || !stack.stack) return null;

        const stackStr: string = stack.stack;
        const origin = window.location.origin;
        const lines = stackStr.split('\n');

        for (const line of lines) {
            const match = line.match(/at\s+.*?\(?(https?:\/\/[^)]+):(\d+):(\d+)\)?/);
            if (match) {
                const rawUrl = match[1];
                const urlWithoutQuery = rawUrl.split('?')[0];
                if (urlWithoutQuery.includes('/src/')) {
                    const filePath = urlWithoutQuery.replace(origin, '').replace(/^\//, '');
                    return { fileName: filePath, lineNumber: match[2] };
                }
            }
            const viteMatch = line.match(/at\s+.*?\(?(\/src\/[^\s:?]+):(\d+):(\d+)\)?/);
            if (viteMatch) {
                return { fileName: viteMatch[1].replace(/^\//, ''), lineNumber: viteMatch[2] };
            }
        }
        return null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getSourceInfo = (fiber: any): { fileName: string; lineNumber: string } | null => {
        if (fiber._debugSource?.fileName) {
            const source = fiber._debugSource;
            return {
                fileName: String(source.fileName).replace(window.location.origin, '').replace(/^\//, ''),
                lineNumber: source.lineNumber != null ? String(source.lineNumber) : '0',
            };
        }
        const stackResult = parseDebugStack(fiber);
        if (stackResult) return stackResult;
        if (fiber.stateNode && fiber.stateNode !== fiber.child) {
            const elementSource = getElementSource(fiber.stateNode);
            if (elementSource) return elementSource;
        }
        if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') {
            const elementSource = getElementSource(fiber.memoizedProps);
            if (elementSource) return elementSource;
        }
        return null;
    };

    const getInspectorItem = useCallback((element: HTMLElement): InspectorItem | null => {
        const key = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fiber = key ? (element as any)[key] : null;

        let currentFiber = fiber;
        let attempts = 0;
        let bestFiber = null;

        while (currentFiber && attempts < 8) {
            const name = getComponentName(currentFiber);
            const source = getSourceInfo(currentFiber);
            if (source && name !== 'Unknown' && name !== 'div' && name !== 'span') {
                bestFiber = currentFiber;
                break;
            }
            if (source && !bestFiber) {
                bestFiber = currentFiber;
            }
            currentFiber = currentFiber.return;
            attempts++;
        }

        const classHint = getElementDetails(element);
        let componentName: string;
        let fileName: string;
        let lineNumber: string;

        if (bestFiber) {
            const source = getSourceInfo(bestFiber);
            componentName = getComponentName(bestFiber);
            if (source) {
                fileName = source.fileName;
                lineNumber = source.lineNumber;
            } else {
                fileName = 'External/Library';
                lineNumber = '0';
            }
        } else {
            componentName = element.tagName.toLowerCase();
            const role = element.getAttribute('role');
            if (role) componentName += ` [role="${role}"]`;
            fileName = 'External/Library';
            lineNumber = '0';
        }

        const fullIdentifier = `${componentName}${classHint}`;
        const id = fileName === 'External/Library'
            ? `node-${Date.now()}-${Math.random()}`
            : `${fileName}:${lineNumber}:${fullIdentifier}`;

        return {
            id,
            element,
            rect: element.getBoundingClientRect(),
            info: { componentName, fileName, lineNumber, fullIdentifier }
        };
    }, [getComponentName]);

    const copyToClipboard = async () => {
        const current = inspectorStateRef.current;
        const items = current.selectedItems.length > 0 ? current.selectedItems : (current.hoverItem ? [current.hoverItem] : []);

        if (items.length === 0 && !current.rulerStart) return;

        if (current.rulerStart && current.rulerEnd) {
            const dx = current.rulerEnd.x - current.rulerStart.x;
            const dy = current.rulerEnd.y - current.rulerStart.y;
            const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
            const fromName = current.rulerStartItem ? `${cleanPath(current.rulerStartItem.info.fileName)}:${current.rulerStartItem.info.lineNumber} (${current.rulerStartItem.info.componentName})` : "Point A";
            const toName = current.rulerEndItem ? `${cleanPath(current.rulerEndItem.info.fileName)}:${current.rulerEndItem.info.lineNumber} (${current.rulerEndItem.info.componentName})` : "Point B";
            await navigator.clipboard.writeText(`${dist}px (w: ${Math.abs(dx)}, h: ${Math.abs(dy)})\nFrom: ${fromName}\nTo: ${toName}`);
            toast.success("Measurement Copied!");
            return;
        }

        const formattedLines = items.map(item =>
            `file: ${cleanPath(item.info.fileName)}:${item.info.lineNumber} (${item.info.fullIdentifier})`
        );
        await navigator.clipboard.writeText(formattedLines.join('\n'));
        toast.success("Copied!");
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if ('button' in e && e.button !== 0) return;
        isDraggingRef.current = true;
        dragStartTimeRef.current = Date.now();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStartPosRef.current = { x: clientX, y: clientY };
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        dragOffsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const newX = clientX - dragOffsetRef.current.x;
        const newY = clientY - dragOffsetRef.current.y;
        setBtnPos({
            x: Math.min(Math.max(0, newX), window.innerWidth - 120),
            y: Math.min(Math.max(0, newY), window.innerHeight - 50)
        });
    }, []);

    const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        const duration = Date.now() - dragStartTimeRef.current;
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;
        const distance = Math.sqrt(Math.pow(clientX - dragStartPosRef.current.x, 2) + Math.pow(clientY - dragStartPosRef.current.y, 2));
        if (duration < 200 && distance < 5) toggleInspector();
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.altKey && e.code === 'KeyT') || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyX')) {
                e.preventDefault();
                toggleInspector();
                return;
            }
            if (!enabledRef.current) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                setInspectorState(prev => {
                    if (prev.rulerStart || prev.selectedItems.length > 0) {
                        return { ...prev, rulerStart: null, rulerEnd: null, rulerStartItem: null, rulerEndItem: null, selectedItems: [], multiSelectMode: false, paused: false };
                    }
                    return { ...prev, active: false };
                });
            }

            if ((e.metaKey || e.ctrlKey) && e.code === 'KeyC') {
                e.preventDefault();
                copyToClipboard();
            }

            if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable;
                if (activeTag === 'input' || activeTag === 'textarea' || isContentEditable) return;
                e.preventDefault();
                const current = inspectorStateRef.current;
                if (current.hoverItem) {
                    const itemToFreeze = current.hoverItem;
                    const text = `file: ${cleanPath(itemToFreeze.info.fileName)}:${itemToFreeze.info.lineNumber} (${itemToFreeze.info.fullIdentifier})`;
                    setInspectorState(prev => ({ ...prev, paused: true, selectedItems: [itemToFreeze] }));
                    navigator.clipboard.writeText(text).then(() => toast.success(`Frozen: ${itemToFreeze.info.componentName}`)).catch(() => {});
                }
                return;
            }

            if (e.key === 'd') {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea') return;
                const current = inspectorStateRef.current;
                if (!current.rulerStart) {
                    setInspectorState(prev => ({ ...prev, rulerStart: { x: prev.x, y: prev.y }, rulerEnd: null, rulerStartItem: prev.hoverItem, rulerEndItem: null }));
                    toast.info("Point A Set: " + (current.hoverItem?.info.componentName || "Unknown"));
                } else {
                    const dx = current.x - current.rulerStart.x;
                    const dy = current.y - current.rulerStart.y;
                    const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
                    setInspectorState(prev => ({ ...prev, rulerEnd: { x: prev.x, y: prev.y }, rulerEndItem: prev.hoverItem }));
                    const fromName = current.rulerStartItem ? `${cleanPath(current.rulerStartItem.info.fileName)}:${current.rulerStartItem.info.lineNumber} (${current.rulerStartItem.info.componentName})` : "Point A";
                    const toName = current.hoverItem ? `${cleanPath(current.hoverItem.info.fileName)}:${current.hoverItem.info.lineNumber} (${current.hoverItem.info.componentName})` : "Point B";
                    toast.success(`Distance Measured: ${distance}px`);
                    navigator.clipboard.writeText(`${distance}px (w: ${Math.abs(dx)}, h: ${Math.abs(dy)})\nFrom: ${fromName}\nTo: ${toName}`).catch(() => {});
                }
            }

            if (e.key === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                const isContentEditable = (document.activeElement as HTMLElement)?.isContentEditable;
                if (activeTag === 'input' || activeTag === 'textarea' || isContentEditable) return;
                e.preventDefault();
                e.stopPropagation();
                toggleMultiSelect();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
        return () => document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!enabledRef.current) return;
            const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
            if (!target || target.closest('#inspector-ui')) {
                setInspectorState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                return;
            }
            const item = getInspectorItem(target);
            setInspectorState(prev => ({
                ...prev,
                x: e.clientX,
                y: e.clientY,
                hoverItem: (prev.paused && !prev.multiSelectMode) ? prev.hoverItem : item
            }));
        };

        const handleInteraction = (e: Event) => {
            if (!enabledRef.current) return;
            if ((e.target as HTMLElement).closest('#inspector-ui')) return;
            const current = inspectorStateRef.current;
            if (!current.hoverItem) return;

            if ((e as MouseEvent).shiftKey || current.multiSelectMode) {
                e.preventDefault();
                setInspectorState(prev => {
                    const exists = prev.selectedItems.find(i => i.element === current.hoverItem!.element);
                    if (exists) return prev;
                    return { ...prev, paused: false, selectedItems: [...prev.selectedItems, current.hoverItem!] };
                });
            } else {
                const itemToCopy = current.hoverItem;
                const text = `file: ${cleanPath(itemToCopy.info.fileName)}:${itemToCopy.info.lineNumber} (${itemToCopy.info.fullIdentifier})`;
                navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => {});
                setInspectorState(prev => ({ ...prev, selectedItems: [itemToCopy] }));
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleInteraction, { capture: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleInteraction, { capture: true });
        };
    }, [getInspectorItem]);

    if (!inspectorState.active) {
        return (
            <div
                className="fixed z-[2147483646] cursor-grab active:cursor-grabbing"
                style={{
                    left: btnPos ? btnPos.x : undefined,
                    top: btnPos ? btnPos.y : undefined,
                    right: btnPos ? undefined : '1rem',
                    bottom: btnPos ? undefined : '1rem'
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onDoubleClick={toggleInspector}
                title="Double Click to Open / Drag to Move / Alt+T"
            >
                <Button
                    size="sm"
                    variant="outline"
                    shape="pill"
                    className="shadow-lg opacity-80 hover:opacity-100 transition-opacity select-none pointer-events-none"
                >
                    <GripVertical className="w-4 h-4 mr-2 opacity-50" />
                    DevTools
                </Button>
            </div>
        );
    }

    return (
        <div id="inspector-ui" className="fixed inset-0 z-[2147483647] pointer-events-none">
            {!inspectorState.paused && !inspectorState.multiSelectMode && inspectorState.hoverItem && (
                <div className="absolute border-2 border-blue-500 bg-blue-500/10 transition-all duration-75" style={{ left: inspectorState.hoverItem.rect.left, top: inspectorState.hoverItem.rect.top, width: inspectorState.hoverItem.rect.width, height: inspectorState.hoverItem.rect.height }} />
            )}
            {inspectorState.multiSelectMode && inspectorState.hoverItem && (
                <div className="absolute border-2 border-dashed border-orange-500 bg-orange-500/10 transition-all duration-75" style={{ left: inspectorState.hoverItem.rect.left, top: inspectorState.hoverItem.rect.top, width: inspectorState.hoverItem.rect.width, height: inspectorState.hoverItem.rect.height }} />
            )}
            {inspectorState.selectedItems.map((item, i) => (
                <div key={item.id + i} className="absolute border-2 border-green-500 bg-green-500/20" style={{ left: item.rect.left, top: item.rect.top, width: item.rect.width, height: item.rect.height }}>
                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-[10px] px-1 rounded shadow-sm whitespace-nowrap z-10 max-w-[200px] truncate">
                        {item.info.fullIdentifier}
                    </div>
                </div>
            ))}
            {inspectorState.rulerStart && (
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <line
                            x1={inspectorState.rulerStart.x}
                            y1={inspectorState.rulerStart.y}
                            x2={inspectorState.rulerEnd ? inspectorState.rulerEnd.x : inspectorState.x}
                            y2={inspectorState.rulerEnd ? inspectorState.rulerEnd.y : inspectorState.y}
                            stroke="red" strokeWidth="2" strokeDasharray="4 2"
                        />
                    </svg>
                    {(() => {
                        const endX = inspectorState.rulerEnd ? inspectorState.rulerEnd.x : inspectorState.x;
                        const endY = inspectorState.rulerEnd ? inspectorState.rulerEnd.y : inspectorState.y;
                        const dx = endX - inspectorState.rulerStart.x;
                        const dy = endY - inspectorState.rulerStart.y;
                        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
                        const fromName = inspectorState.rulerStartItem ? `${cleanPath(inspectorState.rulerStartItem.info.fileName).split('/').pop()} (${inspectorState.rulerStartItem.info.componentName})` : "A";
                        const toItem = inspectorState.rulerEndItem || inspectorState.hoverItem;
                        const toName = toItem ? `${cleanPath(toItem.info.fileName).split('/').pop()} (${toItem.info.componentName})` : "B";
                        return (
                            <div
                                className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px] text-center"
                                style={{ left: (inspectorState.rulerStart.x + endX) / 2, top: (inspectorState.rulerStart.y + endY) / 2 }}
                            >
                                <div className="font-bold">{dist}px</div>
                                <div className="text-[10px] opacity-80 mt-[-2px]">w: {Math.abs(dx)} h: {Math.abs(dy)}</div>
                                <div className="text-[9px] opacity-70 mt-1 max-w-[200px] truncate">{fromName} → {toName}</div>
                            </div>
                        );
                    })()}
                </div>
            )}
            <div className="fixed bg-background-primary border border-border-primary shadow-2xl rounded-full px-5 py-2 flex items-center gap-3 pointer-events-auto cursor-default" style={{ left: btnPos ? btnPos.x : '50%', top: btnPos ? btnPos.y : undefined, bottom: btnPos ? undefined : '1.5rem', transform: btnPos ? 'none' : 'translateX(-50%)' }}>
                <div className="mr-2 cursor-grab active:cursor-grabbing text-text-secondary hover:text-text-primary" onMouseDown={handleDragStart} onTouchStart={handleDragStart}><GripVertical className="w-4 h-4" /></div>
                <div className="flex items-center gap-2 mr-2 border-r border-border-primary pr-3"><ScanSearch className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold">DevTools</span></div>
                <div className="text-xs text-text-secondary mr-2 flex flex-col items-start leading-tight"><span>{inspectorState.selectedItems.length} selected</span><span className="text-[10px] opacity-70">{inspectorState.multiSelectMode ? 'MULTI-SELECT ON' : 'Single Select'}</span></div>
                <Button size="sm" shape="round" variant={inspectorState.multiSelectMode ? "secondary" : "ghost"} className={inspectorState.multiSelectMode ? "bg-orange-100 text-orange-600" : ""} onClick={toggleMultiSelect} title="Multi-Select (M)"><PlusCircle className="w-4 h-4" /></Button>
                <Button size="sm" shape="round" variant="ghost" className="hover:bg-background-secondary" onClick={copyToClipboard} title="Copy"><Copy className="w-4 h-4" /></Button>
                <Button size="sm" shape="round" variant="ghost" className="hover:text-text-danger" onClick={toggleInspector}><X className="w-4 h-4" /></Button>
            </div>
        </div>
    );
};

export default InspectorToggle;
