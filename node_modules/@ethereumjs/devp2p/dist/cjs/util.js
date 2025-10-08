"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipToBytes = exports.isV6Format = exports.isV4Format = exports.ipToString = exports.Deferred = exports.devp2pDebug = void 0;
exports.genPrivateKey = genPrivateKey;
exports.pk2id = pk2id;
exports.id2pk = id2pk;
exports.zfill = zfill;
exports.xor = xor;
exports.assertEq = assertEq;
exports.formatLogId = formatLogId;
exports.formatLogData = formatLogData;
exports.createDeferred = createDeferred;
exports.unstrictDecode = unstrictDecode;
const rlp_1 = require("@ethereumjs/rlp");
const util_1 = require("@ethereumjs/util");
const debug_1 = require("debug");
const secp256k1_compat_js_1 = require("ethereum-cryptography/secp256k1-compat.js");
const secp256k1_js_1 = require("ethereum-cryptography/secp256k1.js");
// Do not use :# here, no logging without sub namespace occurring and current code structure
// otherwise creates loggers like `devp2p:#:eth`
exports.devp2pDebug = (0, debug_1.default)('devp2p');
function genPrivateKey() {
    const privateKey = secp256k1_js_1.secp256k1.utils.randomPrivateKey();
    return secp256k1_js_1.secp256k1.utils.isValidPrivateKey(privateKey) === true ? privateKey : genPrivateKey();
}
function pk2id(pk) {
    if (pk.length === 33) {
        pk = (0, secp256k1_compat_js_1.publicKeyConvert)(pk, false);
    }
    return pk.subarray(1);
}
function id2pk(id) {
    return (0, util_1.concatBytes)(Uint8Array.from([0x04]), id);
}
function zfill(bytes, size, leftpad = true) {
    if (bytes.length >= size)
        return bytes;
    if (leftpad === undefined)
        leftpad = true;
    const pad = new Uint8Array(size - bytes.length).fill(0x00);
    return leftpad ? (0, util_1.concatBytes)(pad, bytes) : (0, util_1.concatBytes)(bytes, pad);
}
function xor(a, b) {
    const length = Math.min(a.length, b.length);
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; ++i)
        bytes[i] = a[i] ^ b[i];
    return bytes;
}
function assertEq(expected, actual, msg, debug, messageName) {
    let fullMsg;
    if (expected instanceof Uint8Array && actual instanceof Uint8Array) {
        if ((0, util_1.equalsBytes)(expected, actual))
            return;
        fullMsg = `${msg}: ${(0, util_1.bytesToHex)(expected)} / ${(0, util_1.bytesToHex)(actual)}`;
        const debugMsg = `[ERROR] ${fullMsg}`;
        if (messageName !== undefined) {
            debug(messageName, debugMsg);
        }
        else {
            debug(debugMsg);
        }
        throw (0, util_1.EthereumJSErrorWithoutCode)(fullMsg);
    }
    if (expected === actual)
        return;
    fullMsg = `${msg}: ${expected} / ${actual}`;
    if (messageName !== undefined) {
        debug(messageName, fullMsg);
    }
    else {
        debug(fullMsg);
    }
    throw (0, util_1.EthereumJSErrorWithoutCode)(fullMsg);
}
function formatLogId(id, verbose) {
    const numChars = 7;
    if (verbose) {
        return id;
    }
    else {
        return `${id.substring(0, numChars)}`;
    }
}
function formatLogData(data, verbose) {
    const maxChars = 60;
    if (verbose || data.length <= maxChars) {
        return data;
    }
    else {
        return `${data.substring(0, maxChars)}...`;
    }
}
class Deferred {
    constructor() {
        this.resolve = () => { };
        this.reject = () => { };
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
exports.Deferred = Deferred;
function createDeferred() {
    return new Deferred();
}
function unstrictDecode(value) {
    // rlp library throws on remainder.length !== 0
    // this utility function bypasses that
    return rlp_1.RLP.decode(value, true).data;
}
/*************************** ************************************************************/
// Methods borrowed from `node-ip` by Fedor Indutny (https://github.com/indutny/node-ip)
// and modified to use Uint8Arrays instead of Buffers
const ipToString = (bytes, offset, length) => {
    offset = offset !== undefined ? ~~offset : 0;
    length = length ?? bytes.length - offset;
    const tempArray = [];
    let result = '';
    if (length === 4) {
        // IPv4
        for (let i = 0; i < length; i++) {
            tempArray.push(bytes[offset + i]);
        }
        result = tempArray.join('.');
    }
    else if (length === 16) {
        // IPv6
        for (let i = 0; i < length; i += 2) {
            tempArray.push(new DataView(bytes.buffer).getUint16(offset + i).toString(16));
        }
        result = tempArray.join(':');
        result = result.replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3');
        result = result.replace(/:{3,4}/, '::');
    }
    return result;
};
exports.ipToString = ipToString;
const ipv4Regex = /^(\d{1,3}\.){3,3}\d{1,3}$/;
const ipv6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;
const isV4Format = function (ip) {
    return ipv4Regex.test(ip);
};
exports.isV4Format = isV4Format;
const isV6Format = function (ip) {
    return ipv6Regex.test(ip);
};
exports.isV6Format = isV6Format;
const ipToBytes = (ip, bytes, offset = 0) => {
    offset = ~~offset;
    let result;
    if ((0, exports.isV4Format)(ip)) {
        result = bytes ?? new Uint8Array(offset + 4);
        ip.split(/\./g).map((byte) => {
            result[offset++] = parseInt(byte, 10) & 0xff;
        });
    }
    else if ((0, exports.isV6Format)(ip)) {
        const sections = ip.split(':', 8);
        let i;
        for (i = 0; i < sections.length; i++) {
            const isv4 = (0, exports.isV4Format)(sections[i]);
            let v4Bytes = new Uint8Array([]);
            if (isv4) {
                v4Bytes = (0, exports.ipToBytes)(sections[i]);
                sections[i] = (0, util_1.bytesToUnprefixedHex)(v4Bytes.subarray(0, 2));
            }
            if (v4Bytes.length > 0 && ++i < 8) {
                sections.splice(i, 0, (0, util_1.bytesToUnprefixedHex)(v4Bytes.subarray(2, 4)));
            }
        }
        if (sections[0] === '') {
            while (sections.length < 8)
                sections.unshift('0');
        }
        else if (sections[sections.length - 1] === '') {
            while (sections.length < 8)
                sections.push('0');
        }
        else if (sections.length < 8) {
            for (i = 0; i < sections.length && sections[i] !== ''; i++)
                ;
            const argv = [i, 1];
            for (i = 9 - sections.length; i > 0; i--) {
                argv.push('0');
            }
            // eslint-disable-next-line prefer-spread
            sections.splice.apply(sections, argv);
        }
        result = bytes ?? new Uint8Array(offset + 16);
        for (i = 0; i < sections.length; i++) {
            const word = parseInt(sections[i], 16);
            result[offset++] = (word >> 8) & 0xff;
            result[offset++] = word & 0xff;
        }
    }
    else {
        throw Error(`Invalid ip format: ${ip}`);
    }
    if (result === undefined) {
        throw Error(`Invalid ip address: ${ip}`);
    }
    return result;
};
exports.ipToBytes = ipToBytes;
/************  End of methods borrowed from `node-ip` ***************************/
//# sourceMappingURL=util.js.map