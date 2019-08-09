import ValidatorInterface from '@validator/validator.interface';
import { AmountValidator } from '@services/payment/validator/rules/amount';
import { UnauthorizedError, NotExistBuyerAddressError } from '@services/payment/errors';
import User, { IUser } from '@models/user.model';
import { USER_ROLE } from '@models/constant';
import { ITransaction } from '@models/transaction.model';

export class BuyersValidator implements ValidatorInterface {

    async validate(data: any) {
        const { buyers } = data;
        if (Array.isArray(buyers) && buyers.length > 0) {
            for (let i = 0; i < buyers.length; i++) {
                const b = buyers[i];
                await new AmountValidator().validate({ amount: b.amount });
            }
        }
        return true;
    }
}

export class MerchantPullValidator implements ValidatorInterface {
    constructor(
        protected user: IUser,
        protected tran: ITransaction
    ) { }

    async validate(data: any) {
        if (String(this.user._id) !== String(this.tran.to_user)) {
            throw new UnauthorizedError();
        }
        return true;
    }
}

export class ExistsBuyerAddressValidator implements ValidatorInterface {
    async validate(data: any) {
        const { address } = data;
        if (!address) {
            throw new NotExistBuyerAddressError();
        }
        try {
            const buyer = await User.findOne({ neo_wallet: address, role: USER_ROLE.BUYER });
            if (!buyer) {
                throw new NotExistBuyerAddressError();
            }
            return true;
        } catch (e) {
            throw new NotExistBuyerAddressError();
        }
    }
}
