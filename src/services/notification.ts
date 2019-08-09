import NotificationQueryBuilder from '@services/query/notification';
import { IUser } from '@models/user.model';
import Notification from '@models/notification.model';
import * as Errors from '@validator/errors';
import { ArchiveNotificationValidator } from '@services/notification/validator/archive';
import NotificationManager from '@services/notification/manager';
import { NOTIFICATION_TYPE } from '@models/constant';

/**
 * Find transactions matching given parameters
 *
 * @param {User} user
 * @param {Object} params = {
 *  type, status,
 *  limit, page
 * }
 */
const find = async (user: IUser, params: any) => {
    let {
        limit,
        page,
        type,
        subtype,
        from,
        to
    } = params;

    if (!limit || limit > 500) {
        limit = 20;
    }
    if (!page || page < 0) {
        page = 1;
    }
    const queryBuilder = new NotificationQueryBuilder(user);
    queryBuilder.owner(user)
        .excludeAccount()
        .excludePullScheduledPayment();

    if (type && type !== '') {
        queryBuilder.notificationType(type);
    }
    if (subtype && subtype !== '') {
        queryBuilder.paymentType(subtype);
    }
    if (from && from !== '') {
        queryBuilder.fromDate(from);
    }
    if (to && to !== '') {
        queryBuilder.toDate(to);
    }

    return await queryBuilder.paginate(limit, page);
};


const findForAccount = async (user: IUser, params: any) => {
    let {
        limit,
        page,
        from,
        to
    } = params;

    if (!limit || limit > 500) {
        limit = 20;
    }
    if (!page || page < 0) {
        page = 1;
    }
    const queryBuilder = new NotificationQueryBuilder(user);
    queryBuilder.owner(user).notificationType(NOTIFICATION_TYPE.ACCOUNT);
    if (from && from !== '') {
        queryBuilder.fromDate(from);
    }
    if (to && to !== '') {
        queryBuilder.toDate(to);
    }
    return await queryBuilder.paginate(limit, page);
};



const findForPullScheduledPayment = async (user: IUser, params: any) => {
    let {
        limit,
        page,
        from,
        to
    } = params;

    if (!limit || limit > 500) {
        limit = 20;
    }
    if (!page || page < 0) {
        page = 1;
    }
    const queryBuilder = new NotificationQueryBuilder(user);
    queryBuilder.owner(user)
        .notificationType(NOTIFICATION_TYPE.PAYMENT)
        .pullScheduledPayment();

    if (from && from !== '') {
        queryBuilder.fromDate(from);
    }
    if (to && to !== '') {
        queryBuilder.toDate(to);
    }
    return await queryBuilder.paginate(limit, page);
};


/**
 * Get a notification
 * @param {User} user
 * @param {id} id
 */
const get = async (user: IUser, id: string) => {
    const notification = await Notification.findOne({ _id: id, recipient_id: user._id, archive: false });
    if (!notification) {
        throw new Errors.NotFoundError();
    }
    return await notification;
};

/**
 * @param {User} user
 * @param {id} id
 */
const markAsRead = async (user: IUser, ids: string[]): Promise<any> => {
    const query = {
        _id: { $in: ids },
        recipient_id: user._id,
        read: false
    };
    const updates = {
        read: true
    };
    return await Notification.updateMany(query, updates);
};

/**
 * Mark as read all notification
 * 
 * @param {User} user
 * @param {id} id
 */
const markAsReadAll = async (user: IUser): Promise<any> => {
    const query = {
        recipient_id: user._id,
        read: false
    };
    const updates = {
        read: true
    };
    return await Notification.updateMany(query, updates);
};

/**
 * Mark as read all notification payment (except account and pull request)
 * 
 * @param {User} user
 * @param {id} id
 */
const markAsReadAllPayment = async (user: IUser): Promise<any> => {
    const query = {
        $and: [
            {recipient_id: user._id},
            {read: false},
            {type: { $ne: NOTIFICATION_TYPE.ACCOUNT }},
            {verb: { $ne: 'schedule.reminded' }}
        ]
    };
    const updates = {
        read: true
    };
    return await Notification.updateMany(query, updates);
};

/**
 * @param {User} user
 * @param {ids} ids
 */

const archive = async (user: IUser, ids: any): Promise<any> => {
    const notification = await Notification.find({ recipient_id: user._id, _id: { $in: ids } });
    if (!notification) {
        throw new Errors.NotFoundError();
    }
    if (!ids || !Array.isArray(ids) || ids.length <= 0) {
        throw new Errors.NotFoundError();
    }
    const validator = new ArchiveNotificationValidator(user);
    let data: any = { "ids": ids };
    await validator.validate(data);

    return await NotificationManager.archive(ids);
};

/**
 * Count unread notification
 * @param {User} user
 */

const countUnread = async (user: IUser): Promise<number> => {
    const q = new NotificationQueryBuilder(user);
    return await q.onlyUnread().count();
};

const countUnreadAccount = async (user: IUser): Promise<number> => {
    const q = new NotificationQueryBuilder(user);
    q.onlyUnread().notificationType(NOTIFICATION_TYPE.ACCOUNT);
    return await q.count();
};

const countUnreadPullScheduledPayment = async (user: IUser): Promise<number> => {
    const q = new NotificationQueryBuilder(user);
    q.onlyUnread().pullScheduledPayment();
    return await q.count();
};

const countUnreadPayment = async (user: IUser): Promise<number> => {
    const q = new NotificationQueryBuilder(user);
    q.onlyUnread()
        .excludeAccount()
        .excludePullScheduledPayment();
    return await q.count();
};


export default {
    find,
    findForAccount,
    findForPullScheduledPayment,
    get,
    markAsRead,
    markAsReadAll,
    markAsReadAllPayment,
    archive,
    countUnread,
    countUnreadAccount,
    countUnreadPullScheduledPayment,
    countUnreadPayment
};
