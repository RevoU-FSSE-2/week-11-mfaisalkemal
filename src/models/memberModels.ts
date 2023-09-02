import { ObjectId } from 'mongodb';

export default class Member {
    constructor(
        public username: string,
        public role: string,
        public password: string,
        public postalcode: string,
        public bloodtype: string,
        public age: number,
        public weight: number
    ) {}
}