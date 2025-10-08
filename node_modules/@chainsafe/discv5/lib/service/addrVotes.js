const MAX_VOTES = 200;
export class AddrVotes {
    addrVotesToUpdateEnr;
    /** Bounded by `MAX_VOTES`, on new votes evicts the oldest votes */
    votes = new Map();
    /** Bounded by votes, if the vote count reaches 0, its key is deleted */
    tallies = new Map();
    constructor(addrVotesToUpdateEnr) {
        this.addrVotesToUpdateEnr = addrVotesToUpdateEnr;
    }
    /**
     * Adds vote to a given IP:port tuple from a Pong message. If the votes for this addr are greater than `votesToWin`,
     * @returns true if the added vote is the winning vote. In that case clears all existing votes.
     */
    addVote(voter, ip) {
        const socketAddrStr = serializeSocketAddr(ip);
        const prevVote = this.votes.get(voter);
        if (prevVote?.socketAddrStr === socketAddrStr) {
            // Same vote, ignore
            return false;
        }
        else if (prevVote !== undefined) {
            // If there was a previous vote, remove from tally
            const prevVoteTally = (this.tallies.get(prevVote.socketAddrStr) ?? 0) - 1;
            if (prevVoteTally <= 0) {
                this.tallies.delete(prevVote.socketAddrStr);
            }
            else {
                this.tallies.set(prevVote.socketAddrStr, prevVoteTally);
            }
        }
        const currentTally = (this.tallies.get(socketAddrStr) ?? 0) + 1;
        // Conclude vote period if there are enough votes for an option
        if (currentTally >= this.addrVotesToUpdateEnr) {
            // If enough peers vote the same conclude the vote
            this.clear();
            return true;
        }
        // Persist vote
        this.tallies.set(socketAddrStr, currentTally);
        this.votes.set(voter, { socketAddrStr: socketAddrStr, unixTsMs: Date.now() });
        // If there are too many votes, remove the oldest
        if (this.votes.size > MAX_VOTES) {
            for (const vote of this.votes.keys()) {
                this.votes.delete(vote);
                if (this.votes.size <= MAX_VOTES) {
                    break;
                }
            }
        }
        return false;
    }
    clear() {
        this.votes.clear();
        this.tallies.clear();
    }
}
/** Arbitrary serialization of SocketAddr, used only to tally votes */
function serializeSocketAddr(addr) {
    return `${addr.ip.type}-${Buffer.from(addr.ip.octets).toString("hex")}:${addr.port}`;
}
//# sourceMappingURL=addrVotes.js.map