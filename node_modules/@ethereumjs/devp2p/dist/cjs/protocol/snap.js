"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNAP = exports.SnapMessageCodeNames = exports.SnapMessageCodes = void 0;
const rlp_1 = require("@ethereumjs/rlp");
const util_1 = require("@ethereumjs/util");
const snappy = require("snappyjs");
const types_ts_1 = require("../types.js");
const util_ts_1 = require("../util.js");
const protocol_ts_1 = require("./protocol.js");
exports.SnapMessageCodes = {
    // snap1
    GET_ACCOUNT_RANGE: 0x00,
    ACCOUNT_RANGE: 0x01,
    GET_STORAGE_RANGES: 0x02,
    STORAGE_RANGES: 0x03,
    GET_BYTE_CODES: 0x04,
    BYTE_CODES: 0x05,
    GET_TRIE_NODES: 0x06,
    TRIE_NODES: 0x07,
};
// Create a reverse mapping: from numeric value back to the key name
exports.SnapMessageCodeNames = Object.entries(exports.SnapMessageCodes).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});
class SNAP extends protocol_ts_1.Protocol {
    constructor(version, peer, send) {
        super(peer, send, types_ts_1.ProtocolType.SNAP, version, exports.SnapMessageCodes);
        this.DEBUG =
            typeof window === 'undefined' ? (process?.env?.DEBUG?.includes('ethjs') ?? false) : false;
    }
    _handleMessage(code, data) {
        const payload = rlp_1.RLP.decode(data);
        // Note, this needs optimization, see issue #1882
        if (this.DEBUG) {
            this.debug(this.getMsgPrefix(code), `Received ${this.getMsgPrefix(code)} message from ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort}: ${(0, util_ts_1.formatLogData)((0, util_1.bytesToHex)(data), this._verbose)}`);
        }
        switch (code) {
            case exports.SnapMessageCodes.GET_ACCOUNT_RANGE:
            case exports.SnapMessageCodes.ACCOUNT_RANGE:
            case exports.SnapMessageCodes.GET_STORAGE_RANGES:
            case exports.SnapMessageCodes.STORAGE_RANGES:
            case exports.SnapMessageCodes.GET_BYTE_CODES:
            case exports.SnapMessageCodes.BYTE_CODES:
            case exports.SnapMessageCodes.GET_TRIE_NODES:
            case exports.SnapMessageCodes.TRIE_NODES:
                break;
            default:
                return;
        }
        this.events.emit('message', code, payload);
    }
    sendStatus() {
        throw Error('SNAP protocol does not support status handshake');
    }
    /**
     *
     * @param code Message code
     * @param payload Payload (including reqId, e.g. `[1, [437000, 1, 0, 0]]`)
     */
    sendMessage(code, payload) {
        if (this.DEBUG) {
            this.debug(this.getMsgPrefix(code), `Send ${this.getMsgPrefix(code)} message to ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort}: ${(0, util_ts_1.formatLogData)(rlp_1.utils.bytesToHex(rlp_1.RLP.encode(payload)), this._verbose)}`);
        }
        switch (code) {
            case exports.SnapMessageCodes.GET_ACCOUNT_RANGE:
            case exports.SnapMessageCodes.ACCOUNT_RANGE:
            case exports.SnapMessageCodes.GET_STORAGE_RANGES:
            case exports.SnapMessageCodes.STORAGE_RANGES:
            case exports.SnapMessageCodes.GET_BYTE_CODES:
            case exports.SnapMessageCodes.BYTE_CODES:
            case exports.SnapMessageCodes.GET_TRIE_NODES:
            case exports.SnapMessageCodes.TRIE_NODES:
                break;
            default:
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Unknown code ${code}`);
        }
        payload = rlp_1.RLP.encode(payload);
        // Use snappy compression if peer supports DevP2P >=v5
        const protocolVersion = this._peer['_hello']?.protocolVersion;
        if (protocolVersion !== undefined && protocolVersion >= 5) {
            payload = snappy.compress(payload);
        }
        this._send(code, payload);
    }
    getMsgPrefix(msgCode) {
        return exports.SnapMessageCodeNames[msgCode];
    }
    getVersion() {
        return this._version;
    }
}
exports.SNAP = SNAP;
SNAP.snap = { name: 'snap', version: 1, length: 8, constructor: SNAP };
//# sourceMappingURL=snap.js.map