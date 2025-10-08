import { Protocol } from './protocol.ts';
import type { Input } from '@ethereumjs/rlp';
import type { Peer } from '../rlpx/peer.ts';
import type { SendMethod } from '../types.ts';
export interface EthStatusMsg extends Array<Uint8Array | Uint8Array[]> {
}
export type EthStatusOpts = {
    td: Uint8Array;
    bestHash: Uint8Array;
    latestBlock?: Uint8Array;
    genesisHash: Uint8Array;
};
export declare const EthMessageCodes: {
    readonly STATUS: 0;
    readonly NEW_BLOCK_HASHES: 1;
    readonly TX: 2;
    readonly GET_BLOCK_HEADERS: 3;
    readonly BLOCK_HEADERS: 4;
    readonly GET_BLOCK_BODIES: 5;
    readonly BLOCK_BODIES: 6;
    readonly NEW_BLOCK: 7;
    readonly GET_NODE_DATA: 13;
    readonly NODE_DATA: 14;
    readonly GET_RECEIPTS: 15;
    readonly RECEIPTS: 16;
    readonly NEW_POOLED_TRANSACTION_HASHES: 8;
    readonly GET_POOLED_TRANSACTIONS: 9;
    readonly POOLED_TRANSACTIONS: 10;
};
export type EthMessageCodes = (typeof EthMessageCodes)[keyof typeof EthMessageCodes];
export declare const EthMessageCodeNames: {
    [key in EthMessageCodes]: string;
};
export declare class ETH extends Protocol {
    protected _status: EthStatusMsg | null;
    protected _peerStatus: EthStatusMsg | null;
    private DEBUG;
    protected _hardfork: string;
    protected _latestBlock: bigint;
    protected _forkHash: string;
    protected _nextForkBlock: bigint;
    constructor(version: number, peer: Peer, send: SendMethod);
    static eth62: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth63: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth64: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth65: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth66: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth67: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    static eth68: {
        name: string;
        version: number;
        length: number;
        constructor: typeof ETH;
    };
    _handleMessage(code: EthMessageCodes, data: Uint8Array): void;
    /**
     * Eth 64 Fork ID validation (EIP-2124)
     * @param forkId Remote fork ID
     */
    _validateForkId(forkId: Uint8Array[]): void;
    _handleStatus(): void;
    getVersion(): number;
    _forkHashFromForkId(forkId: Uint8Array): string;
    _nextForkFromForkId(forkId: Uint8Array): number;
    _getStatusString(status: EthStatusMsg): string;
    sendStatus(status: EthStatusOpts): void;
    sendMessage(code: EthMessageCodes, payload: Input): void;
    getMsgPrefix(msgCode: EthMessageCodes): string;
}
//# sourceMappingURL=eth.d.ts.map