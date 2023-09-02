"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Member {
    constructor(username, role, password, postalcode, bloodtype, age, weight) {
        this.username = username;
        this.role = role;
        this.password = password;
        this.postalcode = postalcode;
        this.bloodtype = bloodtype;
        this.age = age;
        this.weight = weight;
    }
}
exports.default = Member;
