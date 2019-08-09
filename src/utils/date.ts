import moment from 'moment';
const config = require('config');

export const nowUTC = () => {
    return moment.utc().toDate();
};

export const formatDateTime = (dt?: string | Date): string => {
    const DATE_TIME_FORMAT = config.get('dateTime.DATE_TIME_FORMAT');
    return moment(dt).format(DATE_TIME_FORMAT);
};

export const formatDate = (dt?: string | Date): string => {
    const DATE_FORMAT = config.get('dateTime.DATE_FORMAT');
    return moment(dt).format(DATE_FORMAT);
};

export const formatDateKYC = (dt?: string | Date): string => {
    const DATE_FORMAT = config.get('dateTime.DATE_FORMAT_KYC');
    return moment(dt).format(DATE_FORMAT);
};

export const formatTime = (dt?: string | Date): string => {
    const TIME_FORMAT = config.get('dateTime.TIME_FORMAT');
    return moment(dt).format(TIME_FORMAT);
};

export const formatDateJP = (dt?: string | Date): string => {
    const DATE_FORMAT = config.get('dateTime.DATE_FORMAT_JP');
    return moment(dt).format(DATE_FORMAT);
};


export const formatMonthYear = (dt?: string | Date): string => {
    return moment(dt).format('MM/YYYY');
};


export const addDays = (days: number) => {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

export const addHours = (h: number) => {
    let date = new Date();
    date.setHours(date.getHours() + (h)); 
   return date;
}