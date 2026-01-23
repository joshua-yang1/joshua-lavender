import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Clears all songs from the queue.')
;
export async function execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    queue.delete();
    return interaction.reply(
        'Looks like we\'re wrapping up for the evening.',
    );
}