import {
    INotificationMessage,
    INotificationRecipient
} from "@services/notification/interface";


/**
 * An implementation of Notification Message for testing purpose
 */
export class TestPushMessage implements INotificationMessage {
    get verb(): string {
        return 'test.push';
    }

    get title(): string {
        return 'Test Push';
    }

    get payload(): any {
        return {};
    }

    get type(): string {
        return 'PAYMENT';
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return 'This is a test push message';
    }

    get visible(): boolean {
        return true;
    }
}