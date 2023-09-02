import express from 'express';
import { register, login } from '../controllers/authController';
import { getMembersBloodType,getAllMember, patchMember, deleteMember } from '../controllers/actionController';
;

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/member', getMembersBloodType);
router.patch('/admin/:username', patchMember);
router.get('/admin', getAllMember);
router.delete('/admin/:username', deleteMember);

export default router;