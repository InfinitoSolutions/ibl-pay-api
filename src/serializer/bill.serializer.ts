import {JsonSerializer} from '@serializer/serializer';
import Bill from '@models/bill.model';
import User from '@models/user.model';
import {UserSerializer} from '@serializer/user.serializer';

export class BillSerializer extends JsonSerializer {
    constructor() {
        super();
        this.fields = ['_id', 'status', 'service',
            'bill_type', 'amount', 'currency',
            'merchant_address', 'tx_seq',
            'is_recurring', 'recurring', 'buyers',
            'agreement_id', 'parent_tx_seq',
            'createdAt',
            'confirmed_at',
            'rejected_at',
            'merchant',
            'merchant_id',
            'merchant_name',
            'amount_usd',
            'usd_rate'
        ];
    }

    async recurring(data: any) {
        const { is_recurring, recurring } = data;
        if (!is_recurring) {
            return null;
        }
        if (!data.parent_id) {
            return await this.formatRecurring(recurring);
        }

        // Get original Bill if it is a rescheduled bill
        const parentBill = await this.getParentBillOrNull(data.parent_id);
        if (!parentBill) {
            return null;
        }
        return await this.formatRecurring(parentBill.recurring);
    }

    async getParentBillOrNull(parentBillId: string) {
        try {
            return await Bill.findById(parentBillId);
        } catch (e) {
            return null;
        }
    }

    async formatRecurring(recurring: any) {
        const {
            recurring_type,
            start_date,
            end_date,
            schedule_time,
            next_run_at,
            max_fund,
            schedule,
            start_time,
            duration,
            run_at,
            status,
            cancel_requester,
            transaction_str
        } = recurring;
        let r = {
            recurring_type,
            start_date,
            end_date,
            schedule_time,
            next_run_at,
            max_fund,
            start_time,
            schedule,
            duration,
            run_at,
            status,
            cancel_requester,
            transaction_str
        };

        return r;
    }

    async buyers(data: any) {
        const buyers = data.buyers || [];
        if (!Array.isArray(buyers) || buyers.length === 0) {
            return [];
        }
        const userIds = buyers.map(b => b.user_id).filter(v => (v !== null && v !== undefined));
        const users = await User.find({ _id: { $in: userIds } });
        return await new UserSerializer().serialize(users, true);
    }

    async merchant(data: any) {
        try {
            const { merchant_id } = data;
            if (!merchant_id) {
                return null;
            }
            const query = { _id: merchant_id };
            const merchant = await User.findOne(query);
            return await new UserSerializer().serialize(merchant);
        } catch (e) {
            return null;
        }
    }
}
