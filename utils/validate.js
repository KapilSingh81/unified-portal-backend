import validator from "validator";

export const isUuid = (v) => typeof v === "string" && validator.isUUID(v);
export const isBool = (v) => typeof v === "boolean";
export const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
