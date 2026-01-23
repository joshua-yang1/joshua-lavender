import { SlashCommandBuilder } from 'discord.js';
import { useTimeline } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resumes the current song.')
;
export async function execute(interaction) {
    const timeline = useTimeline({
        node: interaction.guild,
    });

    if (!timeline) {
        return interaction.reply(
        'This server does not have an active player session.',
        );
    }

    // Invert the pause state
    const wasPaused = timeline.paused;
    if (wasPaused) timeline.resume();
    
    // If the timeline was previously paused, the queue is now back to playing
    return interaction.reply(
        'Resuming the music.',
    );
}