import "dotenv/config";
import { roleModel, userModel } from "../models/index.js";
import { sequelize } from "../config/db.config.js";
import { QueryTypes } from "sequelize";

const ADMIN_ROLE_NAME = 'Admin';

export const provisionEmployee = async ({ centralUserId, roleId, userName, firstName, lastName, email, contact }) => {
    try {
        const response = await fetch(`${process.env.VAHAN_AUTH_URL}/api/CentralAuth/ProvisionEmployee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', accept: 'text/plain' },
            body: JSON.stringify({
                centralUserId,
                roleId,
                userName,
                firstName,
                lastName: lastName ?? null,
                email,
                contact: contact ?? null,
            }),
            signal: AbortSignal.timeout(10000), 
        });

        const text = await response.text();
        if (!response.ok) {
            return { ok: false, error: `Status ${response.status}: ${text}` };
        }
        return { ok: true, response: text };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const syncUserPermissions = async ({ token, centralUserId, centralRoleId, permissionVersion, permissions }) => {
    try {
        const response = await fetch(`${process.env.VAHAN_AUTH_URL}/api/CentralAuth/SyncUserPermissions`, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                centralUserId,
                centralRoleId,
                permissionVersion,
                permissions: permissions.map((p) => ({
                    centralMenuId: p.menu_id,
                    canView: p.can_view,
                    canAdd: p.can_add,
                    canEdit: p.can_edit,
                    canDelete: p.can_delete,
                })),
            }),
            signal: AbortSignal.timeout(10000),
        });

        const text = await response.text();
        if (!response.ok) {
            return { ok: false, error: `Status ${response.status}: ${text}` };
        }
        return { ok: true, response: text };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export const getActor = async (userId) => {
    const actor = await userModel.findOne({
        where: { id: userId, is_deleted: false, status: true },
        include: [{ model: roleModel, as: 'role', attributes: ['id', 'name'] }],
    });
    if (!actor) return null;
    return { user: actor, isAdmin: actor.role?.name === ADMIN_ROLE_NAME };
};

export const getSubtreeIds = async (rootId) => {
    const rows = await sequelize.query(
        `WITH tree AS (
            SELECT id FROM user_master WHERE parentId = :rootId AND is_deleted = 0
            UNION ALL
            SELECT u.id FROM user_master u
            INNER JOIN tree t ON u.parentId = t.id
            WHERE u.is_deleted = 0
        )
        SELECT id FROM tree OPTION (MAXRECURSION 100)`,
        { replacements: { rootId }, type: QueryTypes.SELECT }
    );
    return rows.map((r) => r.id);
};

export function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

export const isValidDate = (date) => {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date
    );
};

export const formatSQLDate = (date) =>
    date.toISOString().slice(0, 23).replace("T", " ");

export const fmt = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);

export const pad = (n) => String(n).padStart(2, "0");

export const parseDateTime = (value, isEnd) => {
    const m = String(value)
        .trim()
        .match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (!m) return null;

    const [, date, h, mi, s] = m;
    if (!isValidDate(date)) return null;

    let hh, mm, ss;
    if (h === undefined) {
        hh = isEnd ? 23 : 0;
        mm = isEnd ? 59 : 0;
        ss = isEnd ? 59 : 0;
    } else {
        hh = Number(h);
        mm = Number(mi);
        ss = s !== undefined ? Number(s) : isEnd ? 59 : 0;
    }

    if (hh > 23 || mm > 59 || ss > 59) return null;
    return `${date} ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
};

export const toMs = (str) => Date.parse(`${str.replace(" ", "T")}Z`);

export const formatDuration = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};