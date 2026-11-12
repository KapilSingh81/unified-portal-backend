import "dotenv/config";

export const provisionEmployee = async ({ centralUserId, roleId, userName, firstName, lastName, email, contact }) => {
    try {
        const response = await fetch(`${process.env.CENTRAL_AUTH_URL}/api/CentralAuth/ProvisionEmployee`, {
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
        const response = await fetch(`${process.env.CENTRAL_AUTH_URL}/api/CentralAuth/SyncUserPermissions`, {
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