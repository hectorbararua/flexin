import { JsonRepository } from '../../shared/repositories/JsonRepository';
import { Coach, CoachData, StudentRequest, CoachProfile } from './types';

// ============================================
// COACH REPOSITORY
// ============================================

export class CoachRepository {
    private repository: JsonRepository<CoachData>;
    private saveLock = false;
    private pendingSave = false;

    constructor() {
        this.repository = new JsonRepository<CoachData>('coaches.json');
    }

    // ----------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------

    private getData(): CoachData {
        const data = this.repository.load();
        return {
            coaches: data.coaches || {},
            requests: data.requests || {},
        };
    }

    private async saveData(data: CoachData): Promise<void> {
        if (this.saveLock) {
            this.pendingSave = true;
            return;
        }

        this.saveLock = true;
        try {
            this.repository.save(data);
        } finally {
            this.saveLock = false;
            if (this.pendingSave) {
                this.pendingSave = false;
                await this.saveData(this.getData());
            }
        }
    }

    // ----------------------------------------
    // COACH METHODS
    // ----------------------------------------

    getCoach(userId: string): Coach | undefined {
        const data = this.getData();
        return data.coaches[userId];
    }

    getCoachByRoleId(roleId: string): Coach | undefined {
        const data = this.getData();
        return Object.values(data.coaches).find(c => c.roleId === roleId);
    }

    getCoachByChannelId(channelId: string): Coach | undefined {
        const data = this.getData();
        return Object.values(data.coaches).find(c => c.channelId === channelId);
    }

    getAllCoaches(): Coach[] {
        const data = this.getData();
        return Object.values(data.coaches);
    }

    async createCoach(coach: Coach): Promise<void> {
        const data = this.getData();
        data.coaches[coach.id] = coach;
        await this.saveData(data);
    }

    async updateCoach(userId: string, updates: Partial<Coach>): Promise<boolean> {
        const data = this.getData();
        const coach = data.coaches[userId];
        
        if (!coach) return false;

        data.coaches[userId] = { ...coach, ...updates };
        await this.saveData(data);
        return true;
    }

    async updateCoachProfile(userId: string, profile: CoachProfile): Promise<boolean> {
        const data = this.getData();
        const coach = data.coaches[userId];
        
        if (!coach) return false;

        coach.profile = profile;
        await this.saveData(data);
        return true;
    }

    async addStudent(coachId: string, studentId: string): Promise<boolean> {
        const data = this.getData();
        const coach = data.coaches[coachId];
        
        if (!coach) return false;

        if (!coach.studentIds.includes(studentId)) {
            coach.studentIds.push(studentId);
            await this.saveData(data);
        }
        return true;
    }

    async removeStudent(coachId: string, studentId: string): Promise<boolean> {
        const data = this.getData();
        const coach = data.coaches[coachId];
        
        if (!coach) return false;

        const index = coach.studentIds.indexOf(studentId);
        if (index > -1) {
            coach.studentIds.splice(index, 1);
            await this.saveData(data);
            return true;
        }
        return false;
    }

    async deleteCoach(userId: string): Promise<boolean> {
        const data = this.getData();
        
        if (!data.coaches[userId]) return false;

        delete data.coaches[userId];
        await this.saveData(data);
        return true;
    }

    isCoach(userId: string): boolean {
        const data = this.getData();
        return !!data.coaches[userId];
    }

    getCoachByStudent(studentId: string): Coach | undefined {
        const data = this.getData();
        return Object.values(data.coaches).find(c => c.studentIds.includes(studentId));
    }

    /**
     * Verifica se um usuário já foi aluno de um treinador
     * (através das requests aceitas)
     */
    wasStudentOf(studentId: string, coachId: string): boolean {
        const data = this.getData();
        
        // Verificar se há uma request aceita para esse aluno com esse treinador
        const acceptedRequest = Object.values(data.requests).find(
            r => r.odUserId === studentId && 
                 r.status === 'accepted' && 
                 r.acceptedBy === coachId
        );
        
        return !!acceptedRequest;
    }

    /**
     * Retorna todos os alunos (atuais e antigos) de um treinador
     */
    getAllStudentsHistory(coachId: string): string[] {
        const data = this.getData();
        const coach = data.coaches[coachId];
        if (!coach) return [];

        // Alunos atuais
        const currentStudents = [...coach.studentIds];
        
        // Alunos antigos (via requests aceitas)
        const pastStudents = Object.values(data.requests)
            .filter(r => r.acceptedBy === coachId && r.status === 'accepted')
            .map(r => r.odUserId);

        // Combinar e remover duplicatas
        return [...new Set([...currentStudents, ...pastStudents])];
    }

    // ----------------------------------------
    // REQUEST METHODS
    // ----------------------------------------

    getRequest(requestId: string): StudentRequest | undefined {
        const data = this.getData();
        return data.requests[requestId];
    }

    getRequestByMessageId(messageId: string): StudentRequest | undefined {
        const data = this.getData();
        return Object.values(data.requests).find(r => r.messageId === messageId);
    }

    getRequestByUserId(userId: string): StudentRequest | undefined {
        const data = this.getData();
        return Object.values(data.requests).find(
            r => r.odUserId === userId && r.status === 'pending'
        );
    }

    getRequestByTicketChannelId(channelId: string): StudentRequest | undefined {
        const data = this.getData();
        return Object.values(data.requests).find(r => r.ticketChannelId === channelId);
    }

    getAllPendingRequests(): StudentRequest[] {
        const data = this.getData();
        return Object.values(data.requests).filter(r => r.status === 'pending');
    }

    async createRequest(request: StudentRequest): Promise<void> {
        const data = this.getData();
        data.requests[request.id] = request;
        await this.saveData(data);
    }

    async updateRequest(requestId: string, updates: Partial<StudentRequest>): Promise<boolean> {
        const data = this.getData();
        const request = data.requests[requestId];
        
        if (!request) return false;

        data.requests[requestId] = { ...request, ...updates };
        await this.saveData(data);
        return true;
    }

    async updateRequestStatus(
        requestId: string,
        status: StudentRequest['status'],
        acceptedBy?: string
    ): Promise<boolean> {
        const data = this.getData();
        const request = data.requests[requestId];
        
        if (!request) return false;

        request.status = status;
        request.resolvedAt = new Date().toISOString();
        if (acceptedBy) {
            request.acceptedBy = acceptedBy;
        }

        await this.saveData(data);
        return true;
    }

    async deleteRequest(requestId: string): Promise<boolean> {
        const data = this.getData();
        
        if (!data.requests[requestId]) return false;

        delete data.requests[requestId];
        await this.saveData(data);
        return true;
    }

    async setRequestMessageId(requestId: string, messageId: string): Promise<boolean> {
        return this.updateRequest(requestId, { messageId });
    }
}

// Singleton instance
export const coachRepository = new CoachRepository();

