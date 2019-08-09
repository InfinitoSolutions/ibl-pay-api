import util from 'util';

const generateRandomString = require("randomstring");

/**
 * Generate a random string
 * 
 * @param length 
 */
export const randomString = (length: number): string => {
    return generateRandomString.generate(length);
};

/**
 * Returns a formatted string using the first argument as a print-f like format.
 * 
 * @param template 
 * @param params 
 * 
 *  %s - String.
 *  %d - Number (both integer and float).
 *  %j - JSON.
 *  %% - single percent sign ('%'). This does not consume an argument.
 */
export const format = (template: string, ...params: any[]): string => {
    return util.format(template, ...params);
};

export const removeNewLines = (s: string): string => {
    return s.replace(/\r?\n?/g, '');
};

/**
 * Remove 0x prefix of Transaction ID
 * 
 * @param txId string
 * @returns string
 */
export const reformatTxId = (txId: string): string => {
    const regex = /^0x/;
    if (regex.test(txId)) {
        txId = txId.replace(regex, '');
    }
    return txId;
};

export const tryParseFloat = (s: string): number => {
    try {
        return parseFloat(s);
    } catch (e) {
        return 0;
    }
};

export const tryParseInt = (s: string): number => {
    try {
        return parseInt(s, 10);
    } catch (e) {
        return 0;
    }
};