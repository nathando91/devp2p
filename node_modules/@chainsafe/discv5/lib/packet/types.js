// DISCV5 message packet types
export var PacketType;
(function (PacketType) {
    /**
     * Ordinary message packet
     */
    PacketType[PacketType["Message"] = 0] = "Message";
    /**
     * Sent when the recipient of an ordinary message packet cannot decrypt/authenticate the packet's message
     */
    PacketType[PacketType["WhoAreYou"] = 1] = "WhoAreYou";
    /**
     * Sent following a WHOAREYOU.
     * These packets establish a new session and carry handshake related data
     * in addition to the encrypted/authenticated message
     */
    PacketType[PacketType["Handshake"] = 2] = "Handshake";
})(PacketType || (PacketType = {}));
//# sourceMappingURL=types.js.map