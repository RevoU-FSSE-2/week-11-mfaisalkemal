import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Member from '../models/memberModels';
import { getDb } from '../models/database';

const saltRounds = 10;
const secretKey = process.env.SECRET_KEY_JWT || '';

export const register = async (req: Request, res: Response) => {
    try {
        const { username, role, password, postalcode, bloodtype, age, weight } = req.body;

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const member = new Member(username, role, hashedPassword, postalcode, bloodtype, age, weight);

        const db = getDb();
        const userName = await db.collection('members').distinct('username');
        
        let i: number;
        let counter = 0;

        if( userName.length == 0 ){
            await db.collection('members').insertOne(member);
        }

        for( i = 0; i < userName.length; i++){
            
            if( userName[i] == member.username ){
                return res.status(409).json({ error: 'Username already exist.' });
                break;
            }
            else {
                counter++;
            }
            if(counter == userName.length){
                await db.collection('members').insertOne(member);
            }
        }

        res.status(201).json({ message: 'Member registered successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while registering.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const db = getDb();
        const memberData = await db.collection('members').findOne({ username });

        if (!memberData) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }

        const passwordMatch = await bcrypt.compare(password, memberData.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Authentication failed.' });
        }
        const token = jwt.sign(
            { username: memberData.username, role: memberData.role, postalcode: memberData.postalcode, bloodtype: memberData.bloodtype},
            secretKey, { expiresIn: '6h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while logging in.' });
    }
};