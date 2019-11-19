const Config = require('config');
const debug = require('debug')('user.service');
const Joi = require('joi');

import User from '@models/user.model';
import PasswordReset from '@models/password-reset.model';
import Wallet from '@models/wallet.model';
import Password from '@services/password';
import Captcha from '@services/captcha';
import mailer from '@services/mailer';
import utils from '@utils/index';
import * as Errors from '@validator/errors';
import RegisterUserRequestValidator from '@validator/register-user-request';
import EmailValidateSchema from '@validator/email.schema';
import { USER_ROLE, USER_STATUS } from '@models/constant';
import jwt from 'jsonwebtoken';
import {verifyPassword} from '@services/auth';

const INITIAL_WALLET_BALANCE = 0;
const SECRET = 'c2c-secret-key';


/**
 * @todo: Wallet should be created on Mobile
 * @param {User} user
 */
export const createWallet = async (user: any) => {
    try {
        let walletBtc = new Wallet({
            user_id: user._id,
            currency: 'BTC',
            balance: INITIAL_WALLET_BALANCE
        });
        let walletEth = new Wallet({
            user_id: user._id,
            currency: 'INFT',
            balance: INITIAL_WALLET_BALANCE
        });
        await walletBtc.save();
        await walletEth.save();
    } catch (e) {
        debug(e);
        throw e;
    }
};

export const createInfinitoTokenWallet = async (user: any) => {
    try {
        let walletEth = new Wallet({
            user_id: user._id,
            currency: 'INFT',
            balance: INITIAL_WALLET_BALANCE
        });
        await walletEth.save();
    } catch (e) {
        debug(e);
        throw e;
    }
};

/**
 * Send Welcome email
 *
 * @param {User} user
 */
export const sendWelcomeMail = async (user: any) => {
    const subject = Config.get('register.email.subject');
    const template = Config.get('register.email.template');

    const BASE_URL = process.env.BASE_URL;
    const url = `${BASE_URL}/v1/users/activation?code=${user.activation_code}`;
    const data = { username: user.email, url: url };
    try {
        return await mailer.send(template, user.email, subject, data);
    } catch (e) {
        debug(e);
        return false;
    }
};

export const register = async (payload: any, agenda: any) => {
    try {
        payload.email = payload.email.toLowerCase();
        const { email } = payload;

        const validator = new RegisterUserRequestValidator();
        await validator.validate(payload);
        // await Captcha.invalidate(payload.captcha_id);
        // Create new user and send activation URL via Email
        let user = new User(payload);
        user.password = await Password.hash(payload.password);
        user.activation_code = await Password.hash(email);
        user.activation_expired_at = await utils.date.addHours(24);
        user.status = USER_STATUS.PRE_ACTIVE;

        // Save user
        let u = await user.save();

        // Create wallet
        await createWallet(u);

        // Send welcome mail
        sendWelcomeMail(user);
        return u;
    } catch (e) {
        debug(e);
        throw e;
    }
};

/**
 * Whether given email exists or not?
 *
 * @param {String} email
 */
export const emailExists = async (email: string) => {
    email = email.toLowerCase();
    const { error, value } = Joi.validate({ email }, EmailValidateSchema);
    if (error !== null) {
        throw new Errors.EmailFormatError();
    }
    let user = await User.findOne({ email: email });
    return (user !== null);
};

/**
 * Whether given NEO wallet exists or not?
 *
 * @param {String} wallet
 */
export const walletExists = async (wallet: string) => {
    let user = await User.findOne({ neo_wallet: wallet });
    return (user !== null);
};

export const forgotPassword = async (email: string) => {
    email = email.toLowerCase();
    const user = await User.findOne({ email: email, status: { $nin: [USER_STATUS.PRE_ACTIVE, USER_STATUS.INACTIVE] } });
    if (user === null) {
        throw new Errors.EmailNotFoundError();
    }
    const randomString = utils.string.randomString(10);
    const hash = await Password.hash(`${email}${randomString}`);
    const token = jwt.sign(
        { email, hash },
        SECRET,
        { expiresIn: Config.get('resetPassword.tokenExpireInMinutes') * 60 }
    );
    const reset = new PasswordReset({ email, hash, valid: true });
    await reset.save();

    // Send Email
    let subject = Config.get('forgotPassword.email.subject');
    let template = Config.get('forgotPassword.email.template');

    const BASE_URL = process.env.BASE_FRONTEND;
    const url = `${BASE_URL}/reset-password?token=${token}`;
    const emailData = {
        url: url
    };

    mailer.send(template, user.email, subject, emailData);
    return reset;
};

const updatePassword = async (email: string, newPassword: string) => {
    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
        throw new Errors.EmailNotFoundError();
    }
    user.password = await Password.hash(newPassword);
    await user.save();
};

export const verifyTokenResetPassword = (token: string) => {
    return jwt.verify(token, SECRET, async (err, payload) => {
        if (err) {
            if (err.name !== "TokenExpiredError") {
                throw new Errors.TokenInvalidError();
            }
            throw new Errors.TokenExpired();
        }
        const { email, hash } = payload;
        console.log('EMAIL', email);
        const reset = await PasswordReset.findOne({ hash });
        if (!reset || reset.email !== email || !reset.valid) {
            throw new Errors.PasswordResetTokenNotFoundError();
        }
    });
};

export const changePasswordWithToken = (token: string, password: string) => {
    // 1. Validate password reset token
    return jwt.verify(token, SECRET, async (err, payload) => {
        if (err) {
            throw new Errors.TokenExpired();
        }
        const { email, hash } = payload;
        console.log('EMAIL', email);
        const reset = await PasswordReset.findOne({ hash });
        if (!reset || reset.email !== email || !reset.valid) {
            throw new Errors.PasswordResetTokenNotFoundError();
        }
        await updatePassword(email, password);
        reset.valid = false;
        await reset.save();
    });
};

export const changePassword = async (oldPassword: string, newPassword: string, user: any) => {
    const email = user.email.toLowerCase();
    const password = user.password;
    if (!(await verifyPassword(email, oldPassword))) {
        throw new Errors.OldPasswordWrong();
    }
    if (await Password.compare(newPassword, password)) {
        throw new Errors.NewPasswordNotSame();
    }
    await updatePassword(email, newPassword);
};

/**
 * Verify user password
 *
 * @param {string} passwordPlain
 * @param {string} hash
 */
// export const verifyPassword = async (passwordPlain: string, hash: string) => {
//     return await Password.compare(passwordPlain, hash);
// };

/**
 * Resend activation email
 *
 * @param {string} email
 */
export const resendActivation = async (email: string) => {
    email = email.toLowerCase();
    const user = await User.findOne({ email: email, status: USER_STATUS.PRE_ACTIVE });
    if (!user) {
        throw new Errors.ActivationCodeInvalidError();
    }
    user.activation_code = await Password.hash(email);
    user.activation_expired_at = await utils.date.addHours(24);

    // Save user
    await user.save();

    // Send welcome mail
    sendWelcomeMail(user);
    return user;
};

/**
 *
 * @param {address} address
 */
export const existsBuyer = async (address: string) => {
    const user = await User.findOne({ neo_wallet: address });
    if (!user) {
        throw new Errors.NotFoundError();
    }
    return (user.role === USER_ROLE.BUYER) ? true : false;
};

export default {
    register,
    emailExists,
    walletExists,
    createWallet,
    forgotPassword,
    changePassword,
    verifyTokenResetPassword,
    changePasswordWithToken,
    verifyPassword,
    resendActivation,
    existsBuyer
};
