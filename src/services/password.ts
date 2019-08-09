'use strict';

const bcrypt = require('bcrypt');
const SALT_ROUND = 10;

const hashPassword = async (password: string) => {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUND);
        return await bcrypt.hash(password, salt);
    } catch (e) {
        throw e;
    }
};

const comparePassword = async (plainTextPassword: string, hash: string) => {
    try {
        return await bcrypt.compare(plainTextPassword, hash);
    } catch (e) {
        throw e;
    }
};

export default {
    hash: hashPassword,
    compare: comparePassword
};
