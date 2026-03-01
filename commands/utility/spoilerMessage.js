import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionsBitField } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('spoiler-message')
    .setType(ApplicationCommandType.Message);
;
export async function execute(interaction) {
    // Permission check
    let member;
    console.log('client', interaction.client);
    const guild = interaction.client.guilds.cache.get(interaction.guildId);
    async function getMember(guild, memberId) {
        try {
            const member = await guild.members.fetch(memberId);
            console.log(`Fetched member: ${member.user.tag}`);
            return member;
        } catch (error) {
            console.error('Could not fetch member:', error);
            return null;
        }
    }
    if (guild) {
      member = await getMember(guild, interaction.user.id);
    }
    console.log('member', member);
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
    } else {
      interaction.reply('Oh, is there a problem?')
    }
    const channel = await interaction.client.channels.fetch(interaction.channelId);
    const message = await channel.messages.fetch(interaction.targetId);
    let messageContent = message.content;
    let messageAttachments = Array.from(message.attachments.values()) || [];
    // let messageEmbeds = message.embeds;
    let spoileredAttachments = [];
    // let formattedEmbeds = [];
    messageAttachments.forEach((attachment) => {
      const spoileredAttachment = new AttachmentBuilder(attachment.url, { name: `SPOILER_${attachment.name}` });
      spoileredAttachments.push(spoileredAttachment);
    })
    await message.reply({
      content: `|| ${messageContent} ||
        \nOh, dear. Let's cover that up. Can't have anything like that around my paying customers.`,
      files: spoileredAttachments,
      // embeds: formattedEmbeds,
    }).then(() => {
      confirmCensor.delete();
      message.delete();
    })
    .catch(console.error);
    
}