'use strict';

import notificationServices from '@services/notification';
import utils from '@utils/index';
import {NotificationSerializer} from '@serializer/notification.serializer';

export const find = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const params = request.query;
        const results = await notificationServices.find(user, params);
        const data = await new NotificationSerializer(user).serialize(results, true);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.list', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const findForAccount = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const params = request.query;
        const results = await notificationServices.findForAccount(user, params);
        const data = await new NotificationSerializer(user).serialize(results, true);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.list', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const findForPullScheduledPayment = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const params = request.query;
        const results = await notificationServices.findForPullScheduledPayment(user, params);
        const data = await new NotificationSerializer(user).serialize(results, true);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.list', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const get = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const id = request.params.id;
        const results = await notificationServices.get(user, id);
        const data = await new NotificationSerializer(user).serialize(results);
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.get', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const markAsRead = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const ids = request.payload;
        await notificationServices.markAsRead(user, ids);
        const data = {
            status: true
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.markAsRead', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const markAsReadAll = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        await notificationServices.markAsReadAll(user);
        const data = {
            status: true
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.markAsReadAll', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const markAsReadAllPayment = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        await notificationServices.markAsReadAllPayment(user);
        const data = {
            status: true
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.markAsReadAllPayment', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const archive = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const ids = request.payload;
        await notificationServices.archive(user, ids);
        const data = {
            status: true
        };
        return h.response({ data: data }).code(200);
    } catch (err) {
        request.log(['notification.archive', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const countUnread = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const results = await notificationServices.countUnread(user);
        return h.response({ data: { "count": results } }).code(200);
    } catch (err) {
        request.log(['notification.count-unread', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export const countGroupUnread = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const group = {
            account: await notificationServices.countUnreadAccount(user),
            scheduled_payment: await notificationServices.countUnreadPullScheduledPayment(user),
            payment: await notificationServices.countUnreadPayment(user)
        };
        return h.response({ data: group }).code(200);
    } catch (err) {
        request.log(['notification.count-unread', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export default {
    find,
    findForAccount,
    findForPullScheduledPayment,
    countGroupUnread,
    get,
    markAsRead,
    markAsReadAll,
    markAsReadAllPayment,
    archive,
    countUnread
};