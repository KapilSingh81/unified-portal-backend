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
                lastName: lastName ?? '',
                email,
                contact: contact ?? '',
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