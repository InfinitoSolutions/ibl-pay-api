const config = require('config');

import * as FirebaseAdmin from 'firebase-admin';
import Device from '@models/device.model';
import {INotificationMessage, INotificationRecipient, INotificationTransport} from '@services/notification/interface';
import Notification from '@models/notification.model';


export class FirebaseTransport implements INotificationTransport {
    constructor() {
        this.init();
    }

    private init() {
        try {
            const app = FirebaseAdmin.app();
            if (app) {
                return;
            }
            const serviceAccount = config.get('server.fcm');
            const appConfig = {
                credential: FirebaseAdmin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            };
            FirebaseAdmin.initializeApp(appConfig);
        } catch (error) {
            console.log('Error: ', error);
        }
    }

    /**
     * Send message
     * 
     * @param {INotificationMessage} message
     */
    async send(message: INotificationMessage, recipients: INotificationRecipient[]): Promise<any> {
        if (!message.visible) {
            return;
        }
        try {
            const promises = recipients.map(async (r) => this.sendToRecipientDevice(message, r));
            await Promise.all(promises);
        } catch (error) {
            console.log('Push Error: ', error);
        }
    }

    async sendToRecipientDevice(message: INotificationMessage, recipient: INotificationRecipient): Promise<void> {
        const registrationIds = await this.getRegistrationIds(recipient);
        if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
            return;
        }
        const messaging = FirebaseAdmin.messaging();
        if (!messaging) {
            console.log('NO APP Init');
        }
        const body = await message.getMessageFor(recipient);
        const title = await message.getTitleFor(recipient);
        const badge = await this.countUnreadMessageFor(recipient);
        const sound = 'default';
        const notification = { title, body, sound, badge: String(badge) };
        const data = { verb: message.verb };
        const results = await messaging.sendToDevice(registrationIds, { notification, data });
        this.processPushResults(registrationIds, results);
    }

    async countUnreadMessageFor(recipient: INotificationRecipient): Promise<number> {
        const query = {
            read: false,
            visible: true,
            archived: false,
            recipient_id: recipient._id
        };
        return await Notification.countDocuments(query);
    }

    async getRegistrationIds(recipient: INotificationRecipient): Promise<string[]> {
        const userDevices = await Device.find({ user_id: recipient._id, active: true });
        const tokens = userDevices.map(ud => ud.registration_id).filter(token => (token && token !== ''));

        // Remove duplicated tokens
        return [... new Set(tokens)];
    }

    async processPushResults(registrationIds: string[], result: any) {
        const { failureCount, results } = result;
        if (!failureCount || failureCount === 0) {
            return;
        }
        if (!Array.isArray(results) || results.length === 0) {
            return;
        }
        const failureTokens = registrationIds.filter((token, index) => {
            return (results[index] && 'error' in results[index]);
        });
        await this.updateInactiveDevices(failureTokens);
    }

    /**
     * Deactivated invalid token
     * 
     * @param registrationIds string[]
     */
    async updateInactiveDevices(registrationIds: string[]): Promise<void> {
        const query = {
            active: true,
            registration_id: { $in: registrationIds }
        };
        const updates = {
            active: false
        };
        return await Device.updateMany(query, updates);
    }
}
