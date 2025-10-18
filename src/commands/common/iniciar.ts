import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Collection, ApplicationCommandType, GuildMember, ButtonInteraction, StringSelectMenuInteraction, CacheType } from "discord.js";
import { Command } from "../../structs/types/command";
import fs from 'fs';
import path from 'path';

const rankingsFilePath = path.join(__dirname, '../../data/ranking.json');
const allowedRoleId = '1266141081091964978';
function loadRankings() {
    if (fs.existsSync(rankingsFilePath)) {
        const data = fs.readFileSync(rankingsFilePath, 'utf8');
        return JSON.parse(data); 
    }
    return {};  
}

function saveRankings(rankings: Record<string, number>) {
    fs.writeFileSync(rankingsFilePath, JSON.stringify(rankings, null, 2)); 
}

let rankings = loadRankings();

function gerarSlots(tipo: string): string[] {
    const slots: Record<string, string[]> = {
        "2v2": ["**LIVRE**", "**LIVRE**"],
        "3v3": ["**LIVRE**", "**LIVRE**", "**LIVRE**"],
        "4v4": ["**LIVRE**", "**LIVRE**", "**LIVRE**", "**LIVRE**"],
        "5v5": ["**LIVRE**", "**LIVRE**", "**LIVRE**", "**LIVRE**", "**LIVRE**"],
    };
    return slots[tipo] || [];
}

function isUserAuthorizedToRemove(interaction: ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>): boolean {
    const member = interaction.member as GuildMember;  // Aqui obtemos o membro da interação
    
    const authorizedRoleIds = ["1266141081091964978", "1312293607067095210", "1312293607067095210", "1312293607067095210"];
    
    return member?.roles.cache.some(role => authorizedRoleIds.includes(role.id));
}

let partidas: Record<string, { 
    tipo: string; 
    time1: string[]; 
    time2: string[]; 
    slots: number[]; 
    messageId: string; 
    vencedorDefinido: boolean; 
    mvpDefinido: boolean;
    mvpId?: string; 
    totalSlots: number;
}> = {};

export default new Command({
    name: "iniciar",
    description: "Inicia uma partida de equipe",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            type: 3,
            name: "tipo",
            description: "Escolha o tipo de partida",
            required: true,
            choices: [
                { name: "2v2", value: "2v2" },
                { name: "3v3", value: "3v3" },
                { name: "4v4", value: "4v4" },
                { name: "5v5", value: "5v5" },
            ],
        },
    ],
    async run({ interaction }) {
        const tipoPartida = interaction.options.get("tipo")?.value as string;
        const slots: Record<string, number[]> = {
            "2v2": [1, 2, 3, 4],
            "3v3": [1, 2, 3, 4, 5, 6],
            "4v4": [1, 2, 3, 4, 5, 6, 7, 8],
            "5v5": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        };
    
        let time1: string[] = [];
        let time2: string[] = [];

        if (!(interaction.member instanceof GuildMember) || !interaction.member.roles.cache.has(allowedRoleId)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Partida ${tipoPartida}`)
            .setDescription("Escolha um time para jogar!")
            .setColor('#00FFFF')
            .addFields(
                { name: "Time 1", value: "Nenhum Jogador", inline: true },
                { name: "Time 2", value: "Nenhum Jogador", inline: true }
            );

        const hasPlayersInQueue = time1.length > 0 || time2.length > 0;
    
        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder()
                    .setCustomId("time1")
                    .setLabel("Time 1")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("time2")
                    .setLabel("Time 2")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("sairFila") 
                    .setLabel("Sair da fila")
                    .setStyle(ButtonStyle.Danger), 
                new ButtonBuilder()
                    .setCustomId("removerJogador")
                    .setLabel("Remover Jogador")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(!hasPlayersInQueue)
            ]
        });

        const message = await interaction.reply({
            content: `Iniciando uma partida de ${tipoPartida}`,
            embeds: [embed],
            components: [row.toJSON()],
            fetchReply: true,
        });

        let totalSlots: number;

        if (tipoPartida === "2v2") {
            totalSlots = 2;
        } else if (tipoPartida === "3v3") {
            totalSlots = 3; 
        } 
        else if (tipoPartida === "4v4") {
            totalSlots = 4;
        }
        else if (tipoPartida === "5v5") {
            totalSlots = 5; 
        } else {
            totalSlots = 0;
        }
           
        console.log('Partida criada com ID:', message.id);
        partidas[message.id] = { tipo: tipoPartida, time1, time2, slots: slots[tipoPartida], messageId: message.id, vencedorDefinido: false, mvpDefinido: false, totalSlots: totalSlots };
        
        
    },

    buttons: new Collection([

        ['time1', async (interaction: ButtonInteraction<CacheType>) => {
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });

            const member = interaction.member as GuildMember;

            if (partida.time1.includes(member.user.id)) {
                return interaction.reply({ content: "Você já está no Time 1.", ephemeral: true });
            }

            if (partida.time2.includes(member.user.id)) {
                partida.time2 = partida.time2.filter(id => id !== member.user.id);
            }

            if (partida.time1.length < (partida.tipo === "2v2" ? 2 : partida.tipo === "3v3" ? 3 : partida.tipo === "4v4" ? 4 : 5)) {
                partida.time1.push(member.user.id);
            } else {
                return interaction.reply({ content: `Time 1 já está completo para ${partida.tipo}`, ephemeral: true });
            }

            await updateTeams(partida, interaction);
        }],
        ['time2', async (interaction: ButtonInteraction<CacheType>) => {
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });

            const member = interaction.member as GuildMember;

            if (partida.time2.includes(member.user.id)) {
                return interaction.reply({ content: "Você já está no Time 2.", ephemeral: true });
            }

            if (partida.time1.includes(member.user.id)) {
                partida.time1 = partida.time1.filter(id => id !== member.user.id);
            }

            if (partida.time2.length < (partida.tipo === "2v2" ? 2 : partida.tipo === "3v3" ? 3 : partida.tipo === "4v4" ? 4 : 5)) {
                partida.time2.push(member.user.id); 
            } else {
                return interaction.reply({ content: `Time 2 já está completo para ${partida.tipo}`, ephemeral: true });
            }

            await updateTeams(partida, interaction);
        }],
        ['sairFila', async (interaction: ButtonInteraction<CacheType>) => {
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });

            const member = interaction.member as GuildMember;

            if (partida.time1.includes(member.user.id)) {
                partida.time1 = partida.time1.filter(id => id !== member.user.id);  
            } else if (partida.time2.includes(member.user.id)) {
                partida.time2 = partida.time2.filter(id => id !== member.user.id); 
            } else {
                return interaction.reply({ content: "Você não está em nenhum time!", ephemeral: true });
            }

            await updateTeams(partida, interaction);  
        }],
        ['removerJogador', async (interaction: ButtonInteraction<CacheType>) => {
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });
        
            if (!isUserAuthorizedToRemove(interaction)) {
                return interaction.reply({ content: "Você não tem permissão para remover jogadores da fila.", ephemeral: true });
            }
        
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("removerJogadorSelect")
                .setPlaceholder("Escolha o jogador para remover")
                .addOptions(
                    ...[...partida.time1, ...partida.time2].map(playerId =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(interaction.guild?.members.cache.get(playerId)?.displayName || "Desconhecido")
                            .setValue(playerId)
                    )
                );
        
            const row = new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [selectMenu],
            });
        
            await interaction.deferUpdate();
            await interaction.editReply({
                content: "Escolha o jogador para remover da fila:",
                components: [row.toJSON()],
            });
        }],        
        ['definirVencedores', async (interaction: ButtonInteraction<CacheType>) => {
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });
            
            if (!isUserAuthorizedToRemove(interaction)) {
                return interaction.reply({ content: "Você não tem permissão para remover jogadores da fila.", ephemeral: true });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("vencedorSelect")
                .setPlaceholder("Escolha o time vencedor")
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Time 1")
                        .setValue("time1"),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Time 2")
                        .setValue("time2")
                );
        
            const row = new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [selectMenu],
            });
        
            await interaction.deferUpdate(); 
        
            await interaction.editReply({
                content: "Escolha o time vencedor:",
                components: [row.toJSON()],
            });
        }],
        ['definirMVP', async (interaction: ButtonInteraction<CacheType>) => {

            console.log('Interação recebida para definir MVP', interaction.message.id);
            
            if (!isUserAuthorizedToRemove(interaction)) {
                return interaction.reply({ content: "Você não tem permissão para remover jogadores da fila.", ephemeral: true });
            }
            
            const partida = partidas[interaction.message.id];
            if (!partida) {
                console.log(`Partida não encontrada para a mensagem com ID: ${interaction.message.id}`);
                return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });
            }
        
            if (!partida.vencedorDefinido) {
                console.log('Vencedor não definido!');
                return interaction.reply({ content: "O vencedor precisa ser definido primeiro!", ephemeral: true });
            }
        
            const players = [...partida.time1, ...partida.time2];
            
            const uniquePlayers = Array.from(new Set(players));
        
            if (uniquePlayers.length === 0) {
                return interaction.reply({ content: "Não há jogadores na partida.", ephemeral: true });
            }
        
            const options = uniquePlayers.map(playerId => {
                const player = interaction.guild?.members.cache.get(playerId);
                return new StringSelectMenuOptionBuilder()
                    .setLabel(player ? player.displayName : "Desconhecido")  
                    .setValue(playerId);  
            });
        
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId("mvpSelect")  
                .setPlaceholder("Escolha o MVP da partida")
                .addOptions(...options);
        
            const row = new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [selectMenu],
            });
        
            await interaction.deferUpdate();
        
            await interaction.editReply({
                content: "Escolha o MVP da partida:",
                components: [row.toJSON()],
            });
        }] 
    ]),
    selects: new Collection([
    ['vencedorSelect', async (interaction: StringSelectMenuInteraction<CacheType>) => {
        await interaction.deferUpdate(); 

        const partida = partidas[interaction.message.id];
        console.log(partida);

        if (!partida) {
            return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });
        }

        const vencedor = interaction.values[0]; 

        const timeVencedor = vencedor === "time1" ? partida.time1 : partida.time2;
        timeVencedor.forEach((playerId: string) => {
            rankings[playerId] = (rankings[playerId] || 0) + 10; 
        });

        partida.vencedorDefinido = true;  

        saveRankings(rankings); 

        const row = new ActionRowBuilder<ButtonBuilder>( {
            components: [
                new ButtonBuilder()
                    .setCustomId("definirVencedores")
                    .setLabel("Definir Vencedores")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true), 
                new ButtonBuilder()
                    .setCustomId("definirMVP")
                    .setLabel("Definir MVP")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(partida.mvpDefinido) 
            ]
        });
        await interaction.editReply({
            content: "Vencedor escolhido! Aguardando definição do MVP.",
            components: [row.toJSON()],
        });
    }],
        ['mvpSelect', async (interaction: StringSelectMenuInteraction<CacheType>) => {
            await interaction.deferUpdate(); 
        
            const partida = partidas[interaction.message.id];
            if (!partida) return interaction.reply({ content: "Erro ao encontrar a partida.", ephemeral: true });
        
            const mvpId = interaction.values[0]; 
        
            rankings[mvpId] = (rankings[mvpId] || 0) + 5; 
        
            partida.mvpId = mvpId;
        
            saveRankings(rankings); 
        
            const row = new ActionRowBuilder<ButtonBuilder>( {
                components: [
                    new ButtonBuilder()
                        .setCustomId("definirVencedores")
                        .setLabel("Definir Vencedores")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(partida.vencedorDefinido),  
                    new ButtonBuilder()
                        .setCustomId("definirMVP")
                        .setLabel("Definir MVP")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true) 
                ]
            });
        
            if (partida.vencedorDefinido) {
                const resultadoEmbed = new EmbedBuilder()
                    .setTitle(`Partida ${partida.tipo} - ${new Date().toLocaleDateString()}`)
                    .setDescription(`**Resultado:** Time ${partida.vencedorDefinido ? (partida.vencedorDefinido === true ? "1" : "2") : "Aguardando vencedor"} venceu!`)
                    .addFields(
                        { name: "MVP", value: `${interaction.guild?.members.cache.get(mvpId)?.displayName}`, inline: true },
                    )
                    .setColor('#00FFFF')
                    .setFooter({ text: "Partida concluída" });
        
                await interaction.editReply({
                    content: `O MVP da partida foi ${interaction.guild?.members.cache.get(mvpId)?.displayName}`,
                    embeds: [resultadoEmbed],
                    components: [row.toJSON()],
                });
            } else {
                await interaction.editReply({
                    content: "Aguardando vencedor para mostrar o resultado.",
                    components: [row.toJSON()],
                });
            }   
        }],
        ['removerJogadorSelect', async (interaction: StringSelectMenuInteraction<CacheType>) => {
  
            const partida = partidas[interaction.message.id];
            if (!partida) {
                return interaction.update({ content: "Erro ao encontrar a partida.", components: [] });
            }
        
            const playerIdToRemove = interaction.values[0]; 

            let jogadorRemovido = false;
            if (partida.time1.includes(playerIdToRemove)) {
                partida.time1 = partida.time1.filter(id => id !== playerIdToRemove);
                jogadorRemovido = true;
            } else if (partida.time2.includes(playerIdToRemove)) {
                partida.time2 = partida.time2.filter(id => id !== playerIdToRemove);
                jogadorRemovido = true;
            }
        
            if (!jogadorRemovido) {
                return interaction.update({ content: "Jogador não encontrado nos times!", components: [] });
            }
        
            const generateEmbed = () => {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Partida 2v2')
                    .setDescription('Escolha um time para jogar!')
                    .addFields(
                        { name: 'Time 1', value: formatTime(partida.time1, partida.totalSlots), inline: true },
                        { name: 'Time 2', value: formatTime(partida.time2, partida.totalSlots), inline: true }
                    );
                return embed;
            };

            const formatTime = (time: string[], totalSlots: number) => {
                if (time.length === 0) {
                    return Array(totalSlots).fill("**LIVRE**").join('\n');
                } else {
                    const remainingSlots = totalSlots - time.length;
                    const livres = Array(remainingSlots).fill("**LIVRE**").join('\n');
                    const jogadores = time.map(id => getDisplayName(id)).join('\n');
                    return [jogadores, livres].filter(Boolean).join('\n');
                }
            };
        
            const getDisplayName = (id: string) => {
                const user = interaction.client.users.cache.get(id);
                return user ? user.username : id;
            };
        
            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder()
                        .setCustomId("time1")
                        .setLabel("Time 1")
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId("time2")
                        .setLabel("Time 2")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("sairFila")
                        .setLabel("Sair da fila")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("removerJogador")
                        .setLabel("Remover Jogador")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(false)
                ]
            });
        
            await interaction.update({
                embeds: [generateEmbed()],
                components: [row.toJSON()],
            });
        }]
        
    ])
});

async function updateTeams(partida: any, interaction: ButtonInteraction<CacheType> | StringSelectMenuInteraction<CacheType>) {
    const slotsTime1 = gerarSlots(partida.tipo);
    const slotsTime2 = gerarSlots(partida.tipo);

    partida.time1.forEach((playerId: string, index: number) => {
        slotsTime1[index] = interaction.guild?.members.cache.get(playerId)?.displayName || "**livre**";
    });

    partida.time2.forEach((playerId: string, index: number) => {
        slotsTime2[index] = interaction.guild?.members.cache.get(playerId)?.displayName || "**livre**";
    });

    const embed = new EmbedBuilder()
        .setTitle(`Partida ${partida.tipo}`)
        .setDescription("Escolha um time para jogar!")
        .setColor('#00FFFF')
        .addFields(
            { name: "Time 1", value: slotsTime1.join("\n") || "Nenhum jogador", inline: true },
            { name: "Time 2", value: slotsTime2.join("\n") || "Nenhum jogador", inline: true }
        );

    const maxPlayers = partida.tipo === "2v2" ? 2 : partida.tipo === "3v3" ? 3 : partida.tipo === "4v4" ? 4 : 5;
    const isFull = partida.time1.length === maxPlayers && partida.time2.length === maxPlayers;

    const hasPlayersInQueue = partida.time1.length > 0 || partida.time2.length > 0;

    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId("time1")
                .setLabel("Time 1")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("time2")
                .setLabel("Time 2")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("sairFila")
                .setLabel("Sair da fila")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("removerJogador")
                .setLabel("Remover Jogador")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!hasPlayersInQueue)
        ]
    });

    const actionRow = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder()
                .setCustomId("definirVencedores")
                .setLabel("Definir Vencedores")
                .setStyle(ButtonStyle.Success)
                .setDisabled(partida.vencedorDefinido), 
            new ButtonBuilder()
                .setCustomId("definirMVP")
                .setLabel("Definir MVP")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(!partida.vencedorDefinido || partida.mvpDefinido),
            new ButtonBuilder()
                .setCustomId("removerJogador")
                .setLabel("Remover Jogador")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!hasPlayersInQueue)
        ]
    });

    if (isFull) {
        await interaction.update({
            embeds: [embed],
            components: [actionRow.toJSON()],
        });
    } else {
        await interaction.update({
            embeds: [embed],
            components: [row.toJSON()],
        });
    }
}