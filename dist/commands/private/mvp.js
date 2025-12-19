"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const command_1 = require("../../structs/types/command");
const allowedRoleId = '1266141081091964978';
const mvpCargo = '1311446814498750524';
let mvpList = [];
exports.default = new command_1.Command({
    name: "mvp",
    description: "Gerenciar MVPs do servidor",
    type: discord_js_1.ApplicationCommandType.ChatInput,
    async run({ interaction }) {
        if (!(interaction.member instanceof discord_js_1.GuildMember) || !interaction.member.roles.cache.has(allowedRoleId)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true
            });
            return;
        }
        const row = new discord_js_1.ActionRowBuilder({
            components: [
                new discord_js_1.ButtonBuilder()
                    .setCustomId('addMvp')
                    .setLabel('Adicionar MVP')
                    .setStyle(discord_js_1.ButtonStyle.Success),
                new discord_js_1.ButtonBuilder()
                    .setCustomId('removeMvp')
                    .setLabel('Remover MVP')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
            ]
        });
        const mvpListString = mvpList.length === 0 ? "Nenhum MVP selecionado" : mvpList.slice(0, 10).map((mvp, index) => `${index + 1}. ${mvp}`).join("\n");
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Painel de MVPs')
            .setDescription(`Escolha uma opção abaixo:\n\n**Lista de MVPs**:\n${mvpListString}`)
            .setColor('#00FFFF');
        await interaction.reply({
            ephemeral: false,
            content: 'Painel MVP',
            embeds: [embed],
            components: [row.toJSON()],
        });
    },
    buttons: new discord_js_1.Collection([
        ['addMvp', async (interaction) => {
                if (!(interaction.member instanceof discord_js_1.GuildMember) || !interaction.member.roles.cache.has(allowedRoleId)) {
                    await interaction.reply({
                        content: 'Você não tem permissão para adicionar MVPs.',
                        ephemeral: true
                    });
                    return;
                }
                const members = await interaction.guild.members.fetch();
                const memberOptions = Array.from(members.values())
                    .filter(member => member.roles.cache.has(mvpCargo) &&
                    !mvpList.includes(`<@${member.id}>`))
                    .map(member => {
                    const memberNickname = member.displayName ?? member.user.username;
                    return new discord_js_1.StringSelectMenuOptionBuilder()
                        .setLabel(memberNickname)
                        .setValue(member.id);
                })
                    .filter((value, index, self) => index === self.findIndex((t) => (t.data.value === value.data.value)));
                const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                    .setCustomId('selectAddMvp')
                    .setPlaceholder('Escolha um membro para adicionar como MVP')
                    .addOptions(memberOptions.slice(0, 25));
                const selectRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                await interaction.update({
                    content: 'Escolha um membro para adicionar como MVP:',
                    components: [selectRow.toJSON()]
                });
            }],
        ['removeMvp', async (interaction) => {
                if (!(interaction.member instanceof discord_js_1.GuildMember) || !interaction.member.roles.cache.has(allowedRoleId)) {
                    await interaction.reply({
                        content: 'Você não tem permissão para remover MVPs.',
                        ephemeral: true
                    });
                    return;
                }
                if (mvpList.length === 0) {
                    await interaction.reply({ content: 'Nenhum MVP foi adicionado ainda.', ephemeral: true });
                    return;
                }
                const removeOptions = mvpList.slice(0, 10).map((mvp, index) => {
                    const memberId = mvp.replace('<@', '').replace('>', '');
                    const member = interaction.guild.members.cache.get(memberId);
                    const memberNickname = member?.displayName ?? member?.user.username;
                    return new discord_js_1.StringSelectMenuOptionBuilder()
                        .setLabel(`${index + 1}. ${memberNickname}`)
                        .setValue(memberId);
                });
                const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                    .setCustomId('selectRemoveMvp')
                    .setPlaceholder('Escolha um MVP para remover')
                    .addOptions(removeOptions);
                const selectRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                await interaction.update({
                    content: 'Escolha um MVP para remover:',
                    components: [selectRow.toJSON()]
                });
            }]
    ]),
    selects: new discord_js_1.Collection([
        ['selectAddMvp', async (interaction) => {
                const selectedId = interaction.values[0];
                const member = await interaction.guild.members.fetch(selectedId);
                const memberTag = member?.displayName ?? member.user.username;
                mvpList.push(`<@${selectedId}>`);
                const mvpListString = mvpList.length === 0 ? "Nenhum MVP selecionado" : mvpList.slice(0, 10).map((mvp, index) => `${index + 1}. ${mvp}`).join("\n");
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle('Painel de MVPs')
                    .setDescription(`Escolha uma opção abaixo:\n\n**Lista de MVPs**:\n${mvpListString}`)
                    .setColor('#00FFFF');
                await interaction.deferUpdate();
                await interaction.followUp({
                    content: `${memberTag} foi adicionado à lista de MVPs!`,
                    embeds: [embed],
                    ephemeral: true
                });
                await interaction.editReply({
                    content: 'Painel de MVPs atualizado',
                    embeds: [embed],
                    components: [new discord_js_1.ActionRowBuilder({
                            components: [
                                new discord_js_1.ButtonBuilder()
                                    .setCustomId('addMvp')
                                    .setLabel('Adicionar MVP')
                                    .setStyle(discord_js_1.ButtonStyle.Success),
                                new discord_js_1.ButtonBuilder()
                                    .setCustomId('removeMvp')
                                    .setLabel('Remover MVP')
                                    .setStyle(discord_js_1.ButtonStyle.Danger)
                            ]
                        }).toJSON()]
                });
            }],
        ['selectRemoveMvp', async (interaction) => {
                const selectedId = interaction.values[0];
                const index = mvpList.indexOf(`<@${selectedId}>`);
                if (index !== -1) {
                    mvpList.splice(index, 1);
                }
                const mvpListString = mvpList.length === 0 ? "Nenhum MVP selecionado" : mvpList.slice(0, 10).map((mvp, index) => `${index + 1}. ${mvp}`).join("\n");
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle('Painel de MVPs')
                    .setDescription(`Escolha uma opção abaixo:\n\n**Lista de MVPs**:\n${mvpListString}`)
                    .setColor('#00FFFF');
                await interaction.deferUpdate();
                await interaction.followUp({
                    content: `<@${selectedId}> foi removido da lista de MVPs!`,
                    embeds: [embed],
                    ephemeral: true
                });
                await interaction.editReply({
                    content: 'Painel de MVPs atualizado',
                    embeds: [embed],
                    components: [new discord_js_1.ActionRowBuilder({
                            components: [
                                new discord_js_1.ButtonBuilder()
                                    .setCustomId('addMvp')
                                    .setLabel('Adicionar MVP')
                                    .setStyle(discord_js_1.ButtonStyle.Success),
                                new discord_js_1.ButtonBuilder()
                                    .setCustomId('removeMvp')
                                    .setLabel('Remover MVP')
                                    .setStyle(discord_js_1.ButtonStyle.Danger)
                            ]
                        }).toJSON()]
                });
            }]
    ])
});
