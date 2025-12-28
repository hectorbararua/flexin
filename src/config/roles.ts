export const STAFF_ROLES = {
    ADMIN: '1453512381530505247',
    MODERATOR: '1453031898719850658',
    STAFF: '1453076524797395116',
    HELPER: '1453512385888256219',
} as const;

export const VERIFICATION_ROLES = {
    UNVERIFIED: '1453415802723373197',
    VERIFIED: '1453415846188810350',
} as const;

export const SPECIAL_ROLES = {
    MVP: '1453062885721772234',
} as const;

export const PERMISSION_GROUPS = {
    BAN_PERMISSION: [
        STAFF_ROLES.MODERATOR,
        STAFF_ROLES.ADMIN,
        STAFF_ROLES.HELPER,
    ],
    UNBAN_ALL_PERMISSION: [STAFF_ROLES.ADMIN],
    VERIFIER_ROLES: [
        STAFF_ROLES.ADMIN,
        STAFF_ROLES.MODERATOR,
        STAFF_ROLES.HELPER,
    ],
    CAN_MANAGE_VERIFICATION: [STAFF_ROLES.ADMIN],
} as const;

export function hasAnyRole(memberRoles: Set<string> | Map<string, unknown>, roleIds: readonly string[]): boolean {
    if (memberRoles instanceof Map) {
        return roleIds.some(roleId => memberRoles.has(roleId));
    }
    return roleIds.some(roleId => memberRoles.has(roleId));
}
