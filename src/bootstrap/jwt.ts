const debug = require('debug')('jwt.service');
const JWT = require('jsonwebtoken');
const Config = require('config');

import User from '@models/user.model';
import {USER_ROLE, USER_STATUS} from '@models/constant';

const ROLE_BUYER = USER_ROLE.BUYER;
const ROLE_MERCHANT = USER_ROLE.MERCHANT;

// Validate user of given JWT
const validate = async (decoded: any, request: any, h: any) => {
    const userId = decoded._id;
    let result = {
        isValid: false,
        credentials: decoded
    };

    try {
        let user = await User.findOne({
            _id: userId,
            status: { $nin: [USER_STATUS.PRE_ACTIVE, USER_STATUS.INACTIVE] }
        });
        if (user !== null) {
            result.isValid = true;
            result.credentials = user;
        }
    } catch (e) {
        debug(e);
    }

    return result;
};

const validatePermission = async (decoded: any, request: any, h: any) => {
    const userId = decoded._id;
    let result = {
        isValid: false,
        credentials: decoded
    };

    try {
        let user = await User.findOne({
            _id: userId,
            status: { $in: [USER_STATUS.ACTIVE] }
        });
        if (user !== null) {
            result.isValid = true;
            result.credentials = user;
        }
    } catch (e) {
        debug(e);
    }

    return result;
};

const validateUserRole = async (decoded: any, request: any, h: any) => {
    let result = await validatePermission(decoded, request, h);
    if (result.isValid && result.credentials.role !== ROLE_BUYER) {
        result.isValid = false;
    }
    return result;
};

const validateMerchantRole = async (decoded: any, request: any, h: any) => {
    let result = await validate(decoded, request, h);
    if (result.isValid && result.credentials.role !== ROLE_MERCHANT) {
        result.isValid = false;
    }
    return result;
};

const jwtAuthPolicy = {
    key: process.env.JWT_SECRET,
    validate: validate,
    tokenType: 'Token',
    verifyOptions: { algorithms: ['HS256'], ignoreExpiration: true }
};

const jwtAuthPermission = {
    key: process.env.JWT_SECRET,
    validate: validatePermission,
    tokenType: 'Token',
    verifyOptions: { algorithms: ['HS256'], ignoreExpiration: true }
};

const jwtBuyerPolicy = Object.assign({}, jwtAuthPolicy, { validate: validateUserRole });

const jwtMerchantPolicy = Object.assign({}, jwtAuthPolicy, { validate: validateMerchantRole });

const jwtUserPolicy = Object.assign({}, jwtAuthPermission, { validate: validateUserRole });

// Create JWT of given user
const createJwtToken = (user: any) => {
    const obj = {
        _id: String(user._id),
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
    };
    const expiresIn = Config.get('jwt.tokenExpireInMinutes') * 60;
    const token = JWT.sign(obj, process.env.JWT_SECRET, { expiresIn });
    return token;
};

export default {
    createJwtToken,
    jwtAuthPolicy,
    jwtBuyerPolicy,
    jwtMerchantPolicy,
    jwtUserPolicy
};