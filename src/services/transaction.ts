import Transaction from '@models/transaction.model';
import Bill from '@models/bill.model';
import NotificationManager from '@services/notification/manager';
import {TransactionDeclineMessage,} from '@services/payment/message';
import {TransactionService} from '@services/payment/transaction';
import TransactionQueryBuilder from '@services/query/transaction';
import * as Errors from '@validator/errors';
import * as ErrorsPayment from '@services/payment/errors';
import {TransferTransaction} from '@services/transfer/transaction';
import {WithdrawTransactionCommand} from '@services/withdraw/transaction';
import {DepositTransaction} from '@services/deposit/transaction';
import {BuyerDeclineValidator} from '@services/payment/validator/buyer-decline';
import {IUser} from '@models/user.model';
import {ConfirmTransactionRequestValidator} from '@services/payment/validator/confirm-transaction-request';
import {ConfirmTransactionOverMaxFundRequestValidator} from '@services/payment/validator/confirm-transaction-over-max-fund';
import {PreCheckTransferTransactionValidator, TransferTransactionValidator} from '@services/transfer/validator/transfer-transaction';
import {PreCheckWithdrawTransactionValidator, WithdrawTransactionValidator} from '@services/withdraw/validator/withdraw-transaction';
import {PreCheckPullRequestValidation} from '@services/payment/validator/pull-request';
import {DepositTransactionValidator} from '@services/deposit/validator/deposit-validate';
import {PaymentScheduler} from '@services/payment/scheduler';
import {verifyPassword} from '../services/auth';

import Sequence from '@models/sequence.model';
import moment from 'moment';

/**
 * Find transactions matching given parameters
 *
 * @param {User} user
 * @param {Object} params = {
 *  currency, type, status,
 *  period: [today, this_week, this_month],
 *  limit, page
 * }
 */
export const find = async (user: IUser, params: any) => {
    let {
        limit,
        page,
        period,
        currency,
        status,
        type,
        in_out,
        tran_type,
        from,
        to,
        q
    } = params;

    if (!limit || limit > 500) {
        limit = 20;
    }
    if (!page || page < 0) {
        page = 1;
    }
    const queryBuilder = new TransactionQueryBuilder();
    queryBuilder.owner(user);
    if (currency && currency !== '') {
        queryBuilder.currency(currency);
    }
    if (status && status !== '') {
        queryBuilder.status(status);
    }
    if (type && type !== '') {
        queryBuilder.type(type);
    }
    if (period === 'today') {
        queryBuilder.today();
    } else if (period === 'this_week') {
        queryBuilder.thisWeek();
    } else if (period === 'this_month') {
        queryBuilder.thisMonth();
    }
    if (tran_type && tran_type !== '') {
        queryBuilder.tranType(tran_type);
    }
    if (in_out && in_out !== '') {
        queryBuilder.inOutTransaction(in_out);
    }
    if (from && from !== '') {
        queryBuilder.fromDate(from);
    }
    if (to && to !== '') {
        queryBuilder.toDate(to);
    }
    if (q && q !== '') {
        queryBuilder.search(q);
    }

    return await queryBuilder.paginate(limit, page);
};

/**
 * Buyer confirm a PENDING transaction
 *
 * @param {User} user
 * @param {String} id Transaction ID
 * @param {Object} payload = {tx_id}
 */
export const confirmTransaction = async (user: IUser, id: string, payload: any) => {
    const service = new TransactionService();
    const tran = await service.getPendingTransaction(user, id);
    if (!tran) {
        throw new Errors.TransactionIsInvalidError();
    }

    const validator = new ConfirmTransactionRequestValidator();
    await validator.validate(payload);

    return await service.confirmTransaction(user, tran, payload);
};

export const getTransaction = async (id: string) => {
    try {
        return await Transaction.findById(id);
    } catch (e) {
        throw new Errors.TransactionIsInvalidError();
    }
};

export const remind = async (request: any, tran_id: string) => {
    try {
        const tran = await Transaction.findById(tran_id);
        if (!tran) {
            throw new Errors.TransactionIsInvalidError();
        }
        await remindMerchant(request, tran_id);
        return true;
    } catch (e) {
        throw new Errors.TransactionIsInvalidError();
    }
};

const remindMerchant = async (request: any, tran_id: string) => {
    try {
        const agenda = request.server.plugins['c2c-agenda']['agenda'];
        const d = moment.utc().toDate();
        const runAt = moment(d).add('1', 'hours').toDate();
        await agenda.schedule(runAt, "schedule.bill.reminder", { tran_id: tran_id });
    } catch (e) {
        throw new (e);
    }
};

export const pull = async (user: IUser, tran_id: string, payload: any) => {
    const tran = await Transaction.findById(tran_id);
    if (!tran) {
        throw new Errors.TransactionIsInvalidError();
    }
    // const validator = new PullRequestValidation(user, tran);
    // await validator.validate(payload);
    const service = new TransactionService();
    return await service.pullFund(tran, payload);
};

export const confirmWithMaxFund = async (user: IUser, tran_id: string, payload: any) => {
    try {
        const tran = await Transaction.findById(tran_id);
        if (!tran) {
            throw new Errors.TransactionIsInvalidError();
        }
        const bill = await Bill.findById(tran.bill_id);
        if (!bill) {
            throw new Errors.TransactionIsInvalidError();
        }
        const validator = new ConfirmTransactionOverMaxFundRequestValidator(bill);
        await validator.validate(payload);
        const service = new TransactionService();
        return await service.confirmWithMaxFund(user, tran, payload);
    } catch (e) {
        throw new Errors.TransactionIsInvalidError();
    }

};

export const decline = async (user: IUser, tran_id: string) => {
    const tran = await Transaction.findById(tran_id);
    if (!tran) {
        throw new Errors.TransactionIsInvalidError();
    }
    const validator = new BuyerDeclineValidator(user, tran);
    await validator.validate(null);
    const recipients = [{
        _id: tran.to_user
    }, {
        _id: tran.from_user
    }];
    await new NotificationManager().send(new TransactionDeclineMessage(user, tran), recipients);
    return true;
};

export const transfer = async (user: IUser, payload: any) => {
    const validator = new TransferTransactionValidator(user);
    await validator.validate(payload);
    const service = new TransferTransaction();
    return await service.createTransferTransaction(user, payload);
};

export const withdraw = async (user: IUser, payload: any) => {
    const validator = new WithdrawTransactionValidator(user);
    await validator.validate(payload);
    if (!(await verifyPassword(user.email, payload.password))) {
        throw new Errors.VerifyPassword();
    }
    const WithdrawalTran = new WithdrawTransactionCommand(user, payload);
    return await WithdrawalTran.execute();
};

export const preCheckTransfer = async (user: IUser, payload: any) => {
    const validator = new PreCheckTransferTransactionValidator(user);
    return await validator.validate(payload);
};

export const preCheckWithdraw = async (user: IUser, payload: any) => {
    const validator = new PreCheckWithdrawTransactionValidator(user);
    if (!payload && !Array.isArray(payload)) {
        throw new Errors.WithdrawRequestInvalidError();
    }
    for (let d in payload) {
        if (!payload[d]) {
            continue;
        }
        try {
            await validator.validate(payload[d]);
        } catch (e) {
            throw e;
        }
    }
    return true;
};

export const preCheckPull = async (user: IUser, tran_id: string, payload: any) => {
    const tran = await Transaction.findById(tran_id);
    if (!tran) {
        throw new Errors.TransactionIsInvalidError();
    }
    if (!tran.bill_id) {
        throw new Errors.BillDoesNotExistError();
    }
    const bill = await Bill.findOne({ _id: tran.bill_id });
    if (!bill) {
        throw new Errors.BillDoesNotExistError();
    }
    let availableRecurring = true;
    if (bill.is_recurring) {
        const factory = PaymentScheduler.factory(bill.recurring);
        availableRecurring = factory.isAvailable();
    }
    if (!availableRecurring) {
        throw new ErrorsPayment.RecurringDateInValidError();
    }
    const validator = new PreCheckPullRequestValidation(user, tran);
    return await validator.validate(payload);
};

export const deposit = async (user: IUser, payload: any) => {
    const validator = new DepositTransactionValidator(user);
    await validator.validate(payload);
    const service = new DepositTransaction();
    return await service.createDepositTransaction(user, payload);
};

export const getTransactionSequence = async () => {
    const now = moment().format('YYMMDD');
    let seq = await Sequence.findOneAndUpdate({type: 'TRANSACTION', date: now}, {$inc: {value: 1}}, {new: true});
    if (!seq) {
        seq = await Sequence.create({
            type: 'TRANSACTION',
            date: now,
            value: 1
        });
    }
    return `${now}-${('00000000' + seq.value).substr(-8)}`;
};
