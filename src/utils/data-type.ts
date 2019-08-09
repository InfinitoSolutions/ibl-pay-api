export const isString = (value: any) => {
    return typeof value === 'string' || value instanceof String;
};

export const isNumber = (value: any) => {
    return typeof value === 'number' && isFinite(value);
};

export const isArray = (value: any) => {
    return value && typeof value === 'object' && value.constructor === Array;
};

export const isFunction = (value: any) => {
    return typeof value === 'function';
};

export const isObject = (value: any) => {
    return value && typeof value === 'object' && value.constructor === Object;
};

export const isSingleObject = (value: any) => {
    return value && typeof value === 'object' && value._doc;
};

export const isNull = (value: any) => {
    return value === null;
};

export const isUndefined = (value: any) => {
    return typeof value === 'undefined';
};

export const isBoolean = (value: any) => {
    return typeof value === 'boolean';
};

export const isRegExp = (value: any) => {
    return value && typeof value === 'object' && value.constructor === RegExp;
};

export const isError = (value: any) => {
    return value instanceof Error && typeof value.message !== 'undefined';
};

export const isDate = (value: any) => {
    return value instanceof Date;
};

export const isSymbol = (value: any) => {
    return typeof value === 'symbol';
};

export const getDataType = (value: any) => {
    return typeof value === 'symbol';
};
