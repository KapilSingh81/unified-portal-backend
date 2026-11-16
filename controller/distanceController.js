import { Op, literal } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { tableEventDataLogModel } from "../models/tableEventDataLogModel.js";
import { customerDeviceModel } from "../models/customerDeviceModel.js";

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

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

        const isValidDate = (date) => {
            const parsed = new Date(`${date}T00:00:00.000Z`);

            return (
                !Number.isNaN(parsed.getTime()) &&
                parsed.toISOString().slice(0, 10) === date
            );
        };

        if (!isValidDate(fromDay) || !isValidDate(toDay)) {
            return ResponseService.error(res, "Invalid date value", 400);
        }

        if (fromDay > toDay) {
            return ResponseService.error(res, "Invalid date range", 400);
        }

        const startDate = new Date(`${fromDay}T00:00:00.000Z`);

        const endDate = new Date(`${toDay}T00:00:00.000Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const formatSQLDate = (date) => {
            return date.toISOString().slice(0, 23).replace("T", " ");
        };

        const fromStr = formatSQLDate(startDate);
        const toStr = formatSQLDate(endDate);

        const deviceWhere = {
            CentralUserId: userId
        };

        const rawDeviceIds = Array.isArray(deviceId)
            ? deviceId
            : deviceId !== undefined && deviceId !== null && deviceId !== ""
                ? String(deviceId).split(",")
                : [];

        if (rawDeviceIds.length) {
            const parsedDeviceIds = [
                ...new Set(rawDeviceIds.map((id) => Number(String(id).trim())))
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

        const deviceMap = new Map(
            devices.map((d) => [Number(d.id), d.vehicle_no])
        );

        const rows = await tableEventDataLogModel.findAll({
            attributes: [
                "fk_device_id",
                "time_stamp",
                "latitude",
                "longitude",
                "speed",
                "di1"
            ],
            where: {
                fk_device_id: {
                    [Op.in]: [...deviceMap.keys()]
                },
                time_stamp: {
                    [Op.gte]: literal(`CONVERT(datetime, '${fromStr}', 121)`),
                    [Op.lt]: literal(`CONVERT(datetime, '${toStr}', 121)`)
                },
                latitude: {
                    [Op.ne]: null
                },
                longitude: {
                    [Op.ne]: null
                }
            },
            order: [
                ["fk_device_id", "ASC"],
                ["time_stamp", "ASC"]
            ],
            raw: true,
        });

        const grouped = {};

        for (const r of rows) {
            const dev = Number(r.fk_device_id);
            const timestamp = new Date(r.time_stamp);

            if (Number.isNaN(timestamp.getTime())) {
                continue;
            }

            const day = [
                timestamp.getUTCFullYear(),
                String(timestamp.getUTCMonth() + 1).padStart(2, "0"),
                String(timestamp.getUTCDate()).padStart(2, "0")
            ].join("-");

            ((grouped[dev] ??= {})[day] ??= []).push(r);
        }

        const deviceTotals = {};

        for (const dev in grouped) {
            for (const day in grouped[dev]) {
                const points = grouped[dev][day];

                let distance = 0;

                for (let i = 1; i < points.length; i++) {
                    const previous = points[i - 1];
                    const current = points[i];

                    const moving =
                        Number(current.speed) > 0 ||
                        Number(current.di1) === 1;

                    if (!moving) continue;

                    const lat1 = Number(previous.latitude);
                    const lon1 = Number(previous.longitude);
                    const lat2 = Number(current.latitude);
                    const lon2 = Number(current.longitude);

                    if (
                        !Number.isFinite(lat1) ||
                        !Number.isFinite(lon1) ||
                        !Number.isFinite(lat2) ||
                        !Number.isFinite(lon2)
                    ) {
                        continue;
                    }

                    distance += getDistance(lat1, lon1, lat2, lon2);
                }

                deviceTotals[dev] = (deviceTotals[dev] ?? 0) + distance;
            }
        }

        const devicesSummary = devices.map((d) => ({
            device_id: d.id,
            vehicle_no: d.vehicle_no,
            total_km: Number((deviceTotals[d.id] ?? 0).toFixed(2))
        }));

        const totalKm = devicesSummary.reduce(
            (sum, d) => sum + d.total_km,
            0
        );

        return ResponseService.success(res, "Success", {
            from: fromDay,
            to: toDay,
            total_km: Number(totalKm.toFixed(2)),
            devices: devicesSummary,
        });

    } catch (err) {
        console.error("distanceController error:", err);

        return ResponseService.error(res, err.message);
    }
};