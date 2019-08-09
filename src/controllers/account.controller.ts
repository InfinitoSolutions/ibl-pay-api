import utils from '@utils/index';
import * as Errors from '@validator/errors';
import accountServices from '@services/account';
import {AccountSerializer} from '@serializer/account.serializer';
import User, {IUser} from '@models/user.model';
import NeoApi from '@services/neo/api';

export const getDepositAddress = async (request: any, h: any) => {
    try {
        const params = request.query;
        const result = await accountServices.getDepositAddress(params);
        return h.response({'data': await new AccountSerializer().serialize(result, true)}).code(200);
    } catch (e) {
        request.log(['account.getDepositAddress', 'error', request.params]);
    }
};

export const register = async (request: any, h: any) => {
    try {
        const {walletAddr, depositAddr, depositCurr} = request.payload;
        const user: IUser = request.auth.credentials;

        // Check Neo address
        if (await User.findOne({"neo_wallet": walletAddr})) {
            throw new Errors.AddressExistsError();
        }

        // Check Deposit address
        if (!user.crypto_currencies.map(c => c.address).includes(depositAddr)) {
            throw new Errors.NotFoundError();
        }

        await NeoApi.registerWallet(walletAddr, depositAddr, depositCurr);
        return h.response({"data": {"status": true}}).code(200);
    } catch (e) {
        request.log(['account.register', 'error', request.payload]);
        throw utils.error.badRequest(e);
    }
};

export const addDeposit = async (request: any, h: any) => {
    try {
        const {walletAddr, depositAddr, depositCurr} = request.payload;
        const user: IUser = request.auth.credentials;

        // Check Neo address
        if (user.neo_wallet != walletAddr) {
            throw new Errors.NotFoundError();
        }

        // Check Deposit address
        if (await User.findOne({"crypto_currencies.address": depositAddr})) {
            throw new Errors.DuplicatedAddress();
        }

        await NeoApi.addDepositWallet(walletAddr, depositAddr, depositCurr);
        return h.response({"data": {"status": true}}).code(200);
    } catch (e) {
        request.log(['account.register', 'error', request.payload]);
        throw utils.error.badRequest(e);
    }
};

export const removeDeposit = async (request: any, h: any) => {
    try {
        const {depositAddr, depositCurr} = request.payload;
        const user: IUser = request.auth.credentials;

        // Check Deposit address
        if (!user.crypto_currencies.map(c => c.address).includes(depositAddr)) {
            throw new Errors.NotFoundError();
        }

        await NeoApi.removeDepositWallet(depositAddr, depositCurr);
        return h.response({"data": {"status": true}}).code(200);
    } catch (e) {
        request.log(['account.register', 'error', request.payload]);
        throw utils.error.badRequest(e);
    }
};

export default {
    getDepositAddress,
    register,
    addDeposit,
    removeDeposit
};