import { SlashCommandBuilder } from 'discord.js';
import { useMainPlayer, useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Removes a song from the queue. Type the song you want to remove, and I\'ll take it out for you.')
    .addStringOption((option) => option.setName('query').setDescription('The query to echo back'))
;
export async function execute(interaction) {
    const player = useMainPlayer();
    const queue = useQueue(interaction.guild.id);
    const query = interaction.options.getString('query', true);
    const searchResult = await player.search(query, { requestedBy: interaction.user });
    const index = queue.tracks.toArray().findIndex(track => track.title === searchResult.title);
    queue.removeTrack(index); //Remember queue index starts from 0, not 1
    return interaction.reply(
        `Removing ${searchResult.title} from the set list.`,
    );
}