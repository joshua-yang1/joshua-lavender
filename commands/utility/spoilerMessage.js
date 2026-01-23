import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('spoiler-message')
    .setDescription('Censors a message.')
    .addStringOption(option => 
        option.setName('message-id')
        .setDescription('The id of the message you\'d like to censor.')
        .setRequired(true)
    )
;
export async function execute(interaction) {
    // Permission check
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
    }
    let messageId = interaction.options.getString('message-id')


    try {
      // Fetch messages and bulk delete (Discord only allows bulk deletion for messages less than 14 days old)
      const fetchedMessages = await interaction.channel.messages.fetch(messageId);
      await interaction.channel.bulkDelete(fetchedMessages, true); // The 'true' filter skips messages older than 14 days

      await interaction.reply({ content: `Successfully deleted ${fetchedMessages.size} messages.`, ephemeral: true });

    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error trying to delete messages in this channel!', ephemeral: true });
    }
}