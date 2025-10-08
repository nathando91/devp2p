import { EventEmitter } from 'eventemitter3';
import { DNS } from '../dns/index.ts';
import { BanList } from './ban-list.ts';
import { KBucket } from './kbucket.ts';
import { Server as DPTServer } from './server.ts';
import type { DPTEvent, DPTOptions, PeerInfo } from '../types.ts';
export declare class DPT {
    events: EventEmitter<DPTEvent>;
    protected _privateKey: Uint8Array;
    protected _banlist: BanList;
    protected _dns: DNS;
    private _debug;
    readonly id: Uint8Array | undefined;
    protected _kbucket: KBucket;
    protected _server: DPTServer;
    protected _refreshIntervalId: NodeJS.Timeout;
    protected _refreshIntervalSelectionCounter: number;
    protected _shouldFindNeighbours: boolean;
    protected _shouldGetDnsPeers: boolean;
    protected _dnsRefreshQuantity: number;
    protected _dnsNetworks: string[];
    protected _dnsAddr: string;
    protected _onlyConfirmed: boolean;
    protected _confirmedPeers: Set<string>;
    protected _keccakFunction: (msg: Uint8Array) => Uint8Array;
    private DEBUG;
    constructor(privateKey: Uint8Array, options: DPTOptions);
    bind(...args: any[]): void;
    destroy(...args: any[]): void;
    _onKBucketPing(oldPeers: PeerInfo[], newPeer: PeerInfo): void;
    _addPeerBatch(peers: PeerInfo[]): void;
    bootstrap(peer: PeerInfo): Promise<void>;
    addPeer(obj: PeerInfo): Promise<PeerInfo>;
    /**
     * Add peer to a confirmed list of peers (peers meeting some
     * level of quality, e.g. being on the same network) to allow
     * for a more selective findNeighbours request and sending
     * (with activated `onlyConfirmed` setting)
     *
     * @param id Unprefixed hex id
     */
    confirmPeer(id: string): void;
    getPeer(obj: string | Uint8Array | PeerInfo): PeerInfo | null;
    getPeers(): PeerInfo[];
    numPeers(): number;
    getClosestPeers(id: Uint8Array): PeerInfo[];
    removePeer(obj: string | PeerInfo | Uint8Array): void;
    banPeer(obj: string | PeerInfo | Uint8Array, maxAge?: number): void;
    getDnsPeers(): Promise<PeerInfo[]>;
    refresh(): Promise<void>;
}
//# sourceMappingURL=dpt.d.ts.map