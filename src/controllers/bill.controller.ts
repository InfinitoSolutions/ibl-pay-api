'use strict';

const Joi = require('joi');
import utils from '@utils/index';
import billValidation from '@validator/bill.schema';
import * as billService from '@services/bill';
import {BillSerializer} from '@serializer/bill.serializer';

export const find = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const params = request.query;
        const results = await billService.find(user, params);
        const data = await new BillSerializer().serialize(results, true);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.list', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const create = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        const { error, value } = Joi.validate(payload, billValidation);
        request.log(['bill.create', 'info', payload]);
        if (error != null) {
            throw utils.error.badRequest(error);
        }
        const user = request.auth.credentials;
        let bill = await billService.create(user, payload);
        const data = {
            data: await new BillSerializer().serialize(bill)
        };

        return h.response(data).code(200);
    } catch (err) {
        request.log(['bill.create', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const confirm = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        const bill = await billService.confirm(user, billId, payload);
        request.log(['transaction.confirm', 'info'], { bill });

        const data = {
            data: await new BillSerializer().serialize(bill)
        };
        return h.response(data).code(200);
    } catch (err) {
        request.log(['transaction.confirm', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const get = async (request: any, h: any) => {
    try {
        const id = request.params.id;
        const bill = await billService.get(id);
        const data = {
            data: await new BillSerializer().serialize(bill)
        };
        return h.response(data).code(200);
    } catch (err) {
        throw utils.error.badRequest(err);
    }
};

export const complete = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const payload = request.payload;
        request.log(['bill.complete', 'info'], { payload });
        const user = request.auth.credentials;
        const result = await billService.proceed(user, billId, payload);
        const data = {
            data: await new BillSerializer().serialize(result)
        };
        return h.response(data).code(200);
    } catch (err) {
        request.log(['bill.complete', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const update = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const buyer_address = request.params.buyer_address;
        const payload = request.payload;
        const user = request.auth.credentials;
        request.log(['bill.update', 'info'], { payload });
        const bill = await billService.updateBuyers(user, billId, payload, buyer_address);
        const data = {
            data: await new BillSerializer().serialize(bill)
        };
        return h.response(data).code(200);
    } catch (err) {
        request.log(['bill.update', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const decline = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        request.log(['bill.decline', 'info'], { params: request.params, payload });
        await billService.decline(user, billId, payload);
        return h.response({ "data": { "status": true } }).code(200);
    } catch (err) {
        request.log(['bill.decline', 'error', request.params]);
        throw utils.error.badRequest(err);
    }
};

export const addBuyer = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        request.log(['bill.addBuyer', 'info'], { payload });
        const bill = await billService.addBuyer(user, billId, payload);
        const data = {
            data: await new BillSerializer().serialize(bill)
        };
        return h.response(data).code(200);
    } catch (err) {
        request.log(['bill.addBuyer', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const preCheckConfirm = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const payload = request.payload;
        const user = request.auth.credentials;
        const isValid = await billService.preCheckConfirm(user, billId, payload);
        request.log(['bill.preCheckConfirm', 'info'], { payload });
        const data = {
            status: isValid
        };
        return h.response({data: data}).code(200);
    } catch (err) {
        request.log(['bill.preCheckConfirm', 'error', request.payload]);
        throw utils.error.badRequest(err);
    }
};

export const cancel = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const user = request.auth.credentials;
        request.log(['bill.cancel', 'info'], { params: request.params });
        await billService.cancel(user, billId);
        return h.response({ "data": { "status": true } }).code(200);
    } catch (err) {
        request.log(['bill.cancel', 'error', request.params]);
        throw utils.error.badRequest(err);
    }
};

export const cancelRequest = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const user = request.auth.credentials;
        request.log(['bill.cancel', 'info'], { params: request.params });
        await billService.requestCancel(user, billId, request.payload);
        return h.response({ "data": { "status": true } }).code(200);
    } catch (err) {
        request.log(['bill.cancel', 'error', request.params]);
        throw utils.error.badRequest(err);
    }
};

export const responseCancelRequest = async (request: any, h: any) => {
    try {
        const billId = request.params.id;
        const user = request.auth.credentials;
        request.log(['bill.cancel', 'info'], { params: request.params });
        await billService.responseCancel(user, billId, request.payload);
        return h.response({ "data": { "status": true } }).code(200);
    } catch (err) {
        request.log(['bill.cancel', 'error', request.params]);
        throw utils.error.badRequest(err);
    }
};

export default {
    find,
    create,
    confirm,
    get,
    complete,
    update,
    decline,
    addBuyer,
    preCheckConfirm,
    cancel,
    cancelRequest,
    responseCancelRequest
};