import { ICommandHandler, CommandContext, CommandResult } from '../types';
import { roleHistoryService } from '../../rolehistory';
import { UserUtils } from '../../../shared/utils';

const ROLEHISTORY_PERMISSION = [
    '1453031898719850658',
    '1453512385888256219',
    '1453512381530505247',
];

export class RoleHistoryHandler implements ICommandHandler {
    command = '!rolehistory';

    hasPermission(context: CommandContext): boolean {
        return ROLEHISTORY_PERMISSION.some(roleId => context.member.roles.cache.has(roleId));
    }

    async execute(context: CommandContext): Promise<CommandResult> {
        const { message, args } = context;
        const guild = message.guild;

        if (!guild) {
            return { success: false, message: '❌ Este comando só pode ser usado em um servidor.' };
        }

        let targetUserId: string;

        if (args.length > 1) {
            const extracted = UserUtils.extractUserId(args[1]);
            if (!extracted) {
                return { success: false, message: '❌ Usuário inválido. Use @menção ou ID.' };
            }
            targetUserId = extracted;
        } else {
            targetUserId = message.author.id;
        }

        try {
            const targetUser = await message.client.users.fetch(targetUserId);
            const changes = await roleHistoryService.getRoleHistory(guild, targetUserId);
            
            const tempMsg = await context.channel.send({ content: '🔄 Carregando...' });
            
            const session = roleHistoryService.createSession(
                tempMsg.id,
                changes,
                targetUser,
                message.author,
                guild
            );

            const embed = roleHistoryService.buildEmbed(session);
            const buttons = roleHistoryService.buildButtons(session);

            await tempMsg.edit({
                content: '',
                embeds: [embed],
                components: [buttons.toJSON()],
            });

            return { success: true };
        } catch (error) {
            console.error('Error fetching role history:', error);
            return { success: false, message: '❌ Erro ao buscar histórico de cargos.' };
        }
    }
}
