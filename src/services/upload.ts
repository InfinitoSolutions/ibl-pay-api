import * as fs from 'fs';
import { formatDir, mkdirRecursiveSync } from '@utils/directory';
const uuid = require('uuid/v4');

export const upload = async (file: any) => {
    if (!file) {
        throw new Error('no file(s)');
    }

    const data = file._data;
    const fext = (file.hapi.filename.match(/\.[^\.]*$/) || [''])[0];
    const filename = uuid() + fext;

    // let subDir = formatDir();
    // let dir = `${process.env.UPLOAD_BASE}${subDir}`;
    // if (!fs.existsSync(dir)) {
    //     mkdirRecursiveSync(dir);
    // }

    // fs.writeFileSync(`${dir}/${filename}`, data);
    // return {url: `${process.env.FILESV_URL}/${subDir}/${filename}`};

    let dir = `${process.env.UPLOAD_BASE}`;
    if (!fs.existsSync(dir)) {
        mkdirRecursiveSync(dir);
    }

    fs.writeFileSync(`${dir}/${filename}`, data);
    return {url: `${process.env.FILESV_URL}/${filename}`};
};

export default {
    upload
};