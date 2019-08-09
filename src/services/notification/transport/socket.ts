import socket from '@services/emitter';
import {
    INotificationMessage,
    INotificationRecipient,
    INotificationTransport
} from '@services/notification/interface';


export class WebSocketTransport implements INotificationTransport {
    async send(message: INotificationMessage, recipients: INotificationRecipient[]): Promise<any> {
        const event = message.verb;
        const payload = message.payload;
        const rooms = recipients.map(r => String(r._id));
        return rooms.map(r => socket.to(r).emit(event, payload));
    }
}
