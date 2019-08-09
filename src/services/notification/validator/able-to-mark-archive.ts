import ValidatorInterface from '@validator/validator.interface';
import { IUser } from '@models/user.model';
import Notification from '@models/notification.model';
import * as Errors from '@validator/errors';

export class AbleToArchiveValidator implements ValidatorInterface {
    user: IUser;
        constructor(user: IUser) {
        this.user = user;
    }

    async validate(data: any) {
        const { ids } = data;
        try {
            const count = await Notification.count({ _id: {$in: ids}, archived: false, recipient_id: this.user._id });
            if (count !== ids.length) {
                throw new Errors.NotFoundError();
            }
            return true;
        } catch (e) {
            throw e;
        }
    }
}