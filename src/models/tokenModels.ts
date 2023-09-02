export default class Token {
    constructor(
        public username: string,
        public role: string,
        public postalcode: string,
        public bloodtype: string,
        public iat: number,
        public exp: number
    ) {}
}