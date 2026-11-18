import { Op, literal } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { tableEventDataLogModel } from "../models/tableEventDataLogModel.js";
import { customerDeviceModel } from "../models/customerDeviceModel.js";
import { formatDuration, parseDateTime, toMs } from "../utils/helper.js";
import { buildPaginationMeta, getPagination } from "../utils/paginationService.js";


const isIdle = (p) => Number(p.di1) === 1 && !(Number(p.speed) > 0);

// ---- Validate common request fields ----
const parseCommon = (body) => {
    const { userId, fromDate, toDate, timeDuration } = body;

    if (!userId) return { error: ["userId is required", 400] };
    if (!fromDate || !toDate) {
        return { error: ["fromDate and toDate are required", 400] };
    }

    const fromStr = parseDateTime(fromDate, false);
    const toStr = parseDateTime(toDate, true);
    if (!fromStr || !toStr) {
        return { error: ["Date format must be YYYY-MM-DD or YYYY-MM-DD HH:mm", 400] };
    }
    if (fromStr > toStr) return { error: ["Invalid date range", 400] };

    const minMinutes =
        timeDuration === undefined || timeDuration === null || timeDuration === ""
            ? 0
            : Number(timeDuration);
    if (!Number.isFinite(minMinutes) || minMinutes < 0) {
        return { error: ["Invalid timeDuration", 400] };
    }

    return { userId, fromStr, toStr, minMinutes, minSeconds: minMinutes * 60 };
};

// ---- Parse deviceId (array / "1,2" / single) ----
const parseDeviceIds = (deviceId) => {
    const raw = Array.isArray(deviceId)
        ? deviceId
        : deviceId !== undefined && deviceId !== null && deviceId !== ""
            ? String(deviceId).split(",")
            : [];

    const ids = [...new Set(raw.map((id) => Number(String(id).trim())))];
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return null;
    return ids;
};

// ---- Fetch raw points, grouped by device ----
const fetchPointsByDevice = async (deviceIds, fromStr, toStr, withLocation) => {
    const rows = await tableEventDataLogModel.findAll({
        attributes: [
            "fk_device_id",
            "latitude",
            "longitude",
            ...(withLocation ? ["location"] : []),
            "speed",
            "di1",
            [literal("CONVERT(varchar(19), time_stamp, 120)"), "time"],
        ],
        where: {
            fk_device_id: { [Op.in]: deviceIds },
            time_stamp: {
                [Op.gte]: literal(`CONVERT(datetime, '${fromStr}.000', 121)`),
                [Op.lte]: literal(`CONVERT(datetime, '${toStr}.997', 121)`),
            },
        },
        order: [
            ["fk_device_id", "ASC"],
            ["time_stamp", "ASC"],
        ],
        raw: true,
    });

    const byDevice = {};
    for (const r of rows) {
        (byDevice[Number(r.fk_device_id)] ??= []).push(r);
    }
    return byDevice;
};

// ---- Idle segments for one device ----
// End time = last point where di1 = 1 and speed = 0
const computeIdle = (points, minSeconds, window = null) => {
    const events = [];
    let count = 0;
    let totalSeconds = 0;

    const closeSegment = (seg) => {
        const endTime = seg.last.time;
        const seconds = (toMs(endTime) - toMs(seg.start.time)) / 1000;
        if (seconds < minSeconds) return;

        const index = count;
        count++;
        totalSeconds += seconds;

        if (window && index >= window.offset && index < window.offset + window.limit) {
            events.push({
                from_time: seg.start.time,
                to_time: endTime,
                duration: formatDuration(seconds),
                latitude: seg.start.latitude,
                longitude: seg.start.longitude,
                location: null,
            });
        }
    };

    let seg = null;
    for (const p of points) {
        if (isIdle(p)) {
            if (!seg) seg = { start: p, last: p };
            else seg.last = p;
        } else if (seg) {
            closeSegment(seg);
            seg = null;
        }
    }
    if (seg) closeSegment(seg);

    return { count, totalSeconds, events };
};

/* =========================================================
   1) SUMMARY: all selected devices, no child data
   ========================================================= */
export const idleReportController = async (req, res) => {
    try {
        const common = parseCommon(req.body);
        if (common.error) return ResponseService.error(res, ...common.error);
        const { userId, fromStr, toStr, minMinutes, minSeconds } = common;

        const deviceWhere = { CentralUserId: userId };
        const parsedDeviceIds = parseDeviceIds(req.body.deviceId);
        if (parsedDeviceIds === null) {
            return ResponseService.error(res, "Invalid deviceId", 400);
        }
        if (parsedDeviceIds.length) {
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

        const pointsByDevice = await fetchPointsByDevice(
            devices.map((d) => Number(d.id)),
            fromStr,
            toStr,
            false // location not needed for summary
        );

        const devicesSummary = [];
        for (const d of devices) {
            const { count, totalSeconds } = computeIdle(
                pointsByDevice[Number(d.id)] ?? [],
                minSeconds,
                false
            );
            if (!count) continue;

            devicesSummary.push({
                device_id: Number(d.id),
                vehicle_no: d.vehicle_no,
                total_idle_count: count,
                total_idle_duration: formatDuration(totalSeconds),
            });
        }

        return ResponseService.success(res, "Success", {
            from: fromStr,
            to: toStr,
            time_duration_minutes: minMinutes,
            devices: devicesSummary,
        });
    } catch (err) {
        console.error("idleReportController error:", err);
        return ResponseService.error(res, err.message);
    }
};

/* =========================================================
   2) DETAIL: one device, all idle events (on row click)
   ========================================================= */

export const idleDeviceDetailController = async (req, res) => {
    try {
        const common = parseCommon(req.body);
        if (common.error) return ResponseService.error(res, ...common.error);
        const { userId, fromStr, toStr, minMinutes, minSeconds } = common;

        const ids = parseDeviceIds(req.body.deviceId);
        if (ids === null || ids.length !== 1) {
            return ResponseService.error(res, "Exactly one deviceId is required", 400);
        }

        // ---- Pagination (common service) ----
        const { page, limit, offset } = getPagination(req.body);

        const device = await customerDeviceModel.findOne({
            attributes: ["id", "vehicle_no"],
            where: { CentralUserId: userId, id: ids[0] },
            raw: true,
        });
        if (!device) {
            return ResponseService.error(res, "No device found", 404);
        }

        const deviceId = Number(device.id);

        // bulk scan WITHOUT location (lighter)
        const pointsByDevice = await fetchPointsByDevice([deviceId], fromStr, toStr, false);

        const { count, totalSeconds, events } = computeIdle(
            pointsByDevice[deviceId] ?? [],
            minSeconds,
            { offset, limit }
        );

        // fetch location only for this page's events
        if (events.length) {
            const times = [...new Set(events.map((e) => e.from_time))];

            const locRows = await tableEventDataLogModel.findAll({
                attributes: [
                    "location",
                    [literal("CONVERT(varchar(19), time_stamp, 120)"), "time"],
                ],
                where: {
                    fk_device_id: deviceId,
                    time_stamp: {
                        [Op.gte]: literal(`CONVERT(datetime, '${fromStr}.000', 121)`),
                        [Op.lte]: literal(`CONVERT(datetime, '${toStr}.997', 121)`),
                    },
                    [Op.and]: [literal("CONVERT(varchar(19), time_stamp, 120) IN (:times)")],
                },
                replacements: { times },
                raw: true,
            });

            const locByTime = new Map();
            for (const r of locRows) {
                if (!locByTime.has(r.time)) locByTime.set(r.time, r.location);
            }
            for (const e of events) e.location = locByTime.get(e.from_time) ?? null;
        }

        return ResponseService.success(res, "Success", {
            from: fromStr,
            to: toStr,
            time_duration_minutes: minMinutes,
            device_id: deviceId,
            vehicle_no: device.vehicle_no,
            total_idle_count: count,
            total_idle_duration: formatDuration(totalSeconds),
            pagination: buildPaginationMeta({ page, limit, total: count }),
            idle: events,
        });
    } catch (err) {
        console.error("idleDeviceDetailController error:", err);
        return ResponseService.error(res, err.message);
    }
};