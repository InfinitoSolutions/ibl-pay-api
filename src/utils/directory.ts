import moment from 'moment';
import * as fs from 'fs';
const config = require('config');

export const formatDir = (dt?: string | Date): string => {
    const DIR_FORMAT = config.get('directory.DIR_FORMAT');
    return moment(dt).format(DIR_FORMAT);
};

export const mkdirRecursiveSync = (path: string): void => {
    let paths = path.split('/');
    let fullPath = '';
    paths.forEach((path) => {
        if (fullPath === '') {
            fullPath = path;
        } else {
            fullPath = fullPath + '/' + path;
        }

        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath);
        }
    });
};
