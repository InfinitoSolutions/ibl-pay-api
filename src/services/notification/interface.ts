import { IUser } from "@models/user.model";

export interface INotificationRecipient {
    readonly _id: string;
    readonly email?: string;
    readonly display_name?: string;
    readonly first_name?: string;
    readonly last_name?: string;
}

export interface INotificationMessage {
    readonly actor?: INotificationActor;
    readonly verb: string;
    readonly payload: any;
    readonly type: string;
    readonly title: string;
    readonly visible: boolean;

    getTitleFor(recipient: INotificationRecipient): Promise<string>;
    getMessageFor(recipient: INotificationRecipient): Promise<any>;
}

export interface INotificationActor {
    readonly _id?: string;
    readonly email?: string;
    readonly display_name?: string;
    readonly first_name?: string;
    readonly last_name?: string;
}

export class NotificationActor implements INotificationActor {
    readonly _id: string;
    readonly display_name?: string;
    readonly email?: string;

    constructor(id: string, display_name?: string, email?: string) {
        this._id = id;
        this.display_name = display_name;
        this.email = email;
    }

    static fromUser(user: IUser): NotificationActor {
        let actor = new NotificationActor(user._id);
        Object.assign(actor, user);
        return actor;
    }

    get id() {
        return this._id;
    }
}

export interface INotificationTransport {
    /**
     * Send message
     * @param {INotificationMessage} message
     */
    send(message: INotificationMessage, recipients: INotificationRecipient[]): Promise<any>;
}
