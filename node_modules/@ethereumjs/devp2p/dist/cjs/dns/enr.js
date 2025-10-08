"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENR = void 0;
const rlp_1 = require("@ethereumjs/rlp");
const util_1 = require("@ethereumjs/util");
const base_1 = require("@scure/base");
const keccak_js_1 = require("ethereum-cryptography/keccak.js");
const secp256k1_compat_js_1 = require("ethereum-cryptography/secp256k1-compat.js");
const scanf_1 = require("scanf");
const util_ts_1 = require("../util.js");
// Copied over from the multiaddr repo: https://github.com/multiformats/js-multiaddr/blob/main/src/convert.ts
function bytesToPort(bytes) {
    const view = new DataView(bytes.buffer);
    return view.getUint16(bytes.byteOffset);
}
class ENR {
    /**
     * Converts an Ethereum Name Record (EIP-778) string into a PeerInfo object after validating
     * its signature component with the public key encoded in the record itself.
     *
     * The record components are:
     * > signature: cryptographic signature of record contents
     * > seq: The sequence number, a 64-bit unsigned integer which increases whenever
     *        the record changes and is republished.
     * > A set of arbitrary key/value pairs
     *
     * @param  {string}   enr
     * @return {PeerInfo}
     */
    static parseAndVerifyRecord(enr, common) {
        if (!enr.startsWith(this.RECORD_PREFIX))
            throw (0, util_1.EthereumJSErrorWithoutCode)(`String encoded ENR must start with '${this.RECORD_PREFIX}'`);
        // ENRs are RLP encoded and written to DNS TXT entries as base64 url-safe strings respectively
        // RawURLEncoding, which is the unpadded alternate base64 encoding defined in RFC 4648
        // Records need to prepared like the following: replace - wth +, replace _ with / and add padding
        let enrMod = enr.slice(this.RECORD_PREFIX.length);
        enr = enrMod.replace('-', '+').replace('_', '/');
        while (enrMod.length % 4 !== 0) {
            enrMod = enrMod + '=';
        }
        const base64BytesEnr = base_1.base64url.decode(enrMod);
        const decoded = rlp_1.RLP.decode(base64BytesEnr);
        const [signature, seq, ...kvs] = decoded;
        // Convert ENR key/value pairs to object
        const obj = {};
        for (let i = 0; i < kvs.length; i += 2) {
            obj[(0, util_1.bytesToUtf8)(kvs[i])] = kvs[i + 1];
        }
        // Validate sig
        const isVerified = (0, secp256k1_compat_js_1.ecdsaVerify)(signature, (common?.customCrypto.keccak256 ?? keccak_js_1.keccak256)(rlp_1.RLP.encode([seq, ...kvs])), obj.secp256k1);
        if (!isVerified)
            throw (0, util_1.EthereumJSErrorWithoutCode)('Unable to verify ENR signature');
        const peerInfo = {
            address: (0, util_ts_1.ipToString)(obj.ip),
            tcpPort: bytesToPort(obj.tcp),
            udpPort: bytesToPort(obj.udp),
        };
        return peerInfo;
    }
    /**
     * Extracts the branch subdomain referenced by a DNS tree root string after verifying
     * the root record signature with its base32 compressed public key. Geth's top level DNS
     * domains and their public key can be found in: go-ethereum/params/bootnodes
     *
     * @param  {string} root  (See EIP-1459 for encoding details)
     * @return {string} subdomain subdomain to retrieve branch records from.
     */
    static parseAndVerifyRoot(root, publicKey, common) {
        if (!root.startsWith(this.ROOT_PREFIX))
            throw (0, util_1.EthereumJSErrorWithoutCode)(`ENR root entry must start with '${this.ROOT_PREFIX}'`);
        const rootValues = (0, scanf_1.sscanf)(root, `${this.ROOT_PREFIX}v1 e=%s l=%s seq=%d sig=%s`, 'eRoot', 'lRoot', 'seq', 'signature');
        if (!rootValues.eRoot)
            throw (0, util_1.EthereumJSErrorWithoutCode)("Could not parse 'e' value from ENR root entry");
        if (!rootValues.lRoot)
            throw (0, util_1.EthereumJSErrorWithoutCode)("Could not parse 'l' value from ENR root entry");
        if (!rootValues.seq)
            throw (0, util_1.EthereumJSErrorWithoutCode)("Could not parse 'seq' value from ENR root entry");
        if (!rootValues.signature)
            throw (0, util_1.EthereumJSErrorWithoutCode)("Could not parse 'sig' value from ENR root entry");
        const decodedPublicKey = [...base_1.base32.decode(publicKey + '===').values()];
        // The signature is a 65-byte secp256k1 over the keccak256 hash
        // of the record content, excluding the `sig=` part, encoded as URL-safe base64 string
        // (Trailing recovery bit must be trimmed to pass `ecdsaVerify` method)
        const signedComponent = root.split(' sig')[0];
        const signedComponentBytes = (0, util_1.utf8ToBytes)(signedComponent);
        const signatureBytes = Uint8Array.from([...base_1.base64url.decode(rootValues.signature + '=').values()].slice(0, 64));
        const keyBytes = Uint8Array.from(decodedPublicKey);
        const isVerified = (0, secp256k1_compat_js_1.ecdsaVerify)(signatureBytes, (common?.customCrypto.keccak256 ?? keccak_js_1.keccak256)(signedComponentBytes), keyBytes);
        if (!isVerified)
            throw (0, util_1.EthereumJSErrorWithoutCode)('Unable to verify ENR root signature');
        return rootValues.eRoot;
    }
    /**
     * Returns the public key and top level domain of an ENR tree entry.
     * The domain is the starting point for traversing a set of linked DNS TXT records
     * and the public key is used to verify the root entry record
     *
     * @param  {string}        tree (See EIP-1459 )
     * @return {ENRTreeValues}
     */
    static parseTree(tree) {
        if (!tree.startsWith(this.TREE_PREFIX))
            throw (0, util_1.EthereumJSErrorWithoutCode)(`ENR tree entry must start with '${this.TREE_PREFIX}'`);
        const treeValues = (0, scanf_1.sscanf)(tree, `${this.TREE_PREFIX}//%s@%s`, 'publicKey', 'domain');
        if (!treeValues.publicKey)
            throw (0, util_1.EthereumJSErrorWithoutCode)('Could not parse public key from ENR tree entry');
        if (!treeValues.domain)
            throw (0, util_1.EthereumJSErrorWithoutCode)('Could not parse domain from ENR tree entry');
        return treeValues;
    }
    /**
     * Returns subdomains listed in an ENR branch entry. These in turn lead to
     * either further branch entries or ENR records.
     * @param  {string}   branch
     * @return {string[]}
     */
    static parseBranch(branch) {
        if (!branch.startsWith(this.BRANCH_PREFIX))
            throw (0, util_1.EthereumJSErrorWithoutCode)(`ENR branch entry must start with '${this.BRANCH_PREFIX}'`);
        return branch.split(this.BRANCH_PREFIX)[1].split(',');
    }
}
exports.ENR = ENR;
ENR.RECORD_PREFIX = 'enr:';
ENR.TREE_PREFIX = 'enrtree:';
ENR.BRANCH_PREFIX = 'enrtree-branch:';
ENR.ROOT_PREFIX = 'enrtree-root:';
//# sourceMappingURL=enr.js.map