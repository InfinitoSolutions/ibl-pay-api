const Config = require('config');
const debug = require('debug')('user.service');

import password from '@services/password';
import User from '@models/user.model';
import jwt from '@bootstrap/jwt';
import captchaService from '@services/captcha';
import * as Errors from '@validator/errors';
import { USER_STATUS } from '@models/constant';
import { redis } from './redis';
import mailer from '@services/mailer';

const numberLogin = 5;
const keyLogin = 'auth-login';
const getKey = (userName: string) => {
    return `${keyLogin}-${userName}`;
};

const timeExpireLogin = Number(process.env.TIME_BLOCK_USER_LOGIN) || 3000;

const sendBlockedMail = async (email: string) => {
    const subject = Config.get('loginFailed.email.subject');
    const template = Config.get('loginFailed.email.template');

    const data = { timeExpireLogin: (timeExpireLogin / 60) };
    try {
        return await mailer.send(template, email, subject, data);
    } catch (e) {
        debug(e);
        return false;
    }
};

const storeNumberLoginFailed = (username: string) => {
    const redisClient = redis.getClient();
    const redisKeyStore = getKey(username);
    redisClient.hgetall(redisKeyStore, (err: any, value: any) => {
        if (err) {
            console.log(err);
            return;
        }
        let numberLoginFailed = value && value.numberLoginFailed ? Number(value.numberLoginFailed) : 0;
        numberLoginFailed += 1;
        const isBlocked = numberLoginFailed >= numberLogin ? true : false;
        redisClient.hmset(redisKeyStore,
            ['numberLoginFailed', numberLoginFailed, 'isBlocked', isBlocked ],
            (err: any, isOk: string) => {
            if (err) {
                console.log(err);
                return;
            }
            if (isOk === 'OK' && isBlocked) {
                sendBlockedMail(username);
            }
        });
        redisClient.expire(redisKeyStore, timeExpireLogin);
    });
};

const deleteNumberLoginFailed = (username: string) => {
    const redisClient = redis.getClient();
    const redisKeyStore = getKey(username);
    redisClient.del(redisKeyStore, (error, isOk) => {
        if (error) { console.log(error); }
    });
};

const verifyNumberLoginFailed = async(username: string) => {
    const redisClient = redis.getClient();
    const redisKeyStore = getKey(username.toLocaleLowerCase());
    const value = await redisClient.hgetallAsync(redisKeyStore);
    if (!value) { return true; }
    if (value.isBlocked === 'true') { return false; }
    return true;
};

const authenticate = async (payload: any) => {
    let {username, password: rawPassword} = payload;
    username = username.toLowerCase();
    try {
        const user = await User.findOne({ email: username});
        if (!user) {
            return null;
        }
        if (user && user.status === USER_STATUS.PRE_ACTIVE) {
            return 'PRE_ACTIVE';
        }
        if (user && user.status === USER_STATUS.INACTIVE) {
            return 'INACTIVE';
        }
        if (user && [USER_STATUS.FROZEN, USER_STATUS.BLOCKED , USER_STATUS.ACTIVE].includes(user.status)) {
            let valid = await password.compare(rawPassword, user.password);
            if (!valid) {
                storeNumberLoginFailed(username);
                return 'INCORRECT';
            }
            return user;
        }
    } catch (e) { }

    return false;
};

export const verifyPassword = async (username: string, rawPassword: string) => {
    username = username.toLowerCase();
    if (!(await verifyNumberLoginFailed(username))) {
        throw new Errors.LockedAccount();
    }
    const user = await User.findOne({email: username});
    // User not found
    if (!user) {
        return false;
    }
    // Password not match
    const valid = await password.compare(rawPassword, user.password);
    if (!valid) {
        storeNumberLoginFailed(username);
        return false;
    }
    deleteNumberLoginFailed(username);
    return true;
};

export const login = async (payload: any) => {
    const { captcha_id, captcha_text } = payload;
    const isValidCaptcha = await captchaService.validate(captcha_id, captcha_text);
    if (!isValidCaptcha) {
        throw new Errors.CaptchaInvalidError();
    }

    const {username, password} = payload;
    const isNotBlocked = await verifyNumberLoginFailed(username);
    if (!isNotBlocked) {
        return {
            error: 'BLOCK_LOGIN',
            time: timeExpireLogin,
            numberLogin: numberLogin
        };
    }

    let result = await authenticate({username, password});
    if (result === null) {
        return null;
    }
    if (result === false) {
        return false;
    }
    if (typeof result === 'string') {
        return result;
    }
    const first_login = result.last_login_at == null;
    await captchaService.invalidate(captcha_id);
    let token = jwt.createJwtToken(result);
    // Add Last login
    const user = await User.findOneAndUpdate(
        { _id: result._id },
        { last_login_at: new Date() },
        { new: true }
    );
    deleteNumberLoginFailed(username);
    return {
        user,
        token,
        first_login
    };
};

export default {
    login,
    verifyPassword,
};