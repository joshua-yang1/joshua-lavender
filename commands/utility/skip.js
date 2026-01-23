import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.')
;
export async function execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    queue.node.skip();
    return interaction.reply(
        'Candidly, I wasn\'t fond of that one either. We can skip it.',
    );
}