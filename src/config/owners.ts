export const OWNER_IDS = [
    '848398230378250261',
    '1154112118480703668',
    '183266834789826560',
    '1452866261259255901',
] as const;

export type OwnerId = typeof OWNER_IDS[number];

export const OWNER_MENTIONS = OWNER_IDS.map(id => `<@${id}>`).join(', ').replace(/, ([^,]*)$/, ' e $1');

export function isOwner(userId: string): boolean {
    return OWNER_IDS.includes(userId as OwnerId);
}
