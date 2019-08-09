import { IUser } from "@models/user.model";
import NotificationManager from "@services/notification/manager";
import {
    AccountOneChangedMessage,
    AccountManyChangedMessage,
    CommissionRateUpdatedMessage,
    WithdrawalPeriodUpdatedMessage
} from "@services/kyc/message";
import { ICommand } from "@services/interface";


export class UpdateAccountOneChangesCommand implements ICommand {
    constructor(
        protected user: IUser,
        protected type: string,
        protected fromStatus: string,
        protected toStatus: string,
        protected reason?: string,
        protected instruction?: string
    ) { }

    async execute(): Promise<void> {
        const actor = {
            _id: undefined
        };
        const message = new AccountOneChangedMessage(actor, this.user, this.type, this.fromStatus, this.toStatus, this.reason, this.instruction);
        try {
            await new NotificationManager().send(message, [this.user]);
        } catch (e) { }
    }
}

export class UpdateAccountManyChangesCommand implements ICommand {
    constructor(
        protected user: IUser,
        protected changes: Array<any>,
        protected reason?: string,
        protected instruction?: string
    ) { }

    async execute(): Promise<void> {
        const actor = {
            _id: undefined
        };
        const message = new AccountManyChangedMessage(actor, this.user, this.changes, this.reason, this.instruction);
        try {
            await new NotificationManager().send(message, [this.user]);
        } catch (e) { }
    }
}

export class UpdateAccountCommissionRateChangesCommand implements ICommand {
    constructor(
        protected user: IUser,
        protected fromStatus: string,
        protected toStatus: string,
        protected reason?: string
    ) { }

    async execute(): Promise<void> {
        const actor = {
            _id: undefined
        };
        const message = new CommissionRateUpdatedMessage(actor, this.user, this.fromStatus, this.toStatus, this.reason);
        try {
            await new NotificationManager().send(message, [this.user]);
        } catch (e) { }
    }
}

export class UpdateWithdrawalPeriodChangesCommand implements ICommand {
    constructor(
        protected user: IUser,
        protected fromStatus: string,
        protected toStatus: string,
        protected reason?: string
    ) { }

    async execute(): Promise<void> {
        const actor = {
            _id: undefined
        };
        const message = new WithdrawalPeriodUpdatedMessage(actor, this.user, this.fromStatus, this.toStatus, this.reason);
        try {
            await new NotificationManager().send(message, [this.user]);
        } catch (e) { }
    }
}
