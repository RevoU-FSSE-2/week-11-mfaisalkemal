"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const memberModels_1 = __importDefault(require("../models/memberModels"));
const database_1 = require("../models/database");
const saltRounds = 10;
const secretKey = '17-belas-agustus-tahun-empat-5-itulah-hari-kemerdekaan-KITA';
const register = async (req, res) => {
    try {
        const { username, role, password, postalcode, bloodtype, age, weight } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const member = new memberModels_1.default(username, role, hashedPassword, postalcode, bloodtype, age, weight);
        const db = (0, database_1.getDb)();
        const userName = await db.collection('members').distinct('username');
        let i;
        let counter = 0;
        if (userName.length == 0) {
            await db.collection('members').insertOne(member);
        }
        for (i = 0; i < userName.length; i++) {
            if (userName[i] == member.username) {
                return res.status(409).json({ error: 'Username already exist.' });
                break;
            }
            else {
                counter++;
            }
            if (counter == userName.length) {
                await db.collection('members').insertOne(member);
            }
        }
        res.status(201).json({ message: 'Member registered successfully.' });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while registering.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = (0, database_1.getDb)();
        const memberData = await db.collection('members').findOne({ username });
        if (!memberData) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, memberData.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }
        const token = jsonwebtoken_1.default.sign({ username: memberData.username, role: memberData.role, bloodtype: memberData.bloodtype }, secretKey);
        res.status(200).json({ token });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
};
exports.login = login;
