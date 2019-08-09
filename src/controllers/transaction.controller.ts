'use strict';

import * as txService from '@services/transaction';
import {getTransactionSequence} from '@services/transaction';
import utils from '@utils/index';
import {TransactionDetailSerializer, TransactionSerializer} from '@serializer/transaction.serializer';

export const list = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const params = request.query;
        const results = await txService.find(user, params);
        const data = await new TransactionSerializer(user).serialize(results, true);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['transaction.list', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const confirm = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const id = request.params.id;
        const payload = request.payload;

        request.log(['transaction.confirm', 'info'], { payload, params: request.params });
        const results = await txService.confirmTransaction(user, id, payload);
        return h.response({ data: await new TransactionSerializer(user).serialize(results) }).code(200);
    } catch (err) {
        request.log(['transaction.confirm', 'error'], err);
        throw utils.error.notFound(err);
    }
};

export const get = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const tran_id = request.params.id;
        const results = await txService.getTransaction(tran_id);
        const data = await new TransactionDetailSerializer(user).serialize(results);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['transaction.get', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const remind = async (request: any, h: any) => {
    try {
        const tran_id = request.params.id;
        request.log(['transaction.overMaxFund', 'info'], { params: request.params });
        const result = await txService.remind(request, tran_id);
        return h.response({ "data": { "status": result } }).code(200);
    } catch (err) {
        request.log(['transaction.remind', 'error', err]);
        throw utils.error.badRequest(err);
    }
};

export const pull = async (request: any, h: any) => {
    try {
        const tran_id = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        request.log(['transaction.pull', 'info', { payload: request.payload, params: request.params }]);
        const result = await txService.pull(user, tran_id, payload);
        return h.response({ "data": await new TransactionSerializer(user).serialize(result) }).code(200);
    } catch (err) {
        request.log(['transaction.pull', 'error', err]);
        throw utils.error.badRequest(err);
    }
};

export const confirmWithMaxFund = async (request: any, h: any) => {
    try {
        const tran_id = request.params.id;
        const payload = request.payload;
        const params = request.params;
        const user = request.auth.credentials;
        request.log(['transaction.confirmWithMaxFund', 'info', { payload, params }]);
        const tran = await txService.confirmWithMaxFund(user, tran_id, payload);
        request.log(['transaction.confirmWithMaxFund', 'info'], { tran });
        return h.response({ data: await new TransactionSerializer(user).serialize(tran) }).code(200);
    } catch (err) {
        request.log(['transaction.confirmWithMaxFund', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const decline = async (request: any, h: any) => {
    try {
        const tran_id = request.params.id;
        const user = request.auth.credentials;
        request.log(['transaction.decline', 'info', { payload: request.payload, params: request.params }]);
        const result = await txService.decline(user, tran_id);
        return h.response({ "data": { "status": result } }).code(200);
    } catch (err) {
        request.log(['transaction.decline', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const transfer = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const payload = request.payload;
        request.log(['transaction.transfer', 'info'], { payload });
        const results = await txService.transfer(user, payload);
        return h.response({ data: await new TransactionSerializer(user).serialize(results) }).code(200);
    } catch (err) {
        request.log(['transaction.transfer', 'error'], err);
        throw utils.error.notFound(err);
    }
};

export const withdraw = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const {password, wallet, amount, fee, txid} = request.payload;
        request.log(['transaction.withdraw', 'info'], { payload: request.payload });
        await txService.withdraw(user, {wallet, amount, fee, password, txid});
        const data = {
            status: true
        };
        return h.response({ data }).code(200);
    } catch (err) {
        request.log(['transaction.withdraw', 'error'], err);
        throw utils.error.badRequest(err);
    }
};

export const preCheckTransfer = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const payload = request.payload;
        request.log(['transaction.preCheckTransfer', 'info'], { payload });
        const isValid = await txService.preCheckTransfer(user, payload);
        const data = {
            status: isValid
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['transaction.preCheckTransfer', 'error'], err);
        throw utils.error.notFound(err);
    }
};

export const preCheckWithdraw = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const payload = request.payload;
        request.log(['transaction.preCheckWithdraw', 'info'], { payload });
        const isValid = await txService.preCheckWithdraw(user, payload);
        const data = {
            status: isValid
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['transaction.preCheckWithdraw', 'error'], err);
        throw utils.error.notFound(err);
    }
};

export const preCheckPull = async (request: any, h: any) => {
    try {
        const tran_id = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        request.log(['transaction.preCheckPull', 'info', { payload: request.payload, params: request.params }]);
        const isValid = await txService.preCheckPull(user, tran_id, payload);
        const data = {
            status: isValid
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['transaction.preCheckPull', 'error', err]);
        throw utils.error.badRequest(err);
    }
};

export const deposit = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const payload = request.payload;
        request.log(['transaction.deposit', 'info'], { payload: request.payload });
        await txService.deposit(user, payload);
        const data = {
            status: true
        };
        return h.response({ data }).code(200);
    } catch (err) {
        request.log(['transaction.deposit', 'error', err]);
        throw utils.error.badRequest(err);
    }
};

export const getSequence = async (request: any, h: any) => {
    try {
        const seq = await getTransactionSequence();
        return h.response({seq});
    } catch (error) {
        request.log(['error'], error.message);
        throw utils.error.badRequest(error);
    }
};

export default {
    list,
    confirm,
    get,
    remind,
    pull,
    confirmWithMaxFund,
    decline,
    transfer,
    withdraw,
    preCheckTransfer,
    preCheckWithdraw,
    preCheckPull,
    deposit,
    getSequence
};
