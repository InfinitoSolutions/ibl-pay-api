import { NOTIFICATION_TYPE } from '@models/constant';
import utils from '@utils/index';
import { IUser } from '@models/user.model';
import moment from 'moment';
import {
    INotificationMessage,
    INotificationActor,
    INotificationRecipient
} from '@services/notification/interface';
import Config from 'config';


export abstract class AbstractUserMessage implements INotificationMessage {
    actor: INotificationActor;
    user: IUser;
    dateTime: any;

    constructor(actor: INotificationActor, user: IUser) {
        this.actor = actor;
        this.user = user;
        this.dateTime = moment();
    }

    abstract get verb(): string;
    abstract async getMessageFor(recipient: INotificationRecipient): Promise<string>;

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get title(): string {
        return '';
    }

    get visible(): boolean {
        return true;
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            tt: '',
            bt: '',
            dt: this.dateTime
        };
    }
}

export class RegisterSuccessMessage extends AbstractUserMessage {
    REGISTER: string = 'Your register request was success at %s.';
    NOTE: string = 'Success register wallet.';

    get verb(): string {
        return 'register.success';
    }

    get title(): string {
        return 'Successful Register Wallet';
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            tt: '',
            bt: '',
            dt: this.dateTime,
            note: this.NOTE
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const localTime = this.dateTime.tz(Config.dateTime.TIME_ZONE).format(Config.dateTime.DATE_TIME_FORMAT);
        return utils.string.format(this.REGISTER, localTime);
    }
}

export class RegisterFailedMessage extends AbstractUserMessage {
    REGISTER: string = 'Your register request was failed at %s.';
    NOTE: string = 'Cannot register wallet.';

    get verb(): string {
        return 'register.failed';
    }

    get title(): string {
        return 'Unsuccessful Register Wallet';
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            tt: '',
            bt: '',
            dt: this.dateTime,
            note: this.NOTE
        };
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        const localTime = this.dateTime.tz(Config.dateTime.TIME_ZONE).format(Config.dateTime.DATE_TIME_FORMAT);
        return utils.string.format(this.REGISTER, localTime);
    }
}
