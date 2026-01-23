import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('log')
    .setDescription('Logs information to my console for observation purposes.')
    .addUserOption(option => 
        option.setName('target').setDescription('The target you are logging.').setRequired(true)
    )
export async function execute(interaction) {
    const target = interaction.options.getUser('target');
    console.log(target);
    interaction.reply('logged');
}
