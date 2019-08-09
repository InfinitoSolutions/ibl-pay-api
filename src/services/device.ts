'use strict';

import Device, { IDevice } from '@models/device.model';
import { IUser } from '@models/user.model';

/**
 * @todo: Validate data
 * 
 * @param user IUser
 * @param payload any
 */
export const register = async (user: IUser, payload: any): Promise<IDevice> => {
    const { registration_id } = payload;
    const query = { registration_id: registration_id, user_id: user._id, active: true };
    let device = await Device.findOne(query);
    if (!device) {
        device = await Device.create({ ...payload, active: true, user_id: user._id });
    }
    return device;
};

export const unregister = async (user: IUser, registrationId: string): Promise<any> => {
    const query = { registration_id: registrationId, user_id: user._id, active: true };
    return await Device.updateMany(query, { active: false });
};
