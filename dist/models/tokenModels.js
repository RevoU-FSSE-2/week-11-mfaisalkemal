"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Token {
    constructor(username, role, postalcode, bloodtype, iat, exp) {
        this.username = username;
        this.role = role;
        this.postalcode = postalcode;
        this.bloodtype = bloodtype;
        this.iat = iat;
        this.exp = exp;
    }
}
exports.default = Token;
