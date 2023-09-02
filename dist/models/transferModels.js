"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Transfer {
    constructor(amount, currency, sourceAccount, destinationAccount, status, createdAt, updatedAt) {
        this.amount = amount;
        this.currency = currency;
        this.sourceAccount = sourceAccount;
        this.destinationAccount = destinationAccount;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.default = Transfer;
