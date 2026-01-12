export const OWNER_IDS = [
    '848398230378250261',  // KADIMA
    '1154112118480703668',  // TUDAS
    // '183266834789826560',   // DANTZ
    '1452866261259255901',  // DARK VADIA
    '635999135022972948',  // PIPPO
    '1367315564732612629',  // S2UPRA
] as const;

export type OwnerId = typeof OWNER_IDS[number];

export const OWNER_MENTIONS = OWNER_IDS.map(id => `<@${id}>`).join(', ').replace(/, ([^,]*)$/, ' e $1');

export function isOwner(userId: string): boolean {
    return OWNER_IDS.includes(userId as OwnerId);
}
