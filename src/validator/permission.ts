import ValidatorInterface from "@validator/validator.interface";
import User, { IUser } from "@models/user.model";
import { UnauthorizedError } from "@services/payment/errors";
import { IBill } from "@models/bill.model";
import { ITransaction } from "@models/transaction.model";

export class CanProceedPaymentValidator implements ValidatorInterface {
    constructor(protected user: IUser, protected bill: IBill) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive()) {
            throw new UnauthorizedError();
        }
        const merchant = await User.findById(this.bill.merchant_id);
        if (!merchant || !merchant.isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanWithdrawFundValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive() && !this.user.isFrozen()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanCreateBillValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanPullScheduledPaymentValidator implements ValidatorInterface {
    constructor(protected user: IUser, protected tran: ITransaction) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive()) {
            throw new UnauthorizedError();
        }
        const buyer = await User.findById(this.tran.from_user);
        if (!buyer || !buyer.isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanReceivePaymentValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanTransferFundValidator implements ValidatorInterface {
    constructor(protected user: IUser) { }

    async validate(data: any): Promise<boolean> {
        if (!this.user.isActive() || !this.user.isBuyer()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class CanSchedulePaymentValidator implements ValidatorInterface {
    constructor(protected bill: IBill) { }

    async validate(data: any): Promise<boolean> {
        const userIds = [this.bill.merchant_id, this.bill.confirmed_by_id];
        const users = await User.find({ _id: { $in: userIds } });
        if (!Array.isArray(users) || users.length !== 2) {
            throw new UnauthorizedError();
        }
        if (!users[0].isActive() || !users[1].isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}
