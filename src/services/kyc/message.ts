import { INotificationMessage, INotificationRecipient, INotificationActor } from "@services/notification/interface";
import { IUser } from "@models/user.model";
import { NOTIFICATION_TYPE } from "@models/constant";
import utils from "@utils/index";

export class AccountOneChangedMessage implements INotificationMessage {
    constructor(
        public actor: INotificationActor,
        protected user: IUser,
        protected changeType: string,
        protected from: string,
        protected to: string,
        protected reason?: string,
        protected instruction?: string
    ) { }

    get verb(): string {
        return 'account.buyer-updated';
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            type: this.changeType,
            from: this.from,
            to: this.to,
            reason: this.reason ? this.reason : null,
            instruction: this.instruction ? this.instruction : null
        };
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get visible(): boolean {
        return true;
    }

    get title(): string {
        return `Update Account ${this.changeType.replace('_', ' ')}`;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return `Your account ${this.changeType.replace('_', ' ')} was changed from ${this.from} to ${this.to}.`;
    }
}

export class AccountManyChangedMessage implements INotificationMessage {
    constructor(
        public actor: INotificationActor,
        protected user: IUser,
        protected changes: Array<any>,
        protected reason?: string,
        protected instruction?: string
    ) { }

    get verb(): string {
        return 'account.buyer-updated';
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            changes: this.changes,
            reason: this.reason ? this.reason : null,
            instruction: this.instruction ? this.instruction : null
        };
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get visible(): boolean {
        return true;
    }

    get title(): string {
        return 'Update Account Information';
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<any> {
        const message = this.changes.map(({ type, old_value, new_value }) => {
            return `Your account ${type.replace('_', ' ')} was changed from ${old_value} to ${new_value}.\n`;
        });
        const result = message.join();
        return result;
    }
}

export class CommissionRateUpdatedMessage implements INotificationMessage {
    constructor(
        public actor: INotificationActor,
        protected user: IUser,
        protected from: string,
        protected to: string,
        protected reason?: string
    ) { }

    get verb(): string {
        return 'merchant.commission-rate-updated';
    }

    get title(): string {
        return 'Update Commission Rate';
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get visible(): boolean {
        return true;
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            from: this.from,
            to: this.to,
            reason: this.reason ? this.reason : null
        };
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return `Our commission rate applied to you was updated to ${this.to}%`;
    }
}

export class WithdrawalPeriodUpdatedMessage implements INotificationMessage {
    constructor(
        public actor: INotificationActor,
        protected user: IUser,
        protected from: string,
        protected to: string,
        protected reason?: string
    ) { }

    get verb(): string {
        return 'merchant.withdrawal-period-updated';
    }

    get title(): string {
        return 'Update Withdrawal Period';
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get visible(): boolean {
        return true;
    }

    get payload(): any {
        return {
            _id: String(this.user._id),
            ot: 'user',
            from: this.from,
            to: this.to,
            reason: this.reason ? this.reason : null
        };
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        return `Your fund withdrawal period was updated to ${this.to}`;
    }
}

export class UpdateKYCLevelMessage implements INotificationMessage {
    MESSAGE = 'Your KYC level was changed from %s to %s.';

    LEVELS: any = {
        0: 'Basic',
        1: 'Engaged',
        3: 'Advanced'
    };

    constructor(
        protected user: IUser,
        protected oldLevel: number,
        protected newLevel: number,
        protected oldStatus: string,
        protected newStatus: string,
        protected reason?: string
    ) { }

    get verb(): string {
        return 'account.kyc-level-updated';
    }

    get title(): string {
        return 'Update KYC Level';
    }

    get type(): string {
        return NOTIFICATION_TYPE.ACCOUNT;
    }

    get payload(): any {
        return {
            _id: this.user._id,
            ot: 'user',
            old_level: this.oldLevel,
            new_level: this.newLevel,
            old_status: this.oldStatus,
            new_status: this.newStatus,
            reason: this.reason ? this.reason : null
        };
    }

    get visible(): boolean {
        return true;
    }

    async getTitleFor(recipient: INotificationRecipient): Promise<string> {
        return this.title;
    }

    async getMessageFor(recipient: INotificationRecipient): Promise<string> {
        let from = this.LEVELS[this.oldLevel] || '';
        let to = this.LEVELS[this.newLevel] || '';
        if (from === to) {
            from = this.oldStatus;
            to = this.newStatus;
        }
        return utils.string.format(this.MESSAGE, from, to);
    }
}
