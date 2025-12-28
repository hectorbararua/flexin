import { OWNER_IDS, OWNER_MENTIONS } from '../../config/owners';
import { VERIFICATION_ROLES, PERMISSION_GROUPS } from '../../config/roles';
import { EMOJIS, COLORS } from '../../config/emojis';

export { OWNER_IDS, OWNER_MENTIONS };

export const ROLE_IDS = VERIFICATION_ROLES;

export const VERIFICATION_CONFIG = {
    verifierRoleIds: PERMISSION_GROUPS.VERIFIER_ROLES,
    embedColor: COLORS.PRIMARY,
} as const;

export const VERIFICATION_EMOJIS = EMOJIS;

export const VERIFICATION_MESSAGES = {
    EMBED_TITLE: `AUGE - Verificação ${EMOJIS.MARTELO}`,
    MEMBER_SECTION_TITLE: `${EMOJIS.SHIELD} Para membros da AUGE:`,
    MEMBER_INSTRUCTION: `${EMOJIS.PONTO_ROXO} Aperte em \`Verificar\` e escolha um dos donos caso seja membro do clã.`,
    FRIEND_SECTION_TITLE: `${EMOJIS.USERS} Para amigos:`,
    FRIEND_INSTRUCTION: `${EMOJIS.PONTO_ROXO} Aperte em \`Verificar\` e selecione a pessoa que você conhece.`,
    OWNERS_TITLE: `${EMOJIS.BANZADA} Donos:`,
    OWNERS_LIST: OWNER_MENTIONS,
    FOOTER: 'AUGE — o topo do competitivo.',
    VERIFY_BUTTON: 'Verificar',
    SELECT_PLACEHOLDER: 'Selecione quem te conhece...',
    QUESTION: 'Quem você conhece no Servidor?',
    MODAL_TITLE: 'Verificação - ego + aura = AUGE',
    MODAL_PLACEHOLDER: 'Digite o nome de quem você conhece...',
} as const;

export const VERIFICATION_CUSTOM_IDS = {
    VERIFY_BUTTON: 'verification_verify',
    VERIFIER_SELECT: 'verification_select_verifier',
    ANSWER_MODAL: 'verification_answer_modal',
    ANSWER_INPUT: 'verification_answer_input',
    APPROVE_BUTTON: 'verification_approve',
    REJECT_BUTTON: 'verification_reject',
} as const;

export const VERIFICATION_IMAGE = 'https://cdn.discordapp.com/attachments/1453203134821437513/1453510564704817223/b5abd23c0dcb57e7c533a3d6840c814d.gif';
