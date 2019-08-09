import IValidator from '@validator/validator.interface';
import { ReceiverNotFoundError } from '@validator/errors';
import User from '@models/user.model';
import { USER_ROLE } from '@models/constant';
import { UnauthorizedError } from '@services/payment/errors';

export class TransferReceiverValidator implements IValidator {
    async validate(data: any) {
        const { address, email } = data;
        const user = await User.findOne({ role: USER_ROLE.BUYER, $or: [{ neo_wallet: address }, { email: email }] });
        if (!user) {
            throw new ReceiverNotFoundError();
        }
        if (!user.isActive()) {
            throw new UnauthorizedError();
        }
        return true;
    }
}
