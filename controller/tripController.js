import { Op, literal } from "sequelize";
import ResponseService from "../utils/httpService.js";
import { tableEventDataLogModel } from "../models/tableEventDataLogModel.js";
import { customerDeviceModel } from "../models/customerDeviceModel.js";
import { formatDuration, getDistance, toMs } from "../utils/helper.js";
import { buildPaginationMeta, getPagination } from "../utils/paginationService.js";
import { fetchPointsByDevice, parseCommon, parseDeviceIds } from "./commonController.js";

const km2 = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);

const isMoving = (p) => Number(p.di1) === 1 && Number(p.speed) > 0;

const computeTrips = (points, minSeconds, window = null) => {
    const events = [];
    let count = 0;
    let totalSeconds = 0;
    let totalKm = 0;

    const closeSegment = (seg) => {
        const seconds = (toMs(seg.last.time) - toMs(seg.start.time)) / 1000;
        if (seconds < minSeconds) return;

        const index = count;
        count++;
        totalSeconds += seconds;
        totalKm += seg.distance;

        if (window && index >= window.offset && index < window.offset + window.limit) {
            events.push({
                from_time: seg.start.time,
                to_time: seg.last.time,
                duration: formatDuration(seconds),
                distance_km: km2(seg.distance),
                max_speed: seg.maxSpeed,
                start_latitude: seg.start.latitude,
                start_longitude: seg.start.longitude,
                end_latitude: seg.last.latitude,
                end_longitude: seg.last.longitude,
                start_location: null,
                end_location: null,
            });
        }
    };

    let seg = null;
    for (const p of points) {
        if (isMoving(p)) {
            const speed = Number(p.speed) || 0;

            if (!seg) {
                // trip starts at the first moving point
                seg = { start: p, last: p, distance: 0, maxSpeed: speed };
                continue;
            }

            const lat1 = Number(seg.last.latitude);
            const lon1 = Number(seg.last.longitude);
            const lat2 = Number(p.latitude);
            const lon2 = Number(p.longitude);
            if ([lat1, lon1, lat2, lon2].every(Number.isFinite)) {
                seg.distance += getDistance(lat1, lon1, lat2, lon2);
            }

            seg.last = p; // trip ends at the last moving point
            if (speed > seg.maxSpeed) seg.maxSpeed = speed;
        } else if (seg) {
            closeSegment(seg);
            seg = null;
        }
    }
    if (seg) closeSegment(seg); 

    return { count, totalSeconds, totalKm, events };
};
/* =========================================================
   1) SUMMARY: all selected devices, no child data
   ========================================================= */
export const tripReportController = async (req, res) => {
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
            false
        );

        const devicesSummary = [];
        for (const d of devices) {
            const { count, totalSeconds, totalKm } = computeTrips(
                pointsByDevice[Number(d.id)] ?? [],
                minSeconds
            );
            if (!count) continue;

            devicesSummary.push({
                device_id: Number(d.id),
                vehicle_no: d.vehicle_no,
                total_trip_count: count,
                total_trip_duration: formatDuration(totalSeconds),
                total_distance_km: km2(totalKm),
            });
        }

        return ResponseService.success(res, "Success", {
            from: fromStr,
            to: toStr,
            time_duration_minutes: minMinutes,
            devices: devicesSummary,
        });
    } catch (err) {
        console.error("tripReportController error:", err);
        return ResponseService.error(res, err.message);
    }
};

/* =========================================================
   2) DETAIL: one device, paginated trips (on row click)
   ========================================================= */
export const tripDeviceDetailController = async (req, res) => {
    try {
        const common = parseCommon(req.body);
        if (common.error) return ResponseService.error(res, ...common.error);
        const { userId, fromStr, toStr, minMinutes, minSeconds } = common;

        const ids = parseDeviceIds(req.body.deviceId);
        if (ids === null || ids.length !== 1) {
            return ResponseService.error(res, "Exactly one deviceId is required", 400);
        }

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

        const pointsByDevice = await fetchPointsByDevice([deviceId], fromStr, toStr, false);

        const { count, totalSeconds, totalKm, events } = computeTrips(
            pointsByDevice[deviceId] ?? [],
            minSeconds,
            { offset, limit }
        );

        // fetch start/end location only for this page's trips
        if (events.length) {
            const times = [
                ...new Set(events.flatMap((e) => [e.from_time, e.to_time])),
            ];

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
            for (const e of events) {
                e.start_location = locByTime.get(e.from_time) ?? null;
                e.end_location = locByTime.get(e.to_time) ?? null;
            }
        }

        return ResponseService.success(res, "Success", {
            from: fromStr,
            to: toStr,
            time_duration_minutes: minMinutes,
            device_id: deviceId,
            vehicle_no: device.vehicle_no,
            total_trip_count: count,
            total_trip_duration: formatDuration(totalSeconds),
            total_distance_km: km2(totalKm),
            pagination: buildPaginationMeta({ page, limit, total: count }),
            trips: events,
        });
    } catch (err) {
        console.error("tripDeviceDetailController error:", err);
        return ResponseService.error(res, err.message);
    }
};