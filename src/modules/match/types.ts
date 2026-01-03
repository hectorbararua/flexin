export interface Team {
    id: number;
    name: string;
    players: string[];
}

export interface MatchBracket {
    team1: number;
    team2: number;
    winner?: number;
    phase: string;
    roomCode?: string;
}

export interface Training {
    messageId: string;
    participants: string[];
    teams: Team[];
    brackets: MatchBracket[];
    currentBracketIndex: number;
    champion?: number;
    mvpId?: string;
    highlights: string[];
    captainLimit?: number;
    selectedCaptains?: string[];
    status: 'inscricao' | 'sorteio' | 'andamento' | 'finalizado';
    createdAt?: number;
}

export const POINTS = {
    WINNER: 10,
    MVP: 5,
    HIGHLIGHT: 2,
} as const;
