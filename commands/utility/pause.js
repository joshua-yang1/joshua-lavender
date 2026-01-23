import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pauses the current song.')
;
export async function execute(interaction) {
    const queue = useQueue(interaction.guild.id); // Get the queue for this guild
    queue.node.setPaused(!queue.node.isPaused());
    return interaction.reply(
        'Pausing the music.',
    );
}