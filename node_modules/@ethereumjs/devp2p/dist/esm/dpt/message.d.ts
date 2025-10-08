import type { Common } from '@ethereumjs/common';
export declare function encode<T>(typename: string, data: T, privateKey: Uint8Array, common?: Common): Uint8Array<ArrayBufferLike>;
export declare function decode(bytes: Uint8Array, common?: Common): {
    typename: string | number;
    data: any;
    publicKey: Uint8Array<ArrayBufferLike>;
};
//# sourceMappingURL=message.d.ts.map