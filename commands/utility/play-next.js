import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('play-next')
    .setDescription('Plays a specific song next. Type the song you want to move, along with its place in the queue.')
    .addStringOption((option) => option.setName('query').setDescription('The query to echo back'))
    .addIntegerOption((option) => option.setName('position').setDescription('The position in the queue'))
;
export async function execute(interaction) {
    const player = useMainPlayer();
    const queue = useQueue(interaction.guild.id);
    const query = interaction.options.getString('query', true);
    const position = interaction.options.getInteger('position');
    const searchResult = await player.search(query, { requestedBy: interaction.user });
    queue.insertTrack(searchResult.tracks[0], position - 1);
    return interaction.reply(
        'Alright, I\'ll play that next for you.',
    );
}