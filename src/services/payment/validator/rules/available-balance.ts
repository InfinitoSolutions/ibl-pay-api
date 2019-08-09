import ValidatorInterface from '@validator/validator.interface';
import { IUser } from '@models/user.model';
import Wallet from '@models/wallet.model';
import { Balance } from '@utils/balance';
import { AvailableBalanceError, NotFoundError } from '@validator/errors';

export class AvailableBalanceValidator implements ValidatorInterface {
    user: IUser;
    constructor(user: IUser) {
        this.user = user;
    }

    async validate(data: any) {
        const { amount } = data;
        const wallet = await Wallet.findOne({ user_id: this.user._id });
        if (!wallet) {
            throw new NotFoundError();
        }
        const available_balance = await Balance.getAvailableBalance(wallet);
        if (available_balance < amount) {
            throw new AvailableBalanceError();
        }
        return true;
    }
}