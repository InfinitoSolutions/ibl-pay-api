import { IWebHookHandler } from "@services/web-hooks/handlers/handler.interface";
import { IWebHook } from "@models/web-hook.model";
import { INotificationRecipient } from "@services/notification/interface";
import User from "@models/user.model";
import Transaction from "@models/transaction.model";
import { ICommand } from "@services/interface";
import {
    UpdatePendingWithdrawalRequestCommand,
    UpdateRejectedWithdrawalRequestCommand,
    UpdateBlockedWithdrawalRequestCommand,
    UpdateApprovedWithdrawalRequestCommand } from "@services/payment/commands";
import {
    UpdateAccountOneChangesCommand,
    UpdateAccountManyChangesCommand,
    UpdateAccountCommissionRateChangesCommand,
    UpdateWithdrawalPeriodChangesCommand } from "@services/kyc/commands";
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from "@models/constant";

export class NotificationWebHookHandler implements IWebHookHandler {
    async execute(event: IWebHook): Promise<any> {
        const data: any = event.data;
        const { type, payload } = data;
        if (!Array.isArray(payload) || payload.length === 0) {
            return;
        }
        const promises = payload.map(async (item) => {
            return await this.doInvoke(type, item);
        });
        await Promise.all(promises);
    }

    private async doInvoke(type: string, data: any): Promise<void> {
        const { recipient_id } = data;
        try {
            const recipient = await this.getRecipient(recipient_id);
            if (!recipient) {
                return;
            }
            const command = await this.createCommand(type, data);
            if (!command) {
                return;
            }
            await command.execute();
        } catch (e) { }
    }

    private async getRecipient(recipientId: string): Promise<INotificationRecipient | null> {
        if (!recipientId) {
            return null;
        }
        try {
            const user = await User.findById(recipientId);
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return null;
        }
    }

    private async createCommand(type: string, data: any): Promise<ICommand | null> {
        let command = null;
        switch (type) {
            case 'withdraw.pending':
            case 'withdraw.rejected':
            case 'withdraw.blocked':
            case 'withdraw.approved':
                command = await NotificationFactory.makeWithdrawalTransactionCommand(type, data);
                break;
            case 'account.buyer-updated':
            case 'merchant.commission-rate-updated':
            case 'merchant.withdrawal-period-updated':
                command = await NotificationFactory.makeAccountCommand(type, data);
                break;
        }

        return command;
    }
}

export class NotificationFactory {

    static async makeWithdrawalTransactionCommand(verb: string, payload: any): Promise<ICommand | null> {
        const { transaction_id } = payload;
        if (!transaction_id) {
            return null;
        }
        try {
            const tran = await Transaction.findById(transaction_id);
            if (!tran || tran.tran_type !== TRANSACTION_TYPE.WITHDRAW) {
                return null;
            }
            switch (verb) {
                case 'withdraw.pending':
                    return new UpdatePendingWithdrawalRequestCommand(tran, payload);
                case 'withdraw.rejected':
                    return new UpdateRejectedWithdrawalRequestCommand(tran, payload);
                case 'withdraw.blocked':
                    return new UpdateBlockedWithdrawalRequestCommand(tran, payload);
                case 'withdraw.approved':
                    return new UpdateApprovedWithdrawalRequestCommand(tran, payload);
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    static async makeAccountCommand(verb: string, payload: any): Promise<ICommand | null> {
        const { recipient_id, from, to, reason, instruction, changes } = payload;
        if (!recipient_id) {
            return null;
        }
        try {
            const user = await User.findById(recipient_id);
            if (!user) {
                return null;
            }

            switch (verb) {
                case 'account.buyer-updated':
                    if (changes.length > 1) {
                        return new UpdateAccountManyChangesCommand(user, changes, reason, instruction);
                    } else {
                        const { old_value, new_value, type } = changes[0];
                        return new UpdateAccountOneChangesCommand(user, type, old_value, new_value, reason, instruction);
                    }
                case 'merchant.commission-rate-updated':
                    return new UpdateAccountCommissionRateChangesCommand(user, from, to, reason);
                case 'merchant.withdrawal-period-updated':
                    return new UpdateWithdrawalPeriodChangesCommand(user, from, to, reason);
            }
            return null;
        } catch (e) {
            return null;
        }
    }
}
