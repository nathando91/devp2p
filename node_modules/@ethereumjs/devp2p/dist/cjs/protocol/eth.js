"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETH = exports.EthMessageCodeNames = exports.EthMessageCodes = void 0;
const rlp_1 = require("@ethereumjs/rlp");
const util_1 = require("@ethereumjs/util");
const snappy = require("snappyjs");
const types_ts_1 = require("../types.js");
const util_ts_1 = require("../util.js");
const protocol_ts_1 = require("./protocol.js");
exports.EthMessageCodes = {
    // eth62
    STATUS: 0x00,
    NEW_BLOCK_HASHES: 0x01,
    TX: 0x02,
    GET_BLOCK_HEADERS: 0x03,
    BLOCK_HEADERS: 0x04,
    GET_BLOCK_BODIES: 0x05,
    BLOCK_BODIES: 0x06,
    NEW_BLOCK: 0x07,
    // eth63
    GET_NODE_DATA: 0x0d,
    NODE_DATA: 0x0e,
    GET_RECEIPTS: 0x0f,
    RECEIPTS: 0x10,
    // eth65
    NEW_POOLED_TRANSACTION_HASHES: 0x08,
    GET_POOLED_TRANSACTIONS: 0x09,
    POOLED_TRANSACTIONS: 0x0a,
};
// Create a reverse mapping: from numeric value back to the key name
exports.EthMessageCodeNames = Object.entries(exports.EthMessageCodes).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});
class ETH extends protocol_ts_1.Protocol {
    constructor(version, peer, send) {
        super(peer, send, types_ts_1.ProtocolType.ETH, version, exports.EthMessageCodes);
        this._status = null;
        this._peerStatus = null;
        this.DEBUG = false;
        // Eth64
        this._hardfork = 'chainstart';
        this._latestBlock = util_1.BIGINT_0;
        this._forkHash = '';
        this._nextForkBlock = util_1.BIGINT_0;
        // Set forkHash and nextForkBlock
        if (this._version >= 64) {
            const c = this._peer.common;
            this._hardfork = c.hardfork() ?? this._hardfork;
            // Set latestBlock minimally to start block of fork to have some more
            // accurate basis if no latestBlock is provided along status send
            this._latestBlock = c.hardforkBlock(this._hardfork) ?? util_1.BIGINT_0;
            this._forkHash = c.forkHash(this._hardfork);
            // Next fork block number or 0 if none available
            this._nextForkBlock = c.nextHardforkBlockOrTimestamp(this._hardfork) ?? util_1.BIGINT_0;
        }
        // Skip DEBUG calls unless 'ethjs' included in environmental DEBUG variables
        this.DEBUG = process?.env?.DEBUG?.includes('ethjs') ?? false;
    }
    _handleMessage(code, data) {
        const payload = rlp_1.RLP.decode(data);
        if (code !== exports.EthMessageCodes.STATUS && this.DEBUG) {
            const debugMsg = this.DEBUG
                ? `Received ${this.getMsgPrefix(code)} message from ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort}`
                : undefined;
            const logData = (0, util_ts_1.formatLogData)((0, util_1.bytesToHex)(data), this._verbose);
            this.debug(this.getMsgPrefix(code), `${debugMsg}: ${logData}`);
        }
        switch (code) {
            case exports.EthMessageCodes.STATUS: {
                (0, util_ts_1.assertEq)(this._peerStatus, null, 'Uncontrolled status message', this.debug.bind(this), 'STATUS');
                this._peerStatus = payload;
                const peerStatusMsg = `${this._peerStatus !== undefined ? this._getStatusString(this._peerStatus) : ''}`;
                if (this.DEBUG) {
                    const debugMsg = this.DEBUG
                        ? `Received ${this.getMsgPrefix(code)} message from ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort}`
                        : undefined;
                    this.debug(this.getMsgPrefix(code), `${debugMsg}: ${peerStatusMsg}`);
                }
                this._handleStatus();
                break;
            }
            case exports.EthMessageCodes.NEW_BLOCK_HASHES:
            case exports.EthMessageCodes.TX:
            case exports.EthMessageCodes.GET_BLOCK_HEADERS:
            case exports.EthMessageCodes.BLOCK_HEADERS:
            case exports.EthMessageCodes.GET_BLOCK_BODIES:
            case exports.EthMessageCodes.BLOCK_BODIES:
            case exports.EthMessageCodes.NEW_BLOCK:
                if (this._version >= ETH.eth62.version)
                    break;
                return;
            case exports.EthMessageCodes.GET_RECEIPTS:
            case exports.EthMessageCodes.RECEIPTS:
                if (this._version >= ETH.eth63.version)
                    break;
                return;
            case exports.EthMessageCodes.NEW_POOLED_TRANSACTION_HASHES:
            case exports.EthMessageCodes.GET_POOLED_TRANSACTIONS:
            case exports.EthMessageCodes.POOLED_TRANSACTIONS:
                if (this._version >= ETH.eth65.version)
                    break;
                return;
            case exports.EthMessageCodes.GET_NODE_DATA:
            case exports.EthMessageCodes.NODE_DATA:
                if (this._version >= ETH.eth63.version && this._version <= ETH.eth66.version)
                    break;
                return;
            default:
                return;
        }
        this.events.emit('message', code, payload);
    }
    /**
     * Eth 64 Fork ID validation (EIP-2124)
     * @param forkId Remote fork ID
     */
    _validateForkId(forkId) {
        const c = this._peer.common;
        const peerForkHash = (0, util_1.bytesToHex)(forkId[0]);
        const peerNextFork = (0, util_1.bytesToBigInt)(forkId[1]);
        if (this._forkHash === peerForkHash) {
            // There is a known next fork
            if (peerNextFork > util_1.BIGINT_0) {
                if (this._latestBlock >= peerNextFork) {
                    const msg = 'Remote is advertising a future fork that passed locally';
                    if (this.DEBUG) {
                        this.debug('STATUS', msg);
                    }
                    throw (0, util_1.EthereumJSErrorWithoutCode)(msg);
                }
            }
        }
        const peerFork = c.hardforkForForkHash(peerForkHash);
        if (peerFork === null) {
            const msg = 'Unknown fork hash';
            if (this.DEBUG) {
                this.debug('STATUS', msg);
            }
            throw (0, util_1.EthereumJSErrorWithoutCode)(msg);
        }
        if (!c.hardforkGteHardfork(peerFork.name, this._hardfork)) {
            const nextHardforkBlock = c.nextHardforkBlockOrTimestamp(peerFork.name);
            if (peerNextFork === null ||
                nextHardforkBlock === null ||
                nextHardforkBlock !== peerNextFork) {
                const msg = 'Outdated fork status, remote needs software update';
                if (this.DEBUG) {
                    this.debug('STATUS', msg);
                }
                throw (0, util_1.EthereumJSErrorWithoutCode)(msg);
            }
        }
    }
    _handleStatus() {
        if (this._status === null || this._peerStatus === null)
            return;
        clearTimeout(this._statusTimeoutId);
        (0, util_ts_1.assertEq)(this._status[0], this._peerStatus[0], 'Protocol version mismatch', this.debug.bind(this), 'STATUS');
        (0, util_ts_1.assertEq)(this._status[1], this._peerStatus[1], 'NetworkId mismatch', this.debug.bind(this), 'STATUS');
        (0, util_ts_1.assertEq)(this._status[4], this._peerStatus[4], 'Genesis block mismatch', this.debug.bind(this), 'STATUS');
        const status = {
            chainId: this._peerStatus[1],
            td: this._peerStatus[2],
            bestHash: this._peerStatus[3],
            genesisHash: this._peerStatus[4],
            forkId: undefined,
        };
        if (this._version >= 64) {
            (0, util_ts_1.assertEq)(this._peerStatus[5].length, 2, 'Incorrect forkId msg format', this.debug.bind(this), 'STATUS');
            this._validateForkId(this._peerStatus[5]);
            status.forkId = this._peerStatus[5];
        }
        this.events.emit('status', status);
        if (this._firstPeer === '') {
            this._addFirstPeerDebugger();
        }
    }
    getVersion() {
        return this._version;
    }
    _forkHashFromForkId(forkId) {
        return (0, util_1.bytesToUnprefixedHex)(forkId);
    }
    _nextForkFromForkId(forkId) {
        return (0, util_1.bytesToInt)(forkId);
    }
    _getStatusString(status) {
        let sStr = `[V:${(0, util_1.bytesToInt)(status[0])}, NID:${(0, util_1.bytesToInt)(status[1])}, TD:${status[2].length === 0 ? 0 : (0, util_1.bytesToBigInt)(status[2]).toString()}`;
        sStr += `, BestH:${(0, util_ts_1.formatLogId)((0, util_1.bytesToHex)(status[3]), this._verbose)}, GenH:${(0, util_ts_1.formatLogId)((0, util_1.bytesToHex)(status[4]), this._verbose)}`;
        if (this._version >= 64) {
            sStr += `, ForkHash: ${status[5] !== undefined ? (0, util_1.bytesToHex)(status[5][0]) : '-'}`;
            sStr += `, ForkNext: ${status[5][1].length > 0 ? (0, util_1.bytesToHex)(status[5][1]) : '-'}`;
        }
        sStr += `]`;
        return sStr;
    }
    sendStatus(status) {
        if (this._status !== null)
            return;
        this._status = [
            (0, util_1.intToBytes)(this._version),
            (0, util_1.bigIntToBytes)(this._peer.common.chainId()),
            status.td,
            status.bestHash,
            status.genesisHash,
        ];
        if (this._version >= 64) {
            if (status.latestBlock) {
                const latestBlock = (0, util_1.bytesToBigInt)(status.latestBlock);
                if (latestBlock < this._latestBlock) {
                    throw (0, util_1.EthereumJSErrorWithoutCode)('latest block provided is not matching the HF setting of the Common instance (Rlpx)');
                }
                this._latestBlock = latestBlock;
            }
            const forkHashB = (0, util_1.hexToBytes)((0, util_1.isHexString)(this._forkHash) ? this._forkHash : `0x${this._forkHash}`);
            const nextForkB = this._nextForkBlock === util_1.BIGINT_0 ? new Uint8Array() : (0, util_1.bigIntToBytes)(this._nextForkBlock);
            this._status.push([forkHashB, nextForkB]);
        }
        if (this.DEBUG) {
            this.debug('STATUS', `Send STATUS message to ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort} (eth${this._version}): ${this._getStatusString(this._status)}`);
        }
        let payload = rlp_1.RLP.encode(this._status);
        // Use snappy compression if peer supports DevP2P >=v5
        if (this._peer['_hello'] !== null && this._peer['_hello'].protocolVersion >= 5) {
            payload = snappy.compress(payload);
        }
        this._send(exports.EthMessageCodes.STATUS, payload);
        this._handleStatus();
    }
    sendMessage(code, payload) {
        if (this.DEBUG) {
            const logData = (0, util_ts_1.formatLogData)((0, util_1.bytesToHex)(rlp_1.RLP.encode(payload)), this._verbose);
            const messageName = this.getMsgPrefix(code);
            const debugMsg = `Send ${messageName} message to ${this._peer['_socket'].remoteAddress}:${this._peer['_socket'].remotePort}: ${logData}`;
            this.debug(messageName, debugMsg);
        }
        switch (code) {
            case exports.EthMessageCodes.STATUS:
                throw (0, util_1.EthereumJSErrorWithoutCode)('Please send status message through .sendStatus');
            case exports.EthMessageCodes.NEW_BLOCK_HASHES:
            case exports.EthMessageCodes.TX:
            case exports.EthMessageCodes.GET_BLOCK_HEADERS:
            case exports.EthMessageCodes.BLOCK_HEADERS:
            case exports.EthMessageCodes.GET_BLOCK_BODIES:
            case exports.EthMessageCodes.BLOCK_BODIES:
            case exports.EthMessageCodes.NEW_BLOCK:
                if (this._version >= ETH.eth62.version)
                    break;
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Code ${code} not allowed with version ${this._version}`);
            case exports.EthMessageCodes.GET_RECEIPTS:
            case exports.EthMessageCodes.RECEIPTS:
                if (this._version >= ETH.eth63.version)
                    break;
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Code ${code} not allowed with version ${this._version}`);
            case exports.EthMessageCodes.NEW_POOLED_TRANSACTION_HASHES:
            case exports.EthMessageCodes.GET_POOLED_TRANSACTIONS:
            case exports.EthMessageCodes.POOLED_TRANSACTIONS:
                if (this._version >= ETH.eth65.version)
                    break;
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Code ${code} not allowed with version ${this._version}`);
            case exports.EthMessageCodes.GET_NODE_DATA:
            case exports.EthMessageCodes.NODE_DATA:
                if (this._version >= ETH.eth63.version && this._version <= ETH.eth66.version)
                    break;
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Code ${code} not allowed with version ${this._version}`);
            default:
                throw (0, util_1.EthereumJSErrorWithoutCode)(`Unknown code ${code}`);
        }
        payload = rlp_1.RLP.encode(payload);
        // Use snappy compression if peer supports DevP2P >=v5
        if (this._peer['_hello'] !== null && this._peer['_hello'].protocolVersion >= 5) {
            payload = snappy.compress(payload);
        }
        this._send(code, payload);
    }
    getMsgPrefix(msgCode) {
        return exports.EthMessageCodeNames[msgCode];
    }
}
exports.ETH = ETH;
ETH.eth62 = { name: 'eth', version: 62, length: 8, constructor: ETH };
ETH.eth63 = { name: 'eth', version: 63, length: 17, constructor: ETH };
ETH.eth64 = { name: 'eth', version: 64, length: 17, constructor: ETH };
ETH.eth65 = { name: 'eth', version: 65, length: 17, constructor: ETH };
ETH.eth66 = { name: 'eth', version: 66, length: 17, constructor: ETH };
ETH.eth67 = { name: 'eth', version: 67, length: 17, constructor: ETH };
ETH.eth68 = { name: 'eth', version: 68, length: 17, constructor: ETH };
//# sourceMappingURL=eth.js.map