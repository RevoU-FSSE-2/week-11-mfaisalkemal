"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const actionController_1 = require("../controllers/actionController");
;
const router = express_1.default.Router();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/member', actionController_1.getMembersBloodType);
router.patch('/admin/:username', actionController_1.patchMember);
router.get('/admin', actionController_1.getAllMember);
router.delete('/admin/:username', actionController_1.deleteMember);
exports.default = router;
