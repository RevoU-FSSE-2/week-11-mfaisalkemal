"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTransfers = exports.updateTransferStatus = exports.transfer = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../models/database");
const transferModels_1 = __importDefault(require("../models/transferModels"));
const mongodb_1 = require("mongodb");
const class_transformer_1 = require("class-transformer");
const tokenModels_1 = __importDefault(require("../models/tokenModels"));
const saltRounds = 10;
const secretKey = 'TUJUH-belas-agustus-tahun-45-itulah-hari-kemerdekaan-KITA';
const transfer = async (req, res) => {
    try {
        const { amount, currency, sourceAccount, destinationAccount } = req.body;
        console.log(req.headers.authorization);
        const token = req.headers.authorization + " ";
        const tokenSliced = token === null || token === void 0 ? void 0 : token.slice(7, -1);
        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }
        jsonwebtoken_1.default.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }
            const status = 'pending';
            const createdAt = new Date();
            const transfer = new transferModels_1.default(amount, currency, sourceAccount, destinationAccount, status, createdAt);
            const db = (0, database_1.getDb)();
            await db.collection('transfers').insertOne(transfer);
            res.status(201).json({ message: 'Transfer initiated successfully.' });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while initiating the transfer.' });
    }
};
exports.transfer = transfer;
const updateTransferStatus = async (req, res) => {
    try {
        const transferId = req.params.id;
        const newStatus = req.body.status;
        const token = req.headers.authorization + " ";
        const tokenSliced = token === null || token === void 0 ? void 0 : token.slice(7, -1);
        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }
        jsonwebtoken_1.default.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }
            ;
            const loadedToken = (0, class_transformer_1.plainToClass)(tokenModels_1.default, decoded);
            if (loadedToken.role !== 'approver') {
                return res.status(403).json({ error: 'Permission denied. Only approvers can change status.' });
            }
            const db = (0, database_1.getDb)();
            const result = await db.collection('transfers').updateOne({ _id: new mongodb_1.ObjectId(transferId), status: 'pending' }, { $set: { status: newStatus, updatedAt: new Date() } });
            if (result.modifiedCount === 1) {
                res.status(200).json({ message: 'Transfer status updated successfully.' });
            }
            else {
                res.status(404).json({ error: 'Transfer not found or status is not pending.' });
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while updating transfer status.' });
    }
};
exports.updateTransferStatus = updateTransferStatus;
const getAllTransfers = async (req, res) => {
    try {
        const token = req.headers.authorization + " ";
        const tokenSliced = token === null || token === void 0 ? void 0 : token.slice(7, -1);
        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }
        jsonwebtoken_1.default.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }
            const loadedToken = (0, class_transformer_1.plainToClass)(tokenModels_1.default, decoded);
            if (loadedToken.role !== 'maker' && loadedToken.role !== 'approver') {
                return res.status(403).json({ error: 'Permission denied. Only makers and approvers can access.' });
            }
            const db = (0, database_1.getDb)();
            const transfers = await db.collection('transfers').find({}).toArray();
            const transfersWithLocalTime = transfers.map(transfer => {
                const createdAtLocalTime = new Date(transfer.createdAt).toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
                const updatedAtLocalTime = transfer.updatedAt ? new Date(transfer.updatedAt).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }) : null;
                return { ...transfer, createdAtLocalTime, updatedAtLocalTime, createdAt: undefined, updatedAt: undefined };
            });
            res.status(200).json(transfersWithLocalTime);
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching transfers.' });
    }
};
exports.getAllTransfers = getAllTransfers;
