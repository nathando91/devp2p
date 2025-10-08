import type { PeerInfo } from '../types.ts';
export declare class BanList {
    private _lru;
    private DEBUG;
    constructor();
    add(obj: string | Uint8Array | PeerInfo, maxAge?: number): void;
    has(obj: string | Uint8Array | PeerInfo): boolean;
}
//# sourceMappingURL=ban-list.d.ts.map