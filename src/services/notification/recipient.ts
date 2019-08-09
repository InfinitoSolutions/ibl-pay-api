import { IUser } from "@models/user.model";
import { INotificationRecipient } from "@services/notification/interface";


export class NotificationRecipient implements INotificationRecipient {
    _id: string;
    email?: string;
    name?: string;

    constructor(id: string, name?: string, email?: string) {
        this._id = id;
        this.name = name;
        this.email = email;
    }

    get id() {
        return this._id;
    }

    static fromUser(user: IUser): NotificationRecipient {
        let obj = new NotificationRecipient(user._id);
        Object.assign(obj, user);
        return obj;
    }

    getId(): string | null {
        return this.id;
    }
}
