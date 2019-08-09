import {
    KYC_LEVEL,
    KYC_REG_STATUS,
    KYC_SUBMIT_STATUS,
    KYC_STATUS_WEBHOOK_MAP,
    KYC_LEVEL_WEBHOOK_MAP,
    KYC_STATUS_CHANGE,
} from '../../models/constant';
import User, { IUserDocument } from '@models/user.model';
import { KYC } from '../api/kyc';
import { KYCServiceFactory } from '@services/kyc/factory';
import * as Errors from '@validator/errors';
import NotificationManager from '@services/notification/manager';
import { UpdateKYCLevelMessage } from '@services/kyc/message';
import { ApiConfiguration } from '../api/http/config';
import { USER_ROLE } from '@models/constant';

export interface IJobDataReg {
    user_id: String;
    password?: String;
}

export default class JobKYC {
    /**
     * Find new users
     */
    static async getNewUsers(): Promise<IUserDocument[]> {
        // Filter new users
        const filter = {
            $or: [{
                'kyc_register': KYC_REG_STATUS.NEW
            }, {
                'kyc_register': KYC_REG_STATUS.FAILED
            }]
        };
        return await User.find(filter);
    }

    /**
     * Find submited users
     */
    static async getSubmitUsers(): Promise<IUserDocument[]> {
        // Filter new users
        const filter = {
            $or: [{
                'kyc1_submit': KYC_SUBMIT_STATUS.NEW
            }, {
                'kyc1_submit': KYC_SUBMIT_STATUS.FAILED
            }, {
                'kyc3_submit': KYC_SUBMIT_STATUS.NEW
            }, {
                'kyc3_submit': KYC_SUBMIT_STATUS.FAILED
            }]
        };
        return await User.find(filter);
    }

    /**
     * Register new KYC user
     */
    static async registerKYC(jobData: IJobDataReg): Promise<any> {
        try {
            let user = await User.findById(jobData.user_id);
            if (user === null) {
                throw new Errors.NotFoundError();
            }

            let data = {
                email: user.email,
                type: USER_ROLE.MERCHANT === user.role ? ApiConfiguration.KYC_MERCHANT_ID : ApiConfiguration.KYC_BUYER_ID
            };
            let kycAccount = await KYC.register(data);
            return await User.findOneAndUpdate(
                { _id: user._id },
                { kyc_account: kycAccount.data.id, kyc_register: KYC_REG_STATUS.REGISTERED },
                { new: true }
            );
        } catch (e) {
            await User.findOneAndUpdate(
                { _id: jobData.user_id },
                { kyc_register: KYC_REG_STATUS.FAILED },
                { new: true }
            );
            throw e;
        }
    }

    /**
     * Submit KYC
     */
    static async submitKYC(userId: string): Promise<any> {
        let kyc_fail = {};
        try {
            let user = await User.findById(userId);
            if (user === null) {
                throw new Errors.NotFoundError();
            }

            let kyc_service = KYCServiceFactory.instance(user, null);
            kyc_fail = kyc_service.kyc_fail;
            await kyc_service.processKYC(user);

            return await User.findOneAndUpdate(
                { _id: user._id },
                kyc_service.kyc_reg,
                { new: true }
            );
        } catch (e) {
            await User.findOneAndUpdate(
                { _id: userId },
                kyc_fail,
                { new: true }
            );
            throw e;
        }
    }

    /**
     * Webhook KYC
     */
    static async webhookKYC(data: any): Promise<any> {
        try {
            if (!data || !data.kyc || !data.customer || !(data.kyc.status in KYC_STATUS_WEBHOOK_MAP)) {
                throw new Errors.InvalidData();
            }

            let user = await User.findOne({ kyc_account: data.customer.id });
            if (user === null) {
                throw new Errors.NotFoundError();
            }

            const upd_status = data.kyc.status;
            const upd_level = data.kyc.level;
            const oldLevel = user.kyc_level;
            const oldStatus = user.get(KYC_LEVEL_WEBHOOK_MAP[upd_level]);
            const newStatus = KYC_STATUS_WEBHOOK_MAP[upd_status];

            // KYC expired date
            const kyc_expire_date = new Date();
            kyc_expire_date.setFullYear(kyc_expire_date.getFullYear() + 1);

            // KYC Level
            let additionData: any = {};
            let kyc_level = user.kyc_level;
            if (upd_status === KYC_STATUS_CHANGE.Approved) {
                if (upd_level === KYC_LEVEL.ENGAGED) {
                    kyc_level = KYC_LEVEL.ENGAGED;
                } else if (upd_level === KYC_LEVEL.ADVANCED) {
                    if (user.kyc1_submit === KYC_SUBMIT_STATUS.APPROVED) {
                        kyc_level = KYC_LEVEL.ADVANCED;
                    } else {
                        additionData[KYC_LEVEL_WEBHOOK_MAP[KYC_LEVEL.ENGAGED]] = KYC_SUBMIT_STATUS.APPROVED;
                    }
                }
            } else {
                if (upd_level === KYC_LEVEL.ENGAGED) {
                    kyc_level = KYC_LEVEL.BASIC;
                    if (user.kyc3_submit === KYC_SUBMIT_STATUS.APPROVED) {
                        additionData[KYC_LEVEL_WEBHOOK_MAP[KYC_LEVEL.ADVANCED]] = KYC_SUBMIT_STATUS.INCOMPLETE;
                    }
                } else if (upd_level === KYC_LEVEL.ADVANCED) {
                    if (user.kyc1_submit === KYC_SUBMIT_STATUS.APPROVED) {
                        kyc_level = KYC_LEVEL.ENGAGED;
                    } else {
                        kyc_level = KYC_LEVEL.BASIC;
                    }
                }
            }

            const updatedUser = await User.findOneAndUpdate(
                { _id: user._id },
                {
                    [KYC_LEVEL_WEBHOOK_MAP[upd_level]]: KYC_STATUS_WEBHOOK_MAP[upd_status],
                    kyc_expire_date,
                    kyc_level,
                    ...additionData
                },
                { new: true }
            );

            /**
             * Send notification
             */
            if (updatedUser) {
                const newLevel = updatedUser.kyc_level;
                const message = new UpdateKYCLevelMessage(user, oldLevel, newLevel, oldStatus, newStatus);
                const recipients = [{
                    _id: user._id
                }];
                await new NotificationManager().send(message, recipients);
            }
            return updatedUser;
        } catch (e) {
            throw e;
        }
    }
}
