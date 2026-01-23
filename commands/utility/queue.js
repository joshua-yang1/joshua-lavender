import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('show-queue')
    .setDescription('Shows the queue.')
;
export async function execute(interaction) {
    const queue = useQueue(interaction.guild.id); // Get the queue for this guild

    if (!queue || !queue.current) {
        return interaction.reply({ content: 'Nothing playing at the moment. I\'m sure a bard will arrive soon.', ephemeral: true });
    }

    // Get the first few upcoming tracks
    const upcomingTracks = queue.tracks; // Show next 5 songs

    // Build the message string
    let message = `**Now Playing:** ${queue.current.title} - ${queue.current.author}\n\n`;
    message += '**Upcoming:**\n';

    if (upcomingTracks.length === 0) {
        message += '*(Queue is empty)*';
    } else {
        upcomingTracks.forEach((track, index) => {
            message += `${index + 1}. ${track.title} - ${track.author}\n`;
        });
    }

    return interaction.reply({ content: message })
}