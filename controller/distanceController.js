import { Op, literal } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { tableEventDataLogModel } from "../models/tableEventDataLogModel.js";
import { customerDeviceModel } from "../models/customerDeviceModel.js";
import { DATE_RE, fmt, formatSQLDate, getDistance, isValidDate } from "../utils/helper.js";


export const distanceController = async (req, res) => {
    try {
        const { userId, deviceId, fromDate, toDate } = req.body;

        if (!userId) {
            return ResponseService.error(res, "userId is required", 400);
        }

        if (!fromDate || !toDate) {
            return ResponseService.error(
                res,
                "fromDate and toDate are required",
                400
            );
        }

        if (!DATE_RE.test(fromDate) || !DATE_RE.test(toDate)) {
            return ResponseService.error(
                res,
                "Date format must be YYYY-MM-DD",
                400
            );
        }

        const fromDay = String(fromDate).slice(0, 10);
        const toDay = String(toDate).slice(0, 10);

        if (!isValidDate(fromDay) || !isValidDate(toDay)) {
            return ResponseService.error(res, "Invalid date value", 400);
        }

        if (fromDay > toDay) {
            return ResponseService.error(res, "Invalid date range", 400);
        }

        const startDate = new Date(`${fromDay}T00:00:00.000Z`);
        const endDate = new Date(`${toDay}T00:00:00.000Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const fromStr = formatSQLDate(startDate);
        const toStr = formatSQLDate(endDate);

        // ---- Devices ----
        const deviceWhere = { CentralUserId: userId };

        const rawDeviceIds = Array.isArray(deviceId)
            ? deviceId
            : deviceId !== undefined && deviceId !== null && deviceId !== ""
                ? String(deviceId).split(",")
                : [];

        if (rawDeviceIds.length) {
            const parsedDeviceIds = [
                ...new Set(rawDeviceIds.map((id) => Number(String(id).trim()))),
            ];

            if (parsedDeviceIds.some((id) => !Number.isInteger(id) || id <= 0)) {
                return ResponseService.error(res, "Invalid deviceId", 400);
            }

            deviceWhere.id = { [Op.in]: parsedDeviceIds };
        }

        const devices = await customerDeviceModel.findAll({
            attributes: ["id", "vehicle_no"],
            where: deviceWhere,
            raw: true,
        });

        if (!devices.length) {
            return ResponseService.error(res, "No device found", 404);
        }

        const deviceIds = devices.map((d) => Number(d.id));

        // ---- Event rows ----
        const rows = await tableEventDataLogModel.findAll({
            attributes: [
                "fk_device_id",
                "time_stamp",
                "latitude",
                "longitude",
                "speed",
                "di1",
                // 'YYYY-MM-DD' exactly as stored in DB (no JS timezone conversion)
                [literal("CONVERT(varchar(10), time_stamp, 23)"), "day"],
            ],
            where: {
                fk_device_id: { [Op.in]: deviceIds },
                time_stamp: {
                    [Op.gte]: literal(`CONVERT(datetime, '${fromStr}', 121)`),
                    [Op.lt]: literal(`CONVERT(datetime, '${toStr}', 121)`),
                },
                latitude: { [Op.ne]: null },
                longitude: { [Op.ne]: null },
            },
            order: [
                ["fk_device_id", "ASC"],
                ["time_stamp", "ASC"],
            ],
            raw: true,
        });

        // ---- All days in range (fromDay..toDay inclusive) ----
        const dayList = [];
        for (
            const d = new Date(startDate);
            d < endDate;
            d.setUTCDate(d.getUTCDate() + 1)
        ) {
            dayList.push(d.toISOString().slice(0, 10));
        }

        // ---- Group rows by device (already ordered by device, time) ----
        const pointsByDevice = {};
        for (const r of rows) {
            (pointsByDevice[Number(r.fk_device_id)] ??= []).push(r);
        }

        // ---- device -> { "YYYY-MM-DD": km } ----
        const dailyKm = {};

        for (const dev in pointsByDevice) {
            const points = pointsByDevice[dev];
            const perDay = (dailyKm[dev] = {});

            for (let i = 1; i < points.length; i++) {
                const previous = points[i - 1];
                const current = points[i];

                const moving =
                    Number(current.speed) > 0 || Number(current.di1) === 1;
                if (!moving) continue;

                const lat1 = Number(previous.latitude);
                const lon1 = Number(previous.longitude);
                const lat2 = Number(current.latitude);
                const lon2 = Number(current.longitude);

                if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) continue;

                const day = current.day;
                perDay[day] =
                    (perDay[day] ?? 0) + getDistance(lat1, lon1, lat2, lon2);
            }
        }

        // ---- Build response ----
        const devicesSummary = devices.map((d) => {
            const perDay = dailyKm[Number(d.id)] ?? {};

            const daily = dayList.map((date) => ({
                date,
                device_id: Number(d.id),
                vehicle_no: d.vehicle_no,
                km: fmt(perDay[date] ?? 0),
            }));

            const deviceTotal = dayList.reduce(
                (s, date) => s + (perDay[date] ?? 0),
                0
            );

            return {
                device_id: Number(d.id),
                vehicle_no: d.vehicle_no,
                total_km: fmt(deviceTotal),
                daily,
                _total: deviceTotal, // internal, removed below
            };
        });

        const totalKm = devicesSummary.reduce((s, d) => s + d._total, 0);
        devicesSummary.forEach((d) => delete d._total);

        return ResponseService.success(res, "Success", {
            from: fromDay,
            to: toDay,
            total_km: fmt(totalKm),
            devices: devicesSummary,
        });
    } catch (err) {
        console.error("distanceController error:", err);
        return ResponseService.error(res, err.message);
    }
};