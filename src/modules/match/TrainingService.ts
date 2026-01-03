import { Training, Team, MatchBracket, POINTS } from './types';
import { RankingService } from '../ranking/RankingService';
import { mvpService } from '../mvp/MvpService';
import { captainsRepository } from '../captains/CaptainsRepository';
import { Client, Guild, TextChannel, VoiceChannel } from 'discord.js';
import { CHANNEL_IDS } from '../../config';
import { TEAM_VOICE_CHANNELS } from './constants';
import * as fs from 'fs';
import * as path from 'path';

const TRAININGS_FILE = path.join(process.cwd(), 'data', 'trainings.json');

export class TrainingService {
    private trainings: Map<string, Training> = new Map();
    private rankingService: RankingService;
    private pendingTeamCount: Map<string, number> = new Map();
    private pendingCaptainLimit: Map<string, number> = new Map();
    private pendingSwap: Map<string, { playerId: string; teamId: number }> = new Map();
    private memberNameCache: Map<string, { name: string; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor() {
        this.rankingService = new RankingService();
        this.loadTrainings();
    }

    async getMemberName(guild: Guild, playerId: string): Promise<string> {
        const cached = this.memberNameCache.get(playerId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.name;
        }

        try {
            const member = await guild.members.fetch(playerId);
            const name = member.displayName || member.user.username;
            this.memberNameCache.set(playerId, { name, timestamp: Date.now() });
            return name;
        } catch {
            return 'Desconhecido';
        }
    }

    async getMemberNames(guild: Guild, playerIds: string[]): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        const toFetch: string[] = [];

        for (const id of playerIds) {
            const cached = this.memberNameCache.get(id);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                result.set(id, cached.name);
            } else {
                toFetch.push(id);
            }
        }

        await Promise.all(
            toFetch.map(async (id) => {
                const name = await this.getMemberName(guild, id);
                result.set(id, name);
            })
        );

        return result;
    }

    findTrainingMessage(messageId: string): string | undefined {
        if (this.trainings.has(messageId)) {
            return messageId;
        }
        return undefined;
    }

    private loadTrainings(): void {
        try {
            if (fs.existsSync(TRAININGS_FILE)) {
                const data = JSON.parse(fs.readFileSync(TRAININGS_FILE, 'utf-8'));
                const now = Date.now();
                const MAX_AGE = 24 * 60 * 60 * 1000;

                for (const [key, value] of Object.entries(data.trainings || {})) {
                    const training = value as Training;
                    if (training.participants.length === 0 && training.status === 'inscricao') {
                        continue;
                    }
                    this.trainings.set(key, training);
                }
                for (const [key, value] of Object.entries(data.pendingTeamCount || {})) {
                    if (this.trainings.has(key)) {
                        this.pendingTeamCount.set(key, value as number);
                    }
                }
                for (const [key, value] of Object.entries(data.pendingCaptainLimit || {})) {
                    if (this.trainings.has(key)) {
                        this.pendingCaptainLimit.set(key, value as number);
                    }
                }
            }
        } catch {}
    }

    cleanupOldTrainings(): void {
        const toDelete: string[] = [];
        const now = Date.now();
        const MAX_AGE_EMPTY = 30 * 60 * 1000;
        const MAX_AGE_OLD = 12 * 60 * 60 * 1000;

        for (const [id, training] of this.trainings) {
            const age = training.createdAt ? now - training.createdAt : MAX_AGE_OLD + 1;
            
            if (training.participants.length === 0 && training.status === 'inscricao') {
                toDelete.push(id);
            }
            else if (age > MAX_AGE_EMPTY && training.participants.length === 0) {
                toDelete.push(id);
            }
            else if (age > MAX_AGE_OLD && training.status !== 'andamento') {
                toDelete.push(id);
            }
        }
        
        for (const id of toDelete) {
            this.trainings.delete(id);
            this.pendingTeamCount.delete(id);
            this.pendingCaptainLimit.delete(id);
            this.pendingSwap.delete(id);
        }
        
        if (toDelete.length > 0) {
            this.saveTrainings();
        }
    }

    private saveTrainings(): void {
        try {
            const dir = path.dirname(TRAININGS_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const data = {
                trainings: Object.fromEntries(this.trainings),
                pendingTeamCount: Object.fromEntries(this.pendingTeamCount),
                pendingCaptainLimit: Object.fromEntries(this.pendingCaptainLimit),
            };
            fs.writeFileSync(TRAININGS_FILE, JSON.stringify(data, null, 2));
        } catch {}
    }

    setPendingTeamCount(messageId: string, count: number): void {
        this.pendingTeamCount.set(messageId, count);
    }

    getPendingTeamCount(messageId: string): number | undefined {
        return this.pendingTeamCount.get(messageId);
    }

    setPendingCaptainLimit(messageId: string, limit: number): void {
        this.pendingCaptainLimit.set(messageId, limit);
    }

    getPendingCaptainLimit(messageId: string): number | undefined {
        return this.pendingCaptainLimit.get(messageId);
    }

    setSelectedCaptains(messageId: string, captains: string[]): void {
        const training = this.trainings.get(messageId);
        if (training) {
            training.selectedCaptains = captains;
        }
    }

    getCaptainsParticipating(messageId: string): string[] {
        const training = this.trainings.get(messageId);
        if (!training) return [];
        
        const globalCaptains = captainsRepository.getAll();
        return training.participants.filter(p => globalCaptains.includes(p));
    }

    getRequiredCaptains(teamCount: number, limit: number): number {
        if (limit === 0 || limit === 99) return 0;
        return teamCount * limit;
    }

    createTraining(messageId: string): Training {
        this.cleanupOldTrainings();
        
        const training: Training = {
            messageId,
            participants: [],
            teams: [],
            brackets: [],
            currentBracketIndex: 0,
            highlights: [],
            status: 'inscricao',
            createdAt: Date.now(),
        };

        this.trainings.set(messageId, training);
        this.saveTrainings();
        return training;
    }

    getTraining(messageId: string): Training | undefined {
        return this.trainings.get(messageId);
    }

    updateMessageId(oldId: string, newId: string): void {
        const training = this.trainings.get(oldId);
        if (training) {
            training.messageId = newId;
            this.trainings.delete(oldId);
            this.trainings.set(newId, training);

            const teamCount = this.pendingTeamCount.get(oldId);
            if (teamCount) {
                this.pendingTeamCount.delete(oldId);
                this.pendingTeamCount.set(newId, teamCount);
            }

            const captainLimit = this.pendingCaptainLimit.get(oldId);
            if (captainLimit) {
                this.pendingCaptainLimit.delete(oldId);
                this.pendingCaptainLimit.set(newId, captainLimit);
            }

            this.saveTrainings();
        }
    }

    addParticipant(messageId: string, playerId: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training || training.status !== 'inscricao') return false;

        if (!training.participants.includes(playerId)) {
            training.participants.push(playerId);
            this.saveTrainings();
            return true;
        }
        return false;
    }

    removeParticipant(messageId: string, playerId: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training || training.status !== 'inscricao') return false;

        const index = training.participants.indexOf(playerId);
        if (index !== -1) {
            training.participants.splice(index, 1);
            this.saveTrainings();
            return true;
        }
        return false;
    }

    swapPlayers(messageId: string, player1Id: string, player2Id: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        let team1: Team | undefined;
        let team2: Team | undefined;

        for (const team of training.teams) {
            if (team.players.includes(player1Id)) team1 = team;
            if (team.players.includes(player2Id)) team2 = team;
        }

        if (!team1 || !team2 || team1.id === team2.id) return false;

        const idx1 = team1.players.indexOf(player1Id);
        const idx2 = team2.players.indexOf(player2Id);

        team1.players[idx1] = player2Id;
        team2.players[idx2] = player1Id;

        this.saveTrainings();
        return true;
    }

    addPlayerToTeam(messageId: string, playerId: string, teamId: number): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        const team = training.teams.find(t => t.id === teamId);
        if (!team) return false;

        if (!training.participants.includes(playerId)) {
            training.participants.push(playerId);
        }

        if (!team.players.includes(playerId)) {
            team.players.push(playerId);
            this.saveTrainings();
            return true;
        }
        return false;
    }

    removePlayerFromTeam(messageId: string, playerId: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        for (const team of training.teams) {
            const idx = team.players.indexOf(playerId);
            if (idx !== -1) {
                team.players.splice(idx, 1);
                const partIdx = training.participants.indexOf(playerId);
                if (partIdx !== -1) {
                    training.participants.splice(partIdx, 1);
                }
                this.saveTrainings();
                return true;
            }
        }
        return false;
    }

    getPlayerTeam(messageId: string, playerId: string): Team | undefined {
        const training = this.trainings.get(messageId);
        if (!training) return undefined;

        return training.teams.find(t => t.players.includes(playerId));
    }

    setPendingSwap(messageId: string, playerId: string, teamId: number): void {
        this.pendingSwap.set(messageId, { playerId, teamId });
    }

    getPendingSwap(messageId: string): { playerId: string; teamId: number } | undefined {
        return this.pendingSwap.get(messageId);
    }

    clearPendingSwap(messageId: string): void {
        this.pendingSwap.delete(messageId);
    }

    async moveTeamsToVoiceChannels(guild: Guild): Promise<{ moved: number; failed: number }> {
        let moved = 0;
        let failed = 0;

        for (const training of this.trainings.values()) {
            if (training.status !== 'andamento' && training.status !== 'sorteio') continue;

            for (const team of training.teams) {
                const channelId = TEAM_VOICE_CHANNELS[team.id as keyof typeof TEAM_VOICE_CHANNELS];
                if (!channelId) continue;

                try {
                    const voiceChannel = await guild.channels.fetch(channelId) as VoiceChannel;
                    if (!voiceChannel) continue;

                    for (const playerId of team.players) {
                        try {
                            const member = await guild.members.fetch(playerId);
                            if (member.voice.channel) {
                                await member.voice.setChannel(voiceChannel);
                                moved++;
                            }
                        } catch {
                            failed++;
                        }
                    }
                } catch {
                    failed += team.players.length;
                }
            }
        }

        return { moved, failed };
    }

    async moveTrainingTeamsToVoice(messageId: string, guild: Guild): Promise<{ moved: number; failed: number }> {
        const training = this.trainings.get(messageId);
        if (!training) return { moved: 0, failed: 0 };

        let moved = 0;
        let failed = 0;

        for (const team of training.teams) {
            const channelId = TEAM_VOICE_CHANNELS[team.id as keyof typeof TEAM_VOICE_CHANNELS];
            if (!channelId) continue;

            try {
                const voiceChannel = await guild.channels.fetch(channelId) as VoiceChannel;
                if (!voiceChannel) continue;

                for (const playerId of team.players) {
                    try {
                        const member = await guild.members.fetch(playerId);
                        if (member.voice.channel) {
                            await member.voice.setChannel(voiceChannel);
                            moved++;
                        }
                    } catch {
                        failed++;
                    }
                }
            } catch {
                failed += team.players.length;
            }
        }

        return { moved, failed };
    }

    shuffleTeams(messageId: string, teamCount: number, captainLimit?: number): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        if (captainLimit !== undefined) {
            training.captainLimit = captainLimit;
        }
        const limit = training.captainLimit ?? 0;

        const selectedCaptains = training.selectedCaptains || [];

        const shuffle = (arr: string[]) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        const teams: Team[] = [];
        for (let i = 0; i < teamCount; i++) {
            teams.push({
                id: i + 1,
                name: `Time ${i + 1}`,
                players: [],
            });
        }

        const playersPerTeam = training.participants.length / teamCount;

        if (limit === 0) {
            const allPlayers = shuffle([...training.participants]);
            let teamIndex = 0;
            for (const player of allPlayers) {
                while (teams[teamIndex].players.length >= playersPerTeam) {
                    teamIndex = (teamIndex + 1) % teamCount;
                }
                teams[teamIndex].players.push(player);
                teamIndex = (teamIndex + 1) % teamCount;
            }
        } else {
            const captainPlayers = shuffle([...selectedCaptains]);
            const normalPlayers = shuffle(training.participants.filter(p => !selectedCaptains.includes(p)));

            if (limit === 99) {
                let teamIndex = 0;
                for (const player of captainPlayers) {
                    teams[teamIndex].players.push(player);
                    teamIndex = (teamIndex + 1) % teamCount;
                }
            } else {
                let teamIndex = 0;
                for (const player of captainPlayers) {
                    const teamCaptainCount = teams[teamIndex].players.filter(p => selectedCaptains.includes(p)).length;
                    
                    if (teamCaptainCount < limit) {
                        teams[teamIndex].players.push(player);
                    } else {
                        let placed = false;
                        for (let i = 0; i < teamCount; i++) {
                            const idx = (teamIndex + i) % teamCount;
                            const count = teams[idx].players.filter(p => selectedCaptains.includes(p)).length;
                            if (count < limit) {
                                teams[idx].players.push(player);
                                placed = true;
                                break;
                            }
                        }
                        if (!placed) {
                            teams[teamIndex].players.push(player);
                        }
                    }
                    teamIndex = (teamIndex + 1) % teamCount;
                }
            }

            let teamIndex = 0;
            for (const player of normalPlayers) {
                while (teams[teamIndex].players.length >= playersPerTeam) {
                    teamIndex = (teamIndex + 1) % teamCount;
                }
                teams[teamIndex].players.push(player);
                teamIndex = (teamIndex + 1) % teamCount;
            }
        }

        training.teams = teams;
        training.brackets = this.generateBrackets(teamCount);
        training.status = 'sorteio';

        this.saveTrainings();
        return true;
    }

    private generateBrackets(teamCount: number): MatchBracket[] {
        const brackets: MatchBracket[] = [];
        
        const teamIds = Array.from({ length: teamCount }, (_, i) => i + 1);
        for (let i = teamIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
        }

        switch (teamCount) {
            case 2:
                brackets.push({ team1: teamIds[0], team2: teamIds[1], phase: 'Final' });
                break;
            case 3:
                brackets.push({ team1: teamIds[0], team2: teamIds[1], phase: 'Semifinal' });
                brackets.push({ team1: -1, team2: teamIds[2], phase: 'Final' });
                break;
            case 4:
                brackets.push({ team1: teamIds[0], team2: teamIds[1], phase: 'Semifinal 1' });
                brackets.push({ team1: teamIds[2], team2: teamIds[3], phase: 'Semifinal 2' });
                brackets.push({ team1: -1, team2: -2, phase: 'Final' });
                break;
            case 5:
                brackets.push({ team1: teamIds[0], team2: teamIds[1], phase: 'Quartas 1' });
                brackets.push({ team1: teamIds[2], team2: teamIds[3], phase: 'Quartas 2' });
                brackets.push({ team1: -1, team2: teamIds[4], phase: 'Semifinal 1' });
                brackets.push({ team1: -2, team2: -3, phase: 'Semifinal 2' });
                brackets.push({ team1: -3, team2: -4, phase: 'Final' });
                break;
            case 6:
                brackets.push({ team1: teamIds[0], team2: teamIds[1], phase: 'Quartas 1' });
                brackets.push({ team1: teamIds[2], team2: teamIds[3], phase: 'Quartas 2' });
                brackets.push({ team1: teamIds[4], team2: teamIds[5], phase: 'Quartas 3' });
                brackets.push({ team1: -1, team2: -2, phase: 'Semifinal 1' });
                brackets.push({ team1: -3, team2: -1, phase: 'Semifinal 2' });
                brackets.push({ team1: -4, team2: -5, phase: 'Final' });
                break;
        }

        return brackets;
    }

    confirmTeams(messageId: string): void {
        const training = this.trainings.get(messageId);
        if (training) {
            training.status = 'andamento';
            training.currentBracketIndex = 0;
            this.saveTrainings();
        }
    }

    revertToSorteio(messageId: string): void {
        const training = this.trainings.get(messageId);
        if (training) {
            training.status = 'sorteio';
            for (const bracket of training.brackets) {
                bracket.winner = undefined;
                bracket.roomCode = undefined;
            }
            training.champion = undefined;
            this.saveTrainings();
        }
    }

    getCurrentBracket(messageId: string): MatchBracket | undefined {
        const training = this.trainings.get(messageId);
        if (!training) return undefined;

        return training.brackets[training.currentBracketIndex];
    }

    getPendingBracketsForCurrentPhase(training: Training): MatchBracket[] {
        const pendingBrackets = training.brackets.filter(b => !b.winner);
        if (pendingBrackets.length === 0) return [];

        const currentPhase = pendingBrackets[0].phase.split(' ')[0];
        
        return training.brackets.filter(b => {
            const bracketPhase = b.phase.split(' ')[0];
            return bracketPhase === currentPhase && this.canPlayBracket(training, b);
        });
    }

    private canPlayBracket(training: Training, bracket: MatchBracket): boolean {
        const team1Ready = bracket.team1 > 0 || this.getTeamForBracket(training, bracket.team1) !== undefined;
        const team2Ready = bracket.team2 > 0 || this.getTeamForBracket(training, bracket.team2) !== undefined;
        return team1Ready && team2Ready;
    }

    getBracketIndex(training: Training, team1: number, team2: number): number {
        return training.brackets.findIndex(b => b.team1 === team1 && b.team2 === team2);
    }

    getTeamForBracket(training: Training, teamRef: number): Team | undefined {
        if (teamRef > 0) {
            return training.teams.find(t => t.id === teamRef);
        } else {
            const bracketIndex = Math.abs(teamRef) - 1;
            const previousBracket = training.brackets[bracketIndex];
            if (previousBracket?.winner) {
                return training.teams.find(t => t.id === previousBracket.winner);
            }
        }
        return undefined;
    }

    setWinner(messageId: string, bracketIndex: number, winnerId: number): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        const bracket = training.brackets[bracketIndex];
        if (!bracket) return false;

        bracket.winner = winnerId;

        const allResolved = training.brackets.every(b => b.winner !== undefined);
        if (allResolved) {
            const finalBracket = training.brackets[training.brackets.length - 1];
            training.champion = finalBracket.winner;
            training.status = 'finalizado';
        }

        this.saveTrainings();
        return true;
    }

    clearWinner(messageId: string, bracketIndex: number): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        const bracket = training.brackets[bracketIndex];
        if (!bracket || !bracket.winner) return false;

        bracket.winner = undefined;

        if (training.status === 'finalizado') {
            training.status = 'andamento';
            training.champion = undefined;
        }

        for (let i = bracketIndex + 1; i < training.brackets.length; i++) {
            const nextBracket = training.brackets[i];
            if (nextBracket.team1 === -(bracketIndex + 1) || nextBracket.team2 === -(bracketIndex + 1)) {
                nextBracket.winner = undefined;
            }
        }

        this.saveTrainings();
        return true;
    }

    getResolvedBrackets(messageId: string): { bracketIndex: number; phaseName: string; winnerName: string }[] {
        const training = this.trainings.get(messageId);
        if (!training) return [];

        return training.brackets
            .map((bracket, index) => {
                if (!bracket.winner) return null;
                const winnerTeam = training.teams.find(t => t.id === bracket.winner);
                return {
                    bracketIndex: index,
                    phaseName: bracket.phase,
                    winnerName: winnerTeam?.name || 'Desconhecido',
                };
            })
            .filter((b): b is { bracketIndex: number; phaseName: string; winnerName: string } => b !== null);
    }

    isPhaseComplete(training: Training): boolean {
        const pendingBrackets = this.getPendingBracketsForCurrentPhase(training);
        return pendingBrackets.every(b => b.winner !== undefined);
    }

    setRoomCode(messageId: string, bracketIndex: number, roomCode: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        const bracket = training.brackets[bracketIndex];
        if (!bracket) return false;

        bracket.roomCode = roomCode;
        this.saveTrainings();
        return true;
    }

    addHighlight(messageId: string, playerId: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        if (!training.highlights.includes(playerId)) {
            training.highlights.push(playerId);
            this.saveTrainings();
            return true;
        }
        return false;
    }

    removeHighlight(messageId: string, playerId: string): boolean {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        const index = training.highlights.indexOf(playerId);
        if (index !== -1) {
            training.highlights.splice(index, 1);
            this.saveTrainings();
            return true;
        }
        return false;
    }

    async setMvp(messageId: string, playerId: string, guild: Guild, client: Client): Promise<boolean> {
        const training = this.trainings.get(messageId);
        if (!training) return false;

        training.mvpId = playerId;
        this.saveTrainings();

        let username = playerId;
        try {
            const member = await guild.members.fetch(playerId);
            username = member.displayName || member.user.username;
        } catch {}

        await mvpService.addMvp(playerId, username, client);

        return true;
    }

    async finalizeTraining(messageId: string, guild: Guild, client: Client): Promise<void> {
        const training = this.trainings.get(messageId);
        if (!training || !training.champion) return;

        const championTeam = training.teams.find(t => t.id === training.champion);
        if (championTeam) {
            championTeam.players.forEach(playerId => {
                this.rankingService.addWinnerPoints([playerId]);
            });
        }

        training.highlights.forEach(playerId => {
            this.rankingService.addPoints(playerId, POINTS.HIGHLIGHT);
        });

        if (training.mvpId) {
            this.rankingService.addPoints(training.mvpId, POINTS.MVP);
        }

        await this.sendTrainingSummary(training, guild, client);

        this.trainings.delete(messageId);
        this.pendingTeamCount.delete(messageId);
        this.pendingCaptainLimit.delete(messageId);
        this.pendingSwap.delete(messageId);
        this.saveTrainings();
    }

    private async sendTrainingSummary(training: Training, guild: Guild, client: Client): Promise<void> {
        const channel = await client.channels.fetch(CHANNEL_IDS.TREINO_RESUMO) as TextChannel;
        if (!channel) return;

        const playersPerTeam = training.teams[0]?.players.length || 0;
        const matchType = `${playersPerTeam}V${playersPerTeam}`;

        const teamEmojis = ['⚫', '⚪', '⚫', '⚪', '⚫', '⚪'];

        const getPlayerNames = async (playerIds: string[]): Promise<string> => {
            const names: string[] = [];
            for (const id of playerIds) {
                try {
                    const member = await guild.members.fetch(id);
                    names.push(member.displayName || member.user.username);
                } catch {
                    names.push(`<@${id}>`);
                }
            }
            return names.join(', ');
        };

        let teamsText = '**TIMES**\n';
        for (let i = 0; i < training.teams.length; i++) {
            const team = training.teams[i];
            const emoji = teamEmojis[i] || '⚪';
            const playerNames = await getPlayerNames(team.players);
            teamsText += `> ${emoji} ${team.name} › ${playerNames}\n`;
        }

        const groupByPhase = (brackets: MatchBracket[]) => {
            const phases: Map<string, MatchBracket[]> = new Map();
            for (const bracket of brackets) {
                const phaseName = bracket.phase.split(' ')[0];
                if (!phases.has(phaseName)) {
                    phases.set(phaseName, []);
                }
                phases.get(phaseName)!.push(bracket);
            }
            return phases;
        };

        const phases = groupByPhase(training.brackets);
        let matchesText = '';

        for (const [phaseName, brackets] of phases) {
            const isFinal = phaseName === 'Final';
            const separator = isFinal ? '───── 🔥 FINAL ─────' : `───── ⚔️ ${phaseName.toUpperCase()}S ─────`;
            matchesText += `\n${separator}\n\n`;

            for (const bracket of brackets) {
                const team1 = this.getTeamForBracket(training, bracket.team1);
                const team2 = this.getTeamForBracket(training, bracket.team2);
                const winnerTeam = training.teams.find(t => t.id === bracket.winner);

                const phaseLabel = brackets.length > 1 ? `**${bracket.phase.replace(phaseName, '').trim() || phaseName}** • ` : '';
                const winEmoji = isFinal ? '👑' : '✅';

                matchesText += `${phaseLabel}${team1?.name || '?'} vs ${team2?.name || '?'} → **${winnerTeam?.name || '?'}** ${winEmoji}\n`;
            }
        }

        const championTeam = training.teams.find(t => t.id === training.champion);

        let premiacaoText = '\n───── 🏅 PREMIAÇÃO ─────\n\n';
        premiacaoText += `👑 Campeão: **${championTeam?.name || '?'}**\n`;
        
        if (training.mvpId) {
            premiacaoText += `⭐ MVP: <@${training.mvpId}>\n`;
        }

        if (training.highlights.length > 0) {
            const highlightMentions = training.highlights.map(id => `<@${id}>`).join(' ');
            premiacaoText += `🎖️ Destaques: ${highlightMentions}\n`;
        }

        const summaryText = `# 🏆 TREINO ${matchType} AUGE\n\n${teamsText}${matchesText}${premiacaoText}`;

        await channel.send(summaryText);
    }

    getAllParticipants(messageId: string): string[] {
        const training = this.trainings.get(messageId);
        return training?.participants || [];
    }
}

export const trainingService = new TrainingService();
