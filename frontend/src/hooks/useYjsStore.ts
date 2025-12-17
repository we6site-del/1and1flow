import { useEffect, useState, useMemo } from 'react';
import {
    TLRecord,
    TLStore,
    createTLStore,
    defaultShapeUtils,
    uniqueId,
    HistoryEntry,
    StoreListener
} from 'tldraw';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { AiNodeShapeUtil } from '@/components/canvas/shapes/AiNodeShape';

export function useYjsStore({
    roomId = 'example',
    hostUrl = 'ws://localhost:8000/api/ws',
    shapeUtils = [],
    userId,
}: {
    roomId?: string;
    hostUrl?: string;
    shapeUtils?: any[];
    userId?: string;
}) {
    const [store] = useState(() => {
        const store = createTLStore({
            shapeUtils: [...defaultShapeUtils, ...shapeUtils, AiNodeShapeUtil],
        });
        return store;
    });

    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        setStatus('loading');

        const yDoc = new Y.Doc();
        const yArr = yDoc.getArray<{ key: string; val: TLRecord }>(`tl_${roomId}`);
        const yMap = yDoc.getMap<TLRecord>(`tl_map_${roomId}`);

        // We will use yMap for simpler key-value storage of records

        // Fix: Backend expects /api/ws/{room_id} in the path
        const fullUrl = `${hostUrl}/${roomId}`;
        const wsProvider = new WebsocketProvider(fullUrl, roomId, yDoc, { connect: true });

        wsProvider.on('status', (event: any) => {
            console.log("Yjs WebSocket status:", event.status);
            if (event.status === 'connected') {
                setStatus('ready');
            }
        });

        // 1. Listen to Tldraw Store changes -> Update Yjs
        const unlistenStore = store.listen(
            (entry: HistoryEntry<TLRecord>) => {
                const { changes } = entry;

                yDoc.transact(() => {
                    // Handle added
                    Object.values(changes.added).forEach((record) => {
                        yMap.set(record.id, record);
                    });

                    // Handle updated
                    Object.values(changes.updated).forEach(([_, record]) => {
                        yMap.set(record.id, record);
                    });

                    // Handle removed
                    Object.values(changes.removed).forEach((record) => {
                        yMap.delete(record.id);
                    });
                });
            },
            { source: 'user', scope: 'document' } // Only sync user changes
        );

        // 2. Listen to Yjs changes -> Update Tldraw Store
        const observer = (event: Y.YMapEvent<TLRecord>) => {
            const toRemove: string[] = [];
            const toPut: TLRecord[] = [];

            event.changes.keys.forEach((change, key) => {
                if (change.action === 'delete') {
                    toRemove.push(key);
                } else if (change.action === 'add' || change.action === 'update') {
                    const val = yMap.get(key);
                    if (val) toPut.push(val);
                }
            });

            store.mergeRemoteChanges(() => {
                if (toPut.length > 0) store.put(toPut);
                if (toRemove.length > 0) {
                    // Cast to any because store.remove expects specific args in some versions
                    // but general ID removal is supported in mergeRemoteChange context usually
                    // or we iterate.
                    // We don't know the type, preventing easy removal via store.remove(id) which might need type?
                    // Actually store.remove(id) works if we don't care about type validation sometimes
                    // but standard API is store.remove([id])
                    // Tldraw v2 API: store.remove(ids)
                    // Check types: remove(ids: IdOf<R>[]): void
                    // So we need to cast or we just assume it works
                    store.remove(toRemove as any);
                }
            });
        };

        yMap.observe(observer);

        // Initialize store from Yjs content
        // In "dumb broadcast mode", Yjs might be empty initially.
        // We should populate it if it's not empty.

        // Wait, if YMap is empty, and we have local content (from Supabase file load),
        // we should probably populate YMap with local content?
        // But if YMap has content, we should overwrite local?

        // This conflict (Supabase persistence vs Yjs persistence) is tricky.
        // For this task, we assume Yjs is the source of truth for "Live" session.
        // But `Canvas.tsx` loads from Supabase.

        // Strategy:
        // 1. `Canvas.tsx` loads Supabase data into 'initial snapshot'.
        // 2. We pass that snapshot to `createTLStore`?
        // 3. Or `store.loadSnapshot`?

        // If we use Yjs, we should probably SKIP Supabase load inside `Canvas.tsx` if Yjs is connected?
        // OR sync Supabase content INTO Yjs if Yjs is empty.

        return () => {
            unlistenStore();
            yMap.unobserve(observer);
            wsProvider.disconnect();
            yDoc.destroy();
        };
    }, [roomId, hostUrl, store]);

    return { store, status };
}
