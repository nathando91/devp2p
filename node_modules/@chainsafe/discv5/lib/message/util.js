import { MessageType } from "./types.js";
export function requestMatchesResponse(req, res) {
    switch (req.type) {
        case MessageType.PING:
            return res.type === MessageType.PONG;
        case MessageType.FINDNODE:
            return res.type === MessageType.NODES;
        case MessageType.REGTOPIC:
            return res.type === MessageType.TICKET;
        case MessageType.TALKREQ:
            return res.type === MessageType.TALKRESP;
        default:
            return false;
    }
}
//# sourceMappingURL=util.js.map