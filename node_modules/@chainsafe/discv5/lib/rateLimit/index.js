import { RateLimiterGRCA } from "./rateLimiterGRCA.js";
export class RateLimiter {
    metrics;
    rateLimiterGlobal;
    rateLimiterIP;
    bannedIPs = new Map();
    expectedResponsesByIP = new Map();
    constructor(opts, metrics) {
        this.metrics = metrics;
        this.rateLimiterGlobal = RateLimiterGRCA.fromQuota(opts.globalQuota);
        this.rateLimiterIP = RateLimiterGRCA.fromQuota(opts.byIPQuota);
    }
    allowEncodedPacket(ip) {
        if (this.bannedIPs.has(ip)) {
            return false;
        }
        if (this.expectsResponseFromIP(ip)) {
            return true;
        }
        if (!this.rateLimiterIP.allows(ip, 1)) {
            this.metrics?.rateLimitHitIP.inc();
            this.bannedIPs.set(ip, Date.now());
            return false;
        }
        if (!this.rateLimiterGlobal.allows(null, 1)) {
            this.metrics?.rateLimitHitTotal.inc();
            return false;
        }
        return true;
    }
    addExpectedResponse(ip) {
        this.expectedResponsesByIP.set(ip, (this.expectedResponsesByIP.get(ip) ?? 0) + 1);
    }
    removeExpectedResponse(ip) {
        const expectedResponses = this.expectedResponsesByIP.get(ip);
        if (expectedResponses !== undefined) {
            if (expectedResponses > 1) {
                this.expectedResponsesByIP.set(ip, expectedResponses - 1);
            }
            else {
                this.expectedResponsesByIP.delete(ip);
            }
        }
    }
    /** After a request initiated by us we expected a response from this IP */
    expectsResponseFromIP(ip) {
        return this.expectedResponsesByIP.has(ip);
    }
}
//# sourceMappingURL=index.js.map