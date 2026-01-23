import { SlashCommandBuilder } from 'discord.js';
import { useHistory } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Plays the previous song.')
;
export async function execute(interaction) {
    const history = useHistory(interaction.guild.id);
    await history.previous();
    return interaction.reply(
        'Sure, I can play that one again.',
    );
}