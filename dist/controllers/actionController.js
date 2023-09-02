"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMember = exports.patchMember = exports.getAllMember = exports.getMembersBloodType = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../models/database");
const class_transformer_1 = require("class-transformer");
const tokenModels_1 = __importDefault(require("../models/tokenModels"));
const secretKey = process.env.SECRET_KEY_JWT || '';
const getMembersBloodType = async (req, res) => {
    try {
        const bloodType = req.body.bloodtype;
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
            if (loadedToken.role !== 'admin' && loadedToken.role !== 'member') {
                return res.status(403).json({ error: 'Permission denied. Only admin and member can access.' });
            }
            const query = { bloodtype: bloodType, username: { $ne: loadedToken.username } };
            const db = (0, database_1.getDb)();
            const members = await db.collection('members').find(query, { projection: { _id: 0, username: 1, postalcode: 1, bloodtype: 1 } }).toArray();
            const apiKey = process.env.BING_MAPS_KEY;
            const origin = loadedToken.postalcode;
            const destinations = members.map(member => member.postalcode);
            destinations.push(origin);
            async function fetchCoordinates(postalCode) {
                const locationURL = `https://dev.virtualearth.net/REST/v1/Locations?query=${postalCode}%20Indonesia&key=${apiKey}`;
                const response = await fetch(locationURL);
                const data = await response.json();
                return data;
            }
            async function fetchAllCoordinates() {
                const promises = destinations.map(postalCode => fetchCoordinates(postalCode));
                const results = await Promise.all(promises);
                return results;
            }
            async function getCoordinatesArray() {
                const results = await fetchAllCoordinates();
                const coordinatesArray = results.map(result => {
                    var _a, _b, _c;
                    const coordinates = ((_c = (_b = (_a = result.resourceSets[0]) === null || _a === void 0 ? void 0 : _a.resources[0]) === null || _b === void 0 ? void 0 : _b.point) === null || _c === void 0 ? void 0 : _c.coordinates) || null;
                    const [latitude, longitude] = coordinates || [null, null];
                    return { latitude, longitude };
                });
                return coordinatesArray;
            }
            getCoordinatesArray()
                .then(coordinatesArray => {
                const originCoordinate = coordinatesArray[coordinatesArray.length - 1];
                coordinatesArray.pop();
                async function getDistanceMatrix(latitudeA, longitudeA, latitudeB, longitudeB) {
                    const distanceMatrixURL = `https://dev.virtualearth.net/REST/v1/Routes/DistanceMatrix?origins=${latitudeA},${longitudeA}&destinations=${latitudeB},${longitudeB}&travelMode=driving&avoid=tolls,highways&key=${apiKey}`;
                    const response = await fetch(distanceMatrixURL);
                    const data = await response.json();
                    return data;
                }
                async function getDistancesFromOrigins() {
                    const origin = originCoordinate;
                    const promises = coordinatesArray.map(async (destination) => {
                        var _a, _b, _c;
                        const data = await getDistanceMatrix(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
                        const travelDistance = ((_c = (_b = (_a = data.resourceSets[0]) === null || _a === void 0 ? void 0 : _a.resources[0]) === null || _b === void 0 ? void 0 : _b.results[0]) === null || _c === void 0 ? void 0 : _c.travelDistance) || null;
                        return { travelDistance };
                    });
                    const distances = await Promise.all(promises);
                    return distances;
                }
                getDistancesFromOrigins()
                    .then(distances => {
                    members.forEach((member, index) => {
                        member.travelDistance = distances[index].travelDistance;
                    }),
                        members.sort((a, b) => a.travelDistance - b.travelDistance);
                    const membersSort = members.map(member => ({
                        ...member,
                        travelDistance: `${member.travelDistance.toFixed(3)} km`
                    }));
                    res.status(200).json({ membersSort });
                });
            })
                .catch(error => {
                console.error(error);
            });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};
exports.getMembersBloodType = getMembersBloodType;
const getAllMember = async (req, res) => {
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
            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }
            const db = (0, database_1.getDb)();
            const members = await db.collection('members').find({}).toArray();
            res.status(200).json({ members });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};
exports.getAllMember = getAllMember;
const patchMember = async (req, res) => {
    try {
        const usernameToFind = req.params.username;
        console.log(usernameToFind);
        const newRole = req.body.role;
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
            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }
            const db = (0, database_1.getDb)();
            const result = await db.collection('members').updateOne({ username: usernameToFind }, { $set: { role: newRole } });
            if (result.modifiedCount === 1) {
                res.status(200).json({ message: `Role for ${usernameToFind} has been updated to ${newRole}.` });
            }
            else {
                res.status(404).json({ message: `${usernameToFind} not found.` });
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};
exports.patchMember = patchMember;
const deleteMember = async (req, res) => {
    try {
        const token = req.headers.authorization + " ";
        const tokenSliced = token === null || token === void 0 ? void 0 : token.slice(7, -1);
        const usernameDelete = req.params.username;
        if (!tokenSliced) {
            return res.status(401).json({ error: 'Authorization token not provided.' });
        }
        jsonwebtoken_1.default.verify(tokenSliced, secretKey, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token.' });
            }
            const loadedToken = (0, class_transformer_1.plainToClass)(tokenModels_1.default, decoded);
            if (loadedToken.role !== 'admin') {
                return res.status(403).json({ error: 'Permission denied. Only admin can access.' });
            }
            const db = (0, database_1.getDb)();
            const result = await db.collection('members').deleteOne({ username: (usernameDelete) });
            if (result.deletedCount === 1) {
                res.status(200).json({ message: `username ${usernameDelete} has been deleted.` });
            }
            else {
                res.status(404).json({ message: `username ${usernameDelete} not found.` });
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
};
exports.deleteMember = deleteMember;
