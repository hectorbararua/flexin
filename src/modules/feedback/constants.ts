import { EMOJIS } from '../../config';

export const LIKE_EMOJI_ID = '1453553969090658384';

export const FEEDBACK_CHANNEL_IDS = {
    REVIEWS_CHANNEL: '1459235697289466080',
} as const;

export const FEEDBACK_CUSTOM_IDS = {
    BTN_AVALIAR: 'feedback_avaliar_',
    BTN_RATING_1: 'feedback_rating_1_',
    BTN_RATING_2: 'feedback_rating_2_',
    BTN_RATING_3: 'feedback_rating_3_',
    BTN_RATING_4: 'feedback_rating_4_',
    BTN_RATING_5: 'feedback_rating_5_',
    BTN_UPDATE_YES: 'feedback_update_yes_',
    BTN_UPDATE_NO: 'feedback_update_no',
    MODAL_COMMENT: 'feedback_modal_comment_',
    INPUT_COMMENT: 'feedback_input_comment',
} as const;

export const FEEDBACK_MESSAGES = {
    TITLE_NEW_REVIEW: `${EMOJIS.SETINHA_ROXA} Nova Avaliação`,
    TITLE_UPDATED_REVIEW: `${EMOJIS.SETINHA_ROXA} Avaliação Atualizada`,
    TITLE_RATE_COACH: `${EMOJIS.SHIELD} Avaliar Treinador`,
    DESC_RATE_QUESTION: `${EMOJIS.PONTO_ROXO} Quantos likes você dá pro treino dele?`,
    DESC_COMMENT_PLACEHOLDER: 'Conta como foi sua experiência com esse treinador...',
    BTN_AVALIAR_LABEL: 'Avaliar',
    BTN_UPDATE_YES: '✅ Sim, atualizar',
    BTN_UPDATE_NO: '❌ Cancelar',
    ERROR_NOT_STUDENT: `${EMOJIS.PONTO_ROXO} Você precisa ser ou ter sido aluno desse treinador para avaliar.`,
    ERROR_COACH_NOT_FOUND: `${EMOJIS.PONTO_ROXO} Treinador não encontrado.`,
    ERROR_GENERIC: `${EMOJIS.PONTO_ROXO} Ocorreu um erro ao processar sua avaliação.`,
    SUCCESS_FEEDBACK_SENT: `${EMOJIS.SETINHA_ROXA} Sua avaliação foi enviada com sucesso!`,
    SUCCESS_FEEDBACK_UPDATED: `${EMOJIS.SETINHA_ROXA} Sua avaliação foi atualizada!`,
    CONFIRM_UPDATE: `${EMOJIS.PONTO_ROXO} Você já avaliou esse treinador antes. Quer atualizar sua avaliação?`,
} as const;

export const FEEDBACK_CONFIG = {
    embedColor: '#FF2F92',
    footerText: 'AUGE — o topo do competitivo.',
} as const;

export function getRatingLikes(rating: number): string {
    return `**${rating}/5** ${EMOJIS.LIKE}`;
}

export function getRatingDisplay(rating: number, totalReviews: number): string {
    return `${EMOJIS.LIKE} **${rating.toFixed(1)}** (${totalReviews})`;
}
