import { SlashCommandBuilder, PermissionsBitField, MessageFlags } from 'discord.js';
import { writeCommandsToClient, deployCommandsToServer } from '../../utils.js';

export const data = new SlashCommandBuilder().setName('deploy-commands').setDescription('Refreshes the available slash commands.')
export async function execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Please don\'t do that. I\'m working on something.', flags: MessageFlags.Ephemeral, });
    }
    await interaction.reply('Commands redeployed.');
    writeCommandsToClient(interaction.client);
    deployCommandsToServer();
}