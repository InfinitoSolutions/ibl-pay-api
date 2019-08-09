import Bill from '@models/bill.model';
import * as Errors from '@validator/errors';
import { PaymentServiceFactory } from '@services/payment/factory';
import { CreateBillRequestValidator } from '@services/payment/validator/create-bill-request';
import {
    ConfirmBillRequestValidator,
    PreCheckConfirmBillRequestValidator
} from '@services/payment/validator/confirm-bill-request';
import { UpdateBillRequestValidator } from '@services/payment/validator/update-bill-request';
import { AddBuyerForBillRequestValidator } from '@services/payment/validator/add-buyer-for-bill';
import { DeclineBillCommand, CancelBillCommand, NotifyCancelScheduleCommand, UpdateApprovedCancelBillCommand, UpdateRejectedCancelBillCommand } from '@services/payment/commands';
import { IUser } from '@models/user.model';
import { BILL_STATUS, SCHEDULE_STATUS } from '@models/constant';
import { SharedPayment } from '@services/payment/payment';
import { Types } from 'mongoose';
import BillQueryBuilder from '@services/query/bill';

const ObjectId = Types.ObjectId;

/**
 * Find transactions matching given parameters
 *
 * @param {User} user
 * @param {Object} params = {
 *  type, status,
 *  limit, page
 * }
 */
export const find = async (user: IUser, params: any) => {
    let {
        limit,
        page,
        status,
        from,
        to
    } = params;

    if (!limit || limit > 500) {
        limit = 20;
    }
    if (!page || page < 0) {
        page = 1;
    }
    const queryBuilder = new BillQueryBuilder(user);
    if (status && status !== '') {
        queryBuilder.billStatus(status);
    }

    if (from && from !== '') {
        queryBuilder.fromDate(from);
    }
    if (to && to !== '') {
        queryBuilder.toDate(to);
    }

    return await queryBuilder.paginate(limit, page);
};

function findBill(billId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
            const bill = (await Bill.aggregate([
                {
                    $match: {
                        _id: new ObjectId(billId)
                    }
                }, {
                    $lookup: {
                        from: 'users',
                        localField: 'merchant_id',
                        foreignField: '_id',
                        as: 'merchant_info'
                    }
                }
            ]).exec())[0];
            bill.merchant_name = bill.merchant_info[0].display_name;
            resolve(bill);
        } catch (error) {
            reject(error);
        }
    });
}

export const create = async (user: IUser, payload: any) => {
    const type: string = payload.bill_type;
    const paymentService = PaymentServiceFactory.instance(type);
    const validator = new CreateBillRequestValidator(user);
    await validator.validate(payload);
    return await paymentService.create(user, payload);
};

export const confirm = async (user: IUser, billId: string, payload: any) => {
    let bill: any = {};
    try {
        bill = await findBill(billId);
        if (!bill) {
            throw new Errors.BillQRInvalidExistError();
        }
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
    let type = bill.bill_type;
    if (!type) {
        type = payload.bill_type;
    }
    const paymentService = PaymentServiceFactory.instance(type);
    const validator = new ConfirmBillRequestValidator(bill, user);
    await validator.validate(payload);

    return await paymentService.confirm(user, bill, payload);
};

export const get = async (billId: string) => {
    try {
        const bill = await findBill(billId);
        if (!bill) {
            throw new Errors.BillQRInvalidExistError();
        }
        return bill;
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
};

export const proceed = async (user: IUser, billId: string, payload: any) => {
    const bill = await get(billId);
    const type = bill.bill_type;
    const sharedPaymentService = PaymentServiceFactory.instance(type) as SharedPayment;
    return await sharedPaymentService.proceed(user, bill, payload);
};

export const updateBuyers = async (user: IUser, billId: string, payload: any, buyerAddress: string) => {
    const bill = await get(billId);
    const type = bill.bill_type;
    const sharedPaymentService = PaymentServiceFactory.instance(type) as SharedPayment;
    const validator = new UpdateBillRequestValidator();
    await validator.validate(payload);

    return await sharedPaymentService.updateBuyers(user, bill, payload, buyerAddress);
};

/**
 * Buyer declined Payment Service
 * 
 * @param user IUser
 * @param billId string
 */
export const decline = async (user: IUser, billId: string, payload: any) => {
    const bill = await get(billId);
    if (!bill) {
        throw new Errors.BillDoesNotExistError();
    }
    if (bill.status !== BILL_STATUS.PENDING) {
        throw new Errors.BillDoesNotExistError();
    }
    const command = new DeclineBillCommand(user, bill, payload);
    await command.execute();
};

export const addBuyer = async (user: IUser, billId: string, payload: any) => {
    const bill = await get(billId);
    const type = bill.bill_type;
    const paymentService = PaymentServiceFactory.instance(type);
    const validator = new AddBuyerForBillRequestValidator(bill);
    await validator.validate(payload);

    return await paymentService.addBuyer(user, bill, payload);
};

export const preCheckConfirm = async (user: IUser, billId: string, payload: any) => {
    let bill: any = {};
    try {
        bill = await findBill(billId);
        if (!bill) {
            throw new Errors.BillQRInvalidExistError();
        }
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
    let type = bill.bill_type;
    if (!type) {
        type = payload.bill_type;
    }
    const validator = new PreCheckConfirmBillRequestValidator(user, bill);
    return await validator.validate(payload);
};

/**
 * Merchant cancel bill
 *
 * @param user IUser
 * @param billId string
 */
export const cancel = async (user: IUser, billId: string) => {
    try {
        const bill = await Bill.findOne({
            _id: billId,
            merchant_id: user._id
        });
        if (!bill) {
            throw new Errors.UnauthorizedError();
        }
        if (bill.status !== BILL_STATUS.PENDING) {
            throw new Errors.BillDoesNotExistError();
        }
        const command = new CancelBillCommand(bill);
        await command.execute();
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
};

/**
 * Request cancel schedule bill
 *
 * @param user IUser
 * @param billId string
 */
export const requestCancel = async (user: IUser, billId: string, payload: any) => {
    try {
        const bill = await Bill.findOne({
            $and: [{_id: billId}, {$or: [{merchant_id: user._id}, {confirmed_by_id: user._id}]}]
        });
        if (!bill) {
            throw new Errors.UnauthorizedError();
        }
        if (bill.status !== BILL_STATUS.CONFIRMED) {
            throw new Errors.BillDoesNotExistError();
        }
        const command = new NotifyCancelScheduleCommand(bill, user, payload);
        await command.execute();
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
};

/**
 * Response cancel schedule bill
 *
 * @param user IUser
 * @param billId string
 */
export const responseCancel = async (user: IUser, billId: string, payload: any) => {
    try {
        const bill = await Bill.findOne({
            $and: [
                {_id: billId, 'recurring.status': SCHEDULE_STATUS.CANCEL_REQUEST},
                {$or: [{merchant_id: user._id}, {confirmed_by_id: user._id}]}]
        });
        if (!bill) {
            throw new Errors.UnauthorizedError();
        }
        if (bill.status !== BILL_STATUS.CONFIRMED) {
            throw new Errors.BillDoesNotExistError();
        }
        if (payload.response) {
            const command = new UpdateApprovedCancelBillCommand(bill, user);
            await command.execute();
        } else {
            const command = new UpdateRejectedCancelBillCommand(bill, user);
            await command.execute();
        }
    } catch (e) {
        throw new Errors.BillDoesNotExistError();
    }
};
