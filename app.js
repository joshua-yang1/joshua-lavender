// Require the necessary discord.js classes
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
import  { Player } from 'discord-player';
import  { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeSabrExtractor } from 'discord-player-googlevideo';
import savedEvents from './savedEvents.json' with { type: "json" };
import { deployCommandsToServer, scheduleEventOnBoot, writeCommandsToClient, getMember } from './utils.js';

const token = process.env.DISCORD_TOKEN;
const serverIds = process.env.SERVER_ID;
const allowedServers = serverIds ? serverIds.split(',') : [];

for (let i = 0; i < allowedServers.length; i++) {
  //defines port, adding 1 per allowed server
  const PORT = process.env.PORT + i || 3000 + i;

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
    console.log(`Ready! Logged in as ${readyClient.user.tag} on port ${PORT + i}`);
    console.log(savedEvents);
    //reschedules any events in savedEvents.json in case of a bot restart
    savedEvents.forEach((se) => {
      scheduleEventOnBoot(client, se, allowedServers[i]);
    })

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
      if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand() && !interaction.isStringSelectMenu()) return;
      if (interaction.guildId !== allowedServers[i]) {
        return;
      }
      if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const command = await interaction.client.commands.get(interaction.commandName);
        console.log(interaction.commandName);
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
      } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'role_select_menu') {
          const restrictedRoleIds = [
            '1463820003408085120', //joshua lavender
            '1468508797646405664', //crab patriarch
            '1468478589056843972', //pookie
            '1468491138653491345', //boywife
            '1477028938000760842', //straight white man
            '1476991271758463039', //quentin tarantino
            '1476990536698036366', //big chillin'
            '1474542978008617153', //racecar wook
            '1474542370640101649'  //cabbage vendor
          ];

          const member = interaction.member;
          const guild = interaction.guild;
          const guildRoles = guild.roles.cache.filter(r => r.name !== "@everyone");
          const selectedRoleNames = interaction.values; // strings
          const memberRoles = member.roles.cache.filter(r => r.name !== "@everyone"); // Collection<Role>

          // Roles to add: selected names the member doesn't already have
          const rolesToAdd = selectedRoleNames
            .filter(n => !memberRoles.some(r => r.name === n))
            .map(n => guildRoles.find(r => r.name === n))
            .filter(Boolean);

          // Roles to remove: current roles that weren't in the new selection
          const rolesToRemove = memberRoles.filter(r => !selectedRoleNames.includes(r.name));

          try {
            if (rolesToAdd.length > 0) {
              await member.roles.add(rolesToAdd);
            }
            if (rolesToRemove.size > 0) {
              await member.roles.remove(rolesToRemove);
            }
            await interaction.followUp({
              content: `Role(s) updated successfully!`,
              flags: MessageFlags.Ephemeral
            });
          } catch (error) {
            console.error(error);
            await interaction.followUp({
              content: 'There was an error updating your roles.',
              flags: MessageFlags.Ephemeral
            });
          }
        }
      }
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
      //check if user is changing state to/from not being in vc
      const enteringVC = !oldState.channelId;
      const exitingVC = !newState.channelId;
      console.log('entering: ',enteringVC,' exiting: ',exitingVC);

      //add role to return user to their original nickname after leaving voice
      const joiner = newState.member;
      console.log('joiner',joiner);
      const currentNickname = joiner.nickname || joiner.user.globalName || false;
      console.log('current nickname: ',currentNickname);
      const guild = joiner.guild;
      const stashRole = currentNickname ? guild.roles.cache.find(role => role.name === `[stash]${currentNickname}`) : false; 
      console.log('stashed role?: ', stashRole);

      //check user's current roles
      const joinerRoles = joiner.roles.cache;

      //check if user has role with campaign role tag matching voice channel's role tag, then set nickname. if completely leaving vc, do nothing
      const joinedChannel = exitingVC ? false :  await guild.channels.fetch(newState.channelId);
      const joinedChannelName = exitingVC ? false : joinedChannel.name;
      const joinedChannelTag = exitingVC ? false : joinedChannelName.substring(0, 4);
      const joinerTaggedRole = exitingVC ? false : joinerRoles.find(role => role.name.substring(0, 4) === joinedChannelTag);

      //check if user is leaving a channel they have a tagged role associated with. if entering vc, do nothing
      const leftChannel = enteringVC ? false : await guild.channels.fetch(oldState.channelId);
      const leftChannelName = enteringVC ? false : leftChannel.name;
      const leftChannelTag = enteringVC ? false : leftChannelName.substring(0, 4);
      const leaverTaggedRole = enteringVC ? false : joinerRoles.find(role => role.name.substring(0, 4) === leftChannelTag);

      //if joiner has a tagged role and doesn't have a stashed nickname role
      if (!stashRole && joinerTaggedRole) {
        guild.roles.create({name: `[stash]${currentNickname}`})
        .then(role => {
          console.log(`Created role ${role.name} for ${currentNickname}.`)
          joiner.roles.add(role);
        })
        .catch(console.error);
        try {
          await joiner.setNickname(joinerTaggedRole.name.substring(4));
          console.log(`Set ${joiner.user.tag} to "${joinerTaggedRole.name}"`)
        } catch (error) {
          console.error(`Failed to set ${joiner.user.tag}'s nickname: `, error);
        }
      }

      //if joiner leaves a channel with a tagged role and a stashed role
      if (leaverTaggedRole && stashRole) {
        try {
          await joiner.setNickname(stashRole.name.substring(7));
          console.log(`Set ${joiner.user.tag} to "${stashRole.name.substring(7)}"`)
          stashRole.delete('removing stashed nickname role');
        } catch (error) {
          console.error(`Failed to set ${joiner.user.tag}'s nickname: `, error);
        }
      }
    });

    client.on(Events.MessageCreate, async (message) => {
      console.log("message create");
        // Ignore messages from bots
        if (message.author.bot || !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        console.log("allowed to see this message: ", message.author.globalName, message.content);
        // Check if the message content matches the target string
        if (message.content.substring(0, 5) === "Grim:") {
          const joshuaMessage = message.content.slice(5);
          try {
            await message.channel.send(joshuaMessage);
            await message.delete();
          } catch (err) {
            console.error("Failed to send/delete message:", err);
          }
        }
    });

    //add emoji-related commands here. choppingblock censors posts by deleting the original and reposting it with spoiler
    client.on(Events.MessageReactionAdd, async (messageReaction, user) => {
      // if (messageReaction.emoji.name === 'choppingblock') {
      //   // Permission check
      //   let member;
      //   const guild = client.guilds.cache.get(allowedServers[i]);
      //   async function getMember(guild, memberId) {
      //       try {
      //           const member = await guild.members.fetch(memberId);
      //           console.log(`Fetched member: ${member.user.tag}`);
      //           return member;
      //       } catch (error) {
      //           console.error('Could not fetch member:', error);
      //           return null;
      //       }
      //   }
      //   if (guild) {
      //     member = await getMember(guild, user.id);
      //   }
      //   console.log('member', member);
      //   if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      //     return interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
      //   }
      //   const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm Spoiler').setStyle(ButtonStyle.Danger);
      //   const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
      //   const row = new ActionRowBuilder().addComponents(cancel, confirm);
      //   const message = await messageReaction.message.fetch();
      //   const currentChannel = await message.channel.fetch();
      //   let messageContent = message.content;
      //   let messageAttachments = Array.from(message.attachments.values()) || [];
      //   // let messageEmbeds = message.embeds;
      //   let spoileredAttachments = [];
      //   // let formattedEmbeds = [];
      //   messageAttachments.forEach((attachment) => {
      //     const spoileredAttachment = new AttachmentBuilder(attachment.url, { name: `SPOILER_${attachment.name}` });
      //     spoileredAttachments.push(spoileredAttachment);
      //   })
      //   // console.log('embeds', messageEmbeds);
      //   // messageEmbeds.forEach((embed) => {
      //   //   let ytURL;
      //   //   if (embed.data.provider.name === 'YouTube') ytURL = `https://img.youtube.com/vi/${embed.data.url.replace('https://www.youtube.com/watch?v=', '')}/hqdefault.jpg`
      //   //   const formattedEmbed = new EmbedBuilder()
      //   //     .setTitle(embed.data.title)
      //   //     .setURL(embed.data.url)
      //   //     .setImage(embed.data.provider.name === 'YouTube' ? ytURL : embed.data.thumbnail.url)
      //   //     .setDescription(embed.data.description);
      //   //   formattedEmbeds.push(formattedEmbed);
      //   // })
      //   const confirmCensor = await currentChannel.send({
      //       content: 'Censor this post?',
      //       components: [row],
      //       flags: MessageFlags.Ephemeral,
      //       withResponse: true,
      //     }
      //   ); 
      //   async function attemptDelete() {
      //     if (confirmCensor.channel) {
      //       await confirmCensor.delete();
      //     } else {
      //       console.log('for whatever reason there is no channel');
      //     }
      //   }
      //   try {
      //     const confirmation = await confirmCensor.awaitMessageComponent({ time: 60_000 });
      //     if (confirmation.customId === 'confirm') {
      //       await message.reply({
      //         content: `|| ${messageContent} ||
      //           \nOh, dear. Let's cover that up. Can't have anything like that around my paying customers.`,
      //         files: spoileredAttachments,
      //         // embeds: formattedEmbeds,
      //       }).then(() => {
      //           confirmCensor.delete();
      //           message.delete();
      //         })
      //           .catch(console.error);
      //     } else if (confirmation.customId === 'cancel') {
      //       await messageReaction.users.remove(user.id);
      //       await confirmCensor.edit({ content: 'We\'ve chosen to leave it, then. That\'s alright by me. I just thought I\'d check.', components: [] });
      //       console.log('confirmCensor channel', confirmCensor.channel.name, 'currentChannel', currentChannel.name);
      //       // setTimeout(confirmCensor.delete, 8000);
      //       setTimeout(attemptDelete, 8000);
      //     }
      //   } catch (error) {
      //     console.log('reason why this still happens: ', error);
      //     await messageReaction.users.remove(user.id);
      //     await confirmCensor.edit('...Alright, well if you\'d like to revisit this, let me know.');
      //     setTimeout(attemptDelete, 8000);
      //   }
      // }
    })
  });

  client.commands = new Collection();

  writeCommandsToClient(client);
  deployCommandsToServer();

  // Log in to Discord with your client's token
  client.login(token);

}
