import * as deviceService from '@services/device';
import {DeviceSerializer} from '@serializer/device.serializer';

export const register = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const payload = request.payload;
        const device = await deviceService.register(user, payload);
        const data = await new DeviceSerializer().serialize(device);
        return h.response({ 'data': data }).code(200);
    } catch (e) {
        request.log(['device.register', 'error', request.params]);
    }
};

export const unregister = async (request: any, h: any) => {
    try {
        const user = request.auth.credentials;
        const { registration_id } = request.payload;
        const result = await deviceService.unregister(user, registration_id);
        return h.response({ 'data': result }).code(200);
    } catch (e) {
        request.log(['device.unregister', 'error', request.params]);
    }
};

export default {
    register,
    unregister
};