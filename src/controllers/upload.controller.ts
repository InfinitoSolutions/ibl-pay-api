'use strict';

const Config = require('config');
import utils from '@utils/index';
import UploadService from '@services/upload';
import {FileTooSmall} from '@validator/errors';

const MIN_PAYLOAD_UPLOAD = Config.get('server.upload.min_upload_size');

export const upload = async (request: any, h: any) => {
    try {
        const { payload: { file } } = request;
        if (file && file._data.length < MIN_PAYLOAD_UPLOAD) {
            throw new FileTooSmall();
        }
        let ufile = await UploadService.upload(file);
        return h.response({ data: ufile }).code(200);
    } catch (err) {
        request.log(['upload', 'error'], err.message);
        throw utils.error.badRequest(err);
    }
};

export default {
    upload
};
