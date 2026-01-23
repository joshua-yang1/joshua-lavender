import { SlashCommandBuilder } from 'discord.js';
import { getRandomTea } from '../../utils.js'

export const data = new SlashCommandBuilder().setName('tea').setDescription('Joshua Lavender brews you a random cup of tea. Enjoy!')
export async function execute(interaction) {
    await interaction.reply(getRandomTea());
}