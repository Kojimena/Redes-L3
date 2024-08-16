/*
 {
    “type” : ”message|echo|info|hello|...”,
    “from” : ”foo@alumchat.lol/a1b2”,
    “to” : ”bar@alumchat.lol/c3d4”,
    “hops” : 3,
    “headers” : [{“opcional” : ”foo”}, {“otracosa” : ”bar”}, ...],
    “payload” : “loremipsum”
} 
 */

class message {
    constructor(type, from, to, hops, headers, payload) {
        this.type = type;
        this.from = from;
        this.to = to;
        this.hops = hops;
        this.headers = headers;
        this.payload = payload;
    }
}

module.exports = message;