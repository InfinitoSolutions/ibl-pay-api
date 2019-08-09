'use strict';

import User from '@models/user.model';
import userService from '@services/user';
import authService from '@services/auth';
import walletService from '@services/wallet';
import utils from '@utils/index';
import * as Errors from '@validator/errors';
import {CryptoWalletSerializer, UserProfileSerializer, UserSerializer} from '@serializer/user.serializer';
import {WalletSerializer} from '@serializer/wallet.serializer';
import {NeoAddressValidator} from '@validator/neo.address';
import {USER_STATUS} from '@models/constant';
import NeoApi from '@services/neo/api';

export const register = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        request.log(['user.register', 'info'], {
            email: payload.email,
            role: payload.role,
            captcha_id: payload.captcha_id,
            captcha_text: payload.captcha_text
        });
        // Get agenda
        const agenda = request.server.plugins['c2c-agenda']['agenda'];

        const user = await userService.register(payload, agenda);
        return h.response({ 'data': await new UserSerializer().serialize(user) }).code(201);
    } catch (err) {
        request.log(['user.register', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

// User Profile
export const me = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const data = await new UserProfileSerializer().serialize(user);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['user.me', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

// Whether email exists or not?
export const emailExists = async (request: any, h: any) => {
    let params = request.query;
    try {
        let exists = await userService.emailExists(params.email);
        return h.response({ data: { 'exists': exists } });
    } catch (err) {
        request.log(['user.emailExists', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const walletExists = async (request: any, h: any) => {
    let params = request.query;
    try {
        let exists = await userService.walletExists(params.wallet);
        return h.response({ data: { 'exists': exists } });
    } catch (err) {
        request.log(['user.walletExists', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const getUserWallets = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const wallets = await walletService.getUserWallets(user);
        return h.response({ 'data': await new WalletSerializer(user).serialize([wallets], true) }).code(200);
    } catch (err) {
        request.log(['user.wallets', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const forgotPassword = async (request: any, h: any) => {
    const email = request.payload.email;
    try {
        request.log(['user.forgotPassword', 'info'], email);
        await userService.forgotPassword(email);
        return h.response().code(200);
    } catch (err) {
        request.log(['user.forgotPassword', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const verifyTokenResetPassword = async (request: any, h: any) => {
    const {token} = request.payload;
    try {
        request.log(['user.verifyTokenResetPassword', 'info'], token);
        await userService.verifyTokenResetPassword(token);
        return h.response().code(200);
    } catch (err) {
        request.log(['user.changePasswordToken', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const changePasswordWithToken = async (request: any, h: any) => {
    const {token, new_password} = request.payload;
    try {
        request.log(['user.changePasswordToken', 'info'], token);
        await userService.changePasswordWithToken(token, new_password);
        return h.response().code(200);
    } catch (err) {
        request.log(['user.changePasswordToken', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const changePassword = async (request: any, h: any) => {
    const { old_password, new_password } = request.payload;
    const user = request.auth.credentials;
    try {
        request.log(['user.changePassword', 'info'], request.payload);
        await userService.changePassword(old_password, new_password, user);
        return h.response().code(200);
    } catch (err) {
        request.log(['user.changePassword', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const verifyPassword = async (request: any, h: any) => {
    const password = request.payload.password;
    const user = request.auth.credentials;
    try {
        const result = await authService.verifyPassword(user.email, password);
        request.log(['user.verifyPassword', 'info'], result);
        return h.response({ 'data': { 'status': result } }).code(200);
    } catch (err) {
        request.log(['user.verifyPassword', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const resendActivation = async (request: any, h: any) => {
    const { email } = request.payload;
    try {
        const result = await userService.resendActivation(email);
        request.log(['user.resendActivation', 'info'], result);
        return h.response({ 'data': { 'status': result } }).code(200);
    } catch (err) {
        request.log(['user.resendActivation', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const activateUser = async (request: any, h: any) => {
    const code = request.query.code;
    request.log(['user.activateUser', 'info'], code);
    if (code === undefined || code === null) {
        // return h.view('404');
        return h.view('expired-link');
    }
    const user = await User.findOne({ activation_code: code, status: USER_STATUS.PRE_ACTIVE });
    if (!user) {
        // return h.view('404');
        return h.view('expired-link');
    }
    const now = new Date();
    if (user) {
        if (now > user.activation_expired_at) {
            return h.view('expired-link');
        }
    }
    user.status = USER_STATUS.ACTIVE;
    user.activated_at = new Date();
    await user.save();

    return h.view('activate-user');
};

export const existsBuyer = async (request: any, h: any) => {
    const address = request.query.address;
    try {
        const result = await userService.existsBuyer(address);
        return h.response({ 'data': { 'status': result } }).code(200);
    } catch (err) {
        throw utils.error.badRequest(err);
    }
};

export const updateWallet = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        const auth = request.auth.credentials;

        // Find current user
        let user = await User.findOne({ _id: auth.id });
        if (user === null) {
            return h.view('404');
        }

        // Validator
        let validator = new NeoAddressValidator();
        await validator.validate(payload);

        // First Login
        if (!user.neo_wallet) {
            // Check Neo address
            if (await User.findOne({ "neo_wallet": payload.neo_wallet })) {
                throw new Errors.AddressExistsError();
            }

            // Check Crypto
            if (!user.crypto_currencies || user.crypto_currencies.length < 1 || user.crypto_currencies.length > 1) {
                throw new Errors.InvalidData();
            }

            const depositAddr = user.crypto_currencies[0].address;
            const depositCurr = user.crypto_currencies[0].currency;

            NeoApi.registerWallet(payload.neo_wallet, depositAddr, depositCurr);
        }

        // Update wallet address
        user.neo_wallet = payload.neo_wallet;
        await user.save();

        return h.response({ data: await new UserProfileSerializer().serialize(user) }).code(200);
    } catch (err) {
        request.log(['user.update', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const getCryptoWallets = async (request: any, h: any) => {
    try {
        const auth = request.auth.credentials;
        // Find current user
        const user = await User.findOne({ _id: auth.id });
        const data = await new CryptoWalletSerializer().serialize(user.crypto_currencies, true);
        return h.response({data});
    } catch (error) {
        request.log(['user.getCryptoWallets', 'error'], error.message);
        throw utils.error.badRequest(error);
    }
};

export const updateCrytoWallets = async (request: any, h: any) => {
    try {
        const { wallets } = request.payload;
        const auth = request.auth.credentials;
        let user = await User.findOne({ _id: auth.id });

        // Get New/Rem wallet
		const newWallets = wallets.filter(w => !user.crypto_currencies.find(f => f.address === w.address));
        const delWallets = user.crypto_currencies.filter(w => !wallets.find(f => f.address === w.address));

        // find address duplication
        const addresses = newWallets.map(({ address }) => address);
        const addressDuplcated = await User.find({ 'crypto_currencies.address' : { $in: addresses } });
        if (addressDuplcated.length !== 0) {
            throw new Errors.DuplicatedAddress();
        }

        if (newWallets.length > 0) {
            newWallets.map(w => NeoApi.addDepositWallet(user.neo_wallet, w.address, w.currency));
        }

        if (delWallets.length > 0) {
            delWallets.map(w => NeoApi.removeDepositWallet(w.address, w.currency));
        }

        // Find current user
        user.crypto_currencies = wallets;
        user = await user.save();
        const data =  await new CryptoWalletSerializer().serialize(user.crypto_currencies, true);
        return h.response({data});
    } catch (error) {
        request.log(['user.updateCrytoWallets', 'error'], error.message);
        throw utils.error.badRequest(error);
    }
};

const mongoose = require('mongoose');
let TestWallets = mongoose.model('testwallets', new mongoose.Schema({}));
export const wallets = async (request: any, h: any) => {
    try {
        const data = await TestWallets.find({});
        return h.response({data});
    } catch (error) {
        request.log(['user.getWallets', 'error'], error.message);
        throw utils.error.badRequest(error);
    }
};

export default {
    wallets,
    register,
    me,
    emailExists,
    walletExists,
    getUserWallets,
    activateUser,
    forgotPassword,
    changePassword,
    verifyTokenResetPassword,
    changePasswordWithToken,
    verifyPassword,
    resendActivation,
    existsBuyer,
    updateWallet,
    getCryptoWallets,
    updateCrytoWallets
};
