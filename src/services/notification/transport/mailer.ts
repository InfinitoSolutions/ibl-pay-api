import {
    INotificationMessage,
    INotificationRecipient,
    INotificationTransport
} from '@services/notification/interface';


export class MailerTransport implements INotificationTransport {
    async send(message: INotificationMessage, recipients: INotificationRecipient[]): Promise<any> {
        return;
    }
}
