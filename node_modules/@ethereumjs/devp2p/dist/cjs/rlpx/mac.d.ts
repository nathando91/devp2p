import { keccak256 } from 'ethereum-cryptography/keccak.js';
type Hash = ReturnType<typeof keccak256.create>;
export declare class MAC {
    protected _hash: Hash;
    protected _secret: Uint8Array;
    constructor(secret: Uint8Array);
    update(data: Uint8Array | string): void;
    updateHeader(data: Uint8Array | string): void;
    updateBody(data: Uint8Array | string): void;
    digest(): Uint8Array<ArrayBuffer>;
}
export {};
//# sourceMappingURL=mac.d.ts.map