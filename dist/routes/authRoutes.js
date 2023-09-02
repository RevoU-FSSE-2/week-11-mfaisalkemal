"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrantController_1 = require("../controllers/registrantController");
const transferController_1 = require("../controllers/transferController");
;
const router = express_1.default.Router();
router.post('/register', registrantController_1.register);
router.post('/login', registrantController_1.login);
router.post('/transfer', transferController_1.transfer);
router.patch('/transfer/:id', transferController_1.updateTransferStatus);
router.get('/transfer', transferController_1.getAllTransfers);
exports.default = router;
