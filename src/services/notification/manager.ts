
import Notification, { INotificationDocument } from '@models/notification.model';
import {
    INotificationMessage,
    INotificationRecipient,
    INotificationTransport
} from '@services/notification/interface';
import {
    WebSocketTransport,
    FirebaseTransport,
} from '@services/notification/transport';


export default class NotificationManager {
    transports: INotificationTransport[];

    constructor() {
        this.transports = [
            new WebSocketTransport(),
            new FirebaseTransport()
        ];
    }

    addTransport(transport: INotificationTransport): this {
        this.transports.push(transport);
        return this;
    }

    clearTransport(): this {
        this.transports = [];
        return this;
    }

    /**
     * Send message
     * @param {INotificationMessage} message
     * @param {INotificationRecipient[]} recipients an array of recipient object {_id: <User ID>}
     */
    async send(message: INotificationMessage, recipients: INotificationRecipient[]) {
        // 1. Store message in database
        this.store(message, recipients);

        // 2. Send message to recipients
        const promises = this.transports.map(async (t) => await t.send(message, recipients));
        return await Promise.all(promises);
    }

    /**
     * @todo: Store Notification Recipients in a separated collection
     * 
     * @param {INotificationMessage} message
     * @param {INotificationRecipient[]} recipients
     */
    async store(message: INotificationMessage, recipients: INotificationRecipient[]) {
        const {
            actor,
            verb,
            type,
            payload,
            visible
        } = message;

        const promises = recipients.map(async (recipient: INotificationRecipient) => {
            return {
                read: false,
                actor_id: (actor && actor._id) ? actor._id : null,
                verb,
                recipient_id: recipient._id,
                payload,
                type,
                visible,
                title: await message.getTitleFor(recipient),
                message: await message.getMessageFor(recipient)
            };
        });
        const docs = await Promise.all(promises);
        return await Notification.insertMany(docs);
    }

    static async markAsRead(id: string): Promise<INotificationDocument | null> {
        try {
            return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
        } catch (error) {
            return null;
        }
    }

    static async archive(ids: string[]) {
        try {
            let promises: any = [];
            ids.map((id: string) => {
                let notification = Notification.findByIdAndUpdate(id, { archived: true }, { new: true });
                promises.push(notification);
            });
            return await Promise.all(promises);
        } catch (error) {
            return null;
        }
    }
}
