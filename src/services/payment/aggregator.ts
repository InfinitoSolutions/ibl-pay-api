import moment from 'moment';
import { IUser } from '@models/user.model';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@models/constant';
import Transaction from '@models/transaction.model';

export class PaymentAggregator {

    static async getTotalOnHold(user: IUser): Promise<number> {
        try {
            const statuses = [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.PROCESSING];
            const tranTypes = [TRANSACTION_TYPE.WITHDRAW];
            const match = {
                from_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $in: statuses },
            };
            const group = {
                _id: null,
                total: { $sum: '$amount' }
            };
            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalPaymentOfBuyer(user: IUser, from: Date | string, to: Date | string): Promise<number> {
        try {
            const f = moment(from).hour(0).minute(0).second(0).toDate();
            const t = moment(to).hour(23).minute(59).second(59).toDate();
            const statuses = [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.PROCESSING];
            const tranTypes = [TRANSACTION_TYPE.PAYMENT, TRANSACTION_TYPE.TRANSFER];
            const match = {
                from_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $in: statuses },
                confirmed_at: { $gte: f, $lte: t }
            };
            const group = {
                _id: null,
                total: { $sum: '$amount_usd' }
            };

            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalPaymentOfMerchant(user: IUser, from: Date | string, to: Date | string): Promise<number> {
        try {
            const f = moment(from).hour(0).minute(0).second(0).toDate();
            const t = moment(to).hour(23).minute(59).second(59).toDate();
            const statuses = [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.PROCESSING];
            const tranTypes = [TRANSACTION_TYPE.PAYMENT];
            const match = {
                to_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $in: statuses },
                confirmed_at: { $gte: f, $lte: t }
            };
            const group = {
                _id: null,
                total: { $sum: '$amount_usd' }
            };

            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalTransactionOfBuyer(user: IUser, from: Date | string, to: Date | string): Promise<number> {
        try {
            const f = moment(from).hour(0).minute(0).second(0).toDate();
            const t = moment(to).hour(23).minute(59).second(59).toDate();
            const statuses = [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.PROCESSING];
            const tranTypes = [TRANSACTION_TYPE.PAYMENT, TRANSACTION_TYPE.TRANSFER];
            const match = {
                from_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $in: statuses },
                confirmed_at: { $gte: f, $lte: t }
            };
            const group = {
                _id: null,
                total: { $sum: 1 }
            };

            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalTransactionOfMerchant(user: IUser, from: Date | string, to: Date | string): Promise<number> {
        try {
            const f = moment(from).hour(0).minute(0).second(0).toDate();
            const t = moment(to).hour(23).minute(59).second(59).toDate();
            const statuses = [TRANSACTION_STATUS.COMPLETED, TRANSACTION_STATUS.PROCESSING];
            const tranTypes = [TRANSACTION_TYPE.PAYMENT];
            const match = {
                to_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $in: statuses },
                confirmed_at: { $gte: f, $lte: t }
            };
            const group = {
                _id: null,
                total: { $sum: 1 }
            };

            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalWithdrawalAmount(user: IUser, from: Date | string, to: Date | string): Promise<number> {
        try {
            const f = moment(from).hour(0).minute(0).second(0).toDate();
            const t = moment(to).hour(23).minute(59).second(59).toDate();
            const statuses = [
                TRANSACTION_STATUS.BLOCKED,
                TRANSACTION_STATUS.REJECTED,
                TRANSACTION_STATUS.CANCELLED,
                TRANSACTION_STATUS.FAILED
            ];
            const tranTypes = [TRANSACTION_TYPE.WITHDRAW];
            const match = {
                from_user: user._id,
                tran_type: { $in: tranTypes },
                status: { $nin: statuses },
                createdAt: { $gte: f, $lte: t }
            };
            const group = {
                _id: null,
                total: { $sum: '$amount_usd' }
            };

            const r = await Transaction.aggregate([{ $match: match }, { $group: group }]);
            if (Array.isArray(r) && r.length > 0) {
                return r[0].total;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    static async getTotalPaymentOfBuyerInMonth(user: IUser): Promise<number> {
        const to = moment();
        const from = moment().date(1);

        return this.getTotalPaymentOfBuyer(user, from.toDate(), to.toDate());
    }

    static async getTotalPaymentOfMerchantInMonth(user: IUser): Promise<number> {
        const to = moment();
        const from = moment().date(1);
        return this.getTotalPaymentOfMerchant(user, from.toDate(), to.toDate());
    }

    static async getTotalTransactionOfBuyerInMonth(user: IUser): Promise<number> {
        const to = moment();
        const from = moment().date(1);
        return this.getTotalTransactionOfBuyer(user, from.toDate(), to.toDate());
    }

    static async getTotalTransactionOfMerchantInMonth(user: IUser): Promise<number> {
        const to = moment();
        const from = moment().date(1);
        return this.getTotalTransactionOfMerchant(user, from.toDate(), to.toDate());
    }

    static async getTotalWithdrawalAmountInMonth(user: IUser): Promise<number> {
        const to = moment();
        const from = moment().date(1);
        return this.getTotalWithdrawalAmount(user, from.toDate(), to.toDate());
    }
}
