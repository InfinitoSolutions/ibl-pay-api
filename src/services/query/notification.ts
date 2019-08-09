import {
    NOTIFICATION_TYPE
} from '@models/constant';
import Notification from '@models/notification.model';
import QueryBuilder from './query-builder';
import { IUser } from '@models/user.model';

export default class NotificationQueryBuilder extends QueryBuilder {
    type?: string | null;
    payment_type?: string | null;
    pull_scheduled_payment: boolean = false;
    exclude_pull_scheduled_payment: boolean = false;
    exclude_account: boolean = false;
    unread: boolean = false;

    user: IUser;
    sorts: any = {};
    constructor(user: IUser) {
        super();
        this.type = null;
        this.payment_type = null;
        this.user = user;
        this.sorts = { 'createdAt': -1 };
    }

    owner(user: IUser): this {
        this.user = user;
        return this;
    }

    onlyUnread(): this {
        this.unread = true;
        return this;
    }

    notificationType(notificationType: string): this {
        this.type = notificationType;
        return this;
    }

    payment(): this {
        return this.notificationType(NOTIFICATION_TYPE.PAYMENT);
    }

    withdraw(): this {
        return this.notificationType(NOTIFICATION_TYPE.WITHDRAW);
    }

    deposit(): this {
        return this.notificationType(NOTIFICATION_TYPE.DEPOSIT);
    }

    transfer(): this {
        return this.notificationType(NOTIFICATION_TYPE.TRANSFER);
    }

    paymentType(paymentType: string): this {
        this.payment_type = paymentType;
        return this;
    }

    pullScheduledPayment(): this {
        this.pull_scheduled_payment = true;
        return this;
    }

    excludeAccount(): this {
        this.exclude_account = true;
        return this;
    }

    excludePullScheduledPayment(): this {
        this.exclude_pull_scheduled_payment = true;
        return this;
    }

    buildQuery() {
        const q = Notification.find({});
        q.where('archived', false);
        q.where('visible', true);
        if (this.user) {
            const userId = this.user._id;
            q.where('recipient_id', userId);
        }
        if (this.unread === true) {
            q.where('read', false);
        }
        if (this.from_date) {
            q.where('createdAt').gte(this.from_date);
        }
        if (this.to_date) {
            q.where('createdAt').lte(this.to_date);
        }
        if (this.payment_type) {
            q.where('payload.bt', this.payment_type);
        }
        if (this.pull_scheduled_payment === true) {
            q.where('verb', 'schedule.reminded');
        }
        if (this.exclude_pull_scheduled_payment === true) {
            q.ne('verb', 'schedule.reminded');
        }
        if (this.exclude_account === true && this.type) {
            q.and([{ type: this.type }, { type: { $ne: NOTIFICATION_TYPE.ACCOUNT } }]);
        } else if (this.exclude_account === true) {
            q.ne('type', NOTIFICATION_TYPE.ACCOUNT);
        } else if (this.type) {
            q.where('type', this.type);
        }
        return q;
    }
}
