import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder().setName('bark').setDescription('Barks at Robert.');
export async function execute(interaction) {
    interaction.client.users.fetch('161736556845989888').then((Robert) => {
        interaction.reply(`${Robert} barkbark bark bark bark bark bark bark .`);
    });
}