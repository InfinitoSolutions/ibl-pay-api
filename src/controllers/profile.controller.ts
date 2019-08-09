'use strict';

const Config = require('config');
import utils from '@utils/index';
import User from '@models/user.model';
import * as Errors from '@validator/errors';
import {KYCServiceFactory} from '@services/kyc/factory';
import KycFactory from '@services/kyc/update-kyc';
import UploadService from '@services/upload';
import {Types} from 'mongoose';
import {UserSerializer} from '@serializer/user.serializer';


const ObjectId = Types.ObjectId;


const MIN_AVATAR_SIZE = Config.get('server.upload.min_avatar_size');

// User profile update
export const update = async (request: any, h: any) => {
    try {
        const payload = request.payload;
        const auth = request.auth.credentials;

        // Find current user
        const user = await User.findOne({ _id: auth.id });
        if (user == null) {
            throw new Errors.NotFoundError();
        }

        const data = await User.findOneAndUpdate({ _id: auth.id }, { $set : payload }, { new: true });

        // Get agenda
        const agenda = request.server.plugins['c2c-agenda']['agenda'];

        // Get instance of KYC service
        let kyc_service = KYCServiceFactory.instanceP(user, payload, agenda);
        // return h.response({ 'data': await kyc_service.call(auth.id, payload) }).code(200);
        return h.response({ 'data': data }).code(200);
    } catch (err) {
        request.log(['profile.update', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

// Update profile avatar
export const updateAvatar = async (request: any, h: any) => {
    try {
        const { payload: { avatar } } = request;
        const auth = request.auth.credentials;
        if (avatar && avatar._data.length < MIN_AVATAR_SIZE) {
            throw new Errors.FileTooSmall();
        }

        // Find current user
        let user = await User.findOne({ _id: auth.id });
        if (user == null) {
            throw new Errors.NotFoundError();
        }

        // Write avatar
        const ufile = avatar ? await UploadService.upload(avatar) : { url: "" };
        // Save to database
        user.avatar = ufile.url;
        await user.save();

        return h.response({ data: ufile }).code(200);

    } catch (err) {
        request.log(['profile.updateAvatar', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

// Update user kyc status
export const updateKycStatus = async (request: any, h: any) => {
    try {
        const { email, status } = request.payload;

        // Find current user
        const user = await User.findOne({ email });
        if (!user) {
            throw new Errors.NotFoundError();
        }

        const kyc = KycFactory(user);

        return h.response({ 'data': await kyc.process(status) });
    } catch (err) {
        request.log(['profile.updateKycStatus', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

// Make an id

// Get profile by id/email
export const getProfile = async (request: any, h: any) => {
    try {
        const {id} = request.params;
        let _id = null;
        if (ObjectId.isValid(id)) {
            _id = new ObjectId(id);
        }
        // Find user
        const user = await User.findOne({$or: [
            {_id},
            {email: id},
            {email: {"$regex": "(?i)" + id + ".*"}}
        ]});

        const me = request.auth.credentials;
        if (!user || String(me._id) === String(user._id)) {
            throw new Errors.NotFoundError();
        }

        const response = await new UserSerializer().serialize(user);

        return h.response({data: response});

    } catch (error) {
        request.log(['profile.getProfile', 'error'], error.message);
        throw utils.error.badRequest(error);
    }
};

export default {
    update,
    updateAvatar,
    updateKycStatus,
};
