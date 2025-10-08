import { Protocol } from './protocol.ts';
import type { Peer } from '../rlpx/peer.ts';
import type { SendMethod } from '../types.ts';
export declare const SnapMessageCodes: {
    readonly GET_ACCOUNT_RANGE: 0;
    readonly ACCOUNT_RANGE: 1;
    readonly GET_STORAGE_RANGES: 2;
    readonly STORAGE_RANGES: 3;
    readonly GET_BYTE_CODES: 4;
    readonly BYTE_CODES: 5;
    readonly GET_TRIE_NODES: 6;
    readonly TRIE_NODES: 7;
};
export type SnapMessageCodes = (typeof SnapMessageCodes)[keyof typeof SnapMessageCodes];
export declare const SnapMessageCodeNames: {
    [key in SnapMessageCodes]: string;
};
export declare class SNAP extends Protocol {
    private DEBUG;
    constructor(version: number, peer: Peer, send: SendMethod);
    static snap: {
        name: string;
        version: number;
        length: number;
        constructor: typeof SNAP;
    };
    _handleMessage(code: SnapMessageCodes, data: Uint8Array): void;
    sendStatus(): void;
    /**
     *
     * @param code Message code
     * @param payload Payload (including reqId, e.g. `[1, [437000, 1, 0, 0]]`)
     */
    sendMessage(code: SnapMessageCodes, payload: any): void;
    getMsgPrefix(msgCode: SnapMessageCodes): string;
    getVersion(): number;
}
//# sourceMappingURL=snap.d.ts.map