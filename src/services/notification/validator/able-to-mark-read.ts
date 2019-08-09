import ValidatorInterface from '@validator/validator.interface';
import { IUser } from '@models/user.model';
import Notification from '@models/notification.model';
import * as Errors from '@validator/errors';

export class RecipientValidator implements ValidatorInterface {
    user: IUser;
    constructor(user: IUser) {
        this.user = user;
    }

    async validate(data: any) {
        const { id } = data;
        const notification = await Notification.findOne({ _id: id, read: false, recipient_id: this.user._id });
        if (!notification) {
            throw new Errors.NotFoundError();
        }
        return true;
    }
}