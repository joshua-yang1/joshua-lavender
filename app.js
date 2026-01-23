// Require the necessary discord.js classes
import fs from 'node:fs';
import path from 'node:path';
import { 
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  PermissionsBitField
} from 'discord.js';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import  { Player } from 'discord-player';
import  { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeSabrExtractor } from 'discord-player-googlevideo';
import * as savedEvents from './savedEvents.json' with { type: "json" };
import { scheduleEvent } from './utils.js';

const token = process.env.DISCORD_TOKEN;
const serverId = process.env.SERVER_ID;
const PORT = process.env.PORT || 3000;

// Create a new client instance
const client = new Client({ 
  intents: [
      GatewayIntentBits.Guilds,         // For server-related events (joins, leaves)
      GatewayIntentBits.GuildMessages,  // For messages in servers
      GatewayIntentBits.MessageContent, // Required to read message content (privileged)
      GatewayIntentBits.GuildMembers,   // For member-related events (privileged)
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ],
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag} on port ${PORT}`);

  //reschedules any events in savedEvents.json in case of a bot restart
  // savedEvents.forEach((se) => {
  //   scheduleEvent(se.interaction, )
  // })

  //sets up music player
  try {
    const player = new Player(client);
    
    // Now, lets load all the default extractors
    await player.extractors.loadMulti(DefaultExtractors);
    await player.extractors.register(YoutubeSabrExtractor, {})
    
    // this event is emitted whenever discord-player starts to play a track
    player.events.on('playerStart', (queue, track) => {
      // Emitted when the player starts to play a song
      queue.metadata.send(`Started playing: **${track.title}**`);
    });
    
    player.events.on('audioTrackAdd', (queue, track) => {
      // Emitted when the player adds a single song to its queue
      queue.metadata.send(`Track **${track.title}** queued`);
    });
    
    player.events.on('audioTracksAdd', (queue, track) => {
      // Emitted when the player adds multiple songs to its queue
      queue.metadata.send(`Multiple Track's queued`);
    });
    
    player.events.on('playerSkip', (queue, track) => {
      // Emitted when the audio player fails to load the stream for a song
      queue.metadata.send(`Skipping **${track.title}** due to an issue!`);
    });
    
    player.events.on('disconnect', (queue) => {
      // Emitted when the bot leaves the voice channel
      queue.metadata.send('Looks like my job here is done, leaving now!');
    });
    player.events.on('emptyChannel', (queue) => {
      // Emitted when the voice channel has been empty for the set threshold
      // Bot will automatically leave the voice channel with this event
      queue.metadata.send(`Leaving because no vc activity for the past 5 minutes`);
    });
    player.events.on('emptyQueue', (queue) => {
      // Emitted when the player queue has finished
      queue.metadata.send('Queue finished!');
    });
  } catch (error) {
      console.error(error);
  }

  //slash command handler
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = await interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  //add emoji-related commands here. choppingblock censors posts by deleting the original and reposting it with spoiler
  client.on(Events.MessageReactionAdd, async (messageReaction, user) => {
    if (messageReaction.emoji.name === 'choppingblock') {
      // Permission check
      let member;
      const guild = client.guilds.cache.get(serverId);
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
        member = await getMember(guild, user.id);
      }
      console.log('member', member);
      if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
      }
		  const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm Spoiler').setStyle(ButtonStyle.Danger);
      const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder().addComponents(cancel, confirm);
      const message = await messageReaction.message.fetch();
      const currentChannel = await message.channel.fetch();
      let messageContent = message.content;
      let messageAttachments = Array.from(message.attachments.values()) || [];
      // let messageEmbeds = message.embeds;
      let spoileredAttachments = [];
      // let formattedEmbeds = [];
      messageAttachments.forEach((attachment) => {
        const spoileredAttachment = new AttachmentBuilder(attachment.url, { name: `SPOILER_${attachment.name}` });
        spoileredAttachments.push(spoileredAttachment);
      })
      // console.log('embeds', messageEmbeds);
      // messageEmbeds.forEach((embed) => {
      //   let ytURL;
      //   if (embed.data.provider.name === 'YouTube') ytURL = `https://img.youtube.com/vi/${embed.data.url.replace('https://www.youtube.com/watch?v=', '')}/hqdefault.jpg`
      //   const formattedEmbed = new EmbedBuilder()
      //     .setTitle(embed.data.title)
      //     .setURL(embed.data.url)
      //     .setImage(embed.data.provider.name === 'YouTube' ? ytURL : embed.data.thumbnail.url)
      //     .setDescription(embed.data.description);
      //   formattedEmbeds.push(formattedEmbed);
      // })
      const confirmCensor = await currentChannel.send({
          content: 'Censor this post?',
          components: [row],
          flags: MessageFlags.Ephemeral,
          withResponse: true,
        }
      ); 
      async function attemptDelete() {
        if (confirmCensor.channel) {
          await confirmCensor.delete();
        } else {
          console.log('for whatever reason there is no channel');
        }
      }
      try {
        const confirmation = await confirmCensor.awaitMessageComponent({ time: 60_000 });
        if (confirmation.customId === 'confirm') {
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
        } else if (confirmation.customId === 'cancel') {
          await messageReaction.users.remove(user.id);
          await confirmCensor.edit({ content: 'We\'ve chosen to leave it, then. That\'s alright by me. I just thought I\'d check.', components: [] });
          console.log('confirmCensor channel', confirmCensor.channel.name, 'currentChannel', currentChannel.name);
          // setTimeout(confirmCensor.delete, 8000);
          setTimeout(attemptDelete, 8000);
        }
      } catch (error) {
        console.log('reason why this still happens: ', error);
        await messageReaction.users.remove(user.id);
        await confirmCensor.edit('...Alright, well if you\'d like to revisit this, let me know.');
        setTimeout(attemptDelete, 8000);
      }
    }
  })
});

client.commands = new Collection();

const fileName = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const dirName = path.dirname(fileName);
const foldersPath = path.join(dirName, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Log in to Discord with your client's token
client.login(token);
