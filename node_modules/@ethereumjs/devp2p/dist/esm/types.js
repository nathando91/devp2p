export const DISCONNECT_REASON = {
    DISCONNECT_REQUESTED: 0x00,
    NETWORK_ERROR: 0x01,
    PROTOCOL_ERROR: 0x02,
    USELESS_PEER: 0x03,
    TOO_MANY_PEERS: 0x04,
    ALREADY_CONNECTED: 0x05,
    INCOMPATIBLE_VERSION: 0x06,
    INVALID_IDENTITY: 0x07,
    CLIENT_QUITTING: 0x08,
    UNEXPECTED_IDENTITY: 0x09,
    SAME_IDENTITY: 0x0a,
    TIMEOUT: 0x0b,
    SUBPROTOCOL_ERROR: 0x10,
};
// Create a reverse mapping: numeric value -> key name
export const DisconnectReasonNames = Object.entries(DISCONNECT_REASON).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});
export const ProtocolType = {
    ETH: 'eth',
    SNAP: 'snap',
};
//# sourceMappingURL=types.js.map