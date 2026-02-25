import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { Collection, REST, Routes, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function numberToWords(n) {
    if (n === 0) return 'Zero';

    const single_digits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double_digits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function translate(num) {
        let word = "";
        if (num < 10) {
            word = single_digits[num] + ' ';
        } else if (num < 20) {
            word = double_digits[num - 10] + ' ';
        } else {
            word = 'an undetermined amount of'
        }
        return word;
    }

    let result = translate(n);
    return result.trim();
}

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

export function getRandomTea() {
  const teaList = [
    'I\'ll brew you my favorite. This is a variant of Jasmine that I have imported from out of country. Every bead is a single Jasmine flower wrapped in a single Jasmine leaf, all by hand. The flavor is floral and pleasant, with hints of vanilla. It reminds me of my daughter. Please enjoy.',
    'You look a little worse for wear. Long night, eh? I suppose you could use something to wake you up. I\'ll brew you a cup of Earl Grey with a splash of cow\'s milk and sugar. Bold notes of bergamot orange, with plenty of sweetness to balance it out. The perfect cup to get you energized first thing in the morning.',
    'It\'s a quiet night. Not much going on, but it appears neither of us can sleep. This calls for some chammomile. It can tend to be a little... flat, sometimes. Maybe a little bitter. That\'s why I take care not to heat the water too much, and I add some rose petals and honey.',
    'I just got a shipment of peppermint. Please drink some. It\'s one of the simplest teas you can brew, while still being crisp and sharp on the tastebuds. A unique experience. ...*under breath* also, you\'re driving away business... your breath reeks...',
    'arsenic'
  ]
  return teaList[Math.floor(Math.random() * teaList.length)];
}

//to-do: set interaction to different name, find variable alternatives, refactor reply to message when found
export async function scheduleEvent(interaction, role, eventName, daysBefore) {
    const guild = interaction.guild;
    const events = await guild.scheduledEvents.fetch();
    const eventsArray = Array.from(events.values()) || [];
    const wordNumber = numberToWords(daysBefore);
    let fetchedEvent;
    eventsArray.forEach((event) => {
        if (event.name === eventName) fetchedEvent = event;
    })
    const channel = interaction.client.channels.cache.get(fetchedEvent.channelId);

    try {
        if (daysBefore % 1 !== 0) return interaction.reply({ content: "I can't calculate fractions of a day. That's a little too much guesswork. Please enter a number of days.", flags: MessageFlags.Ephemeral });

        // Calculate 3 days before
        const milliseconds = daysBefore * 24 * 60 * 60 * 1000; // milliseconds in 3 days
        const eventTimestamp = fetchedEvent.scheduledStartTimestamp;
        const reminderTimestamp = eventTimestamp - milliseconds;

        if (reminderTimestamp < Date.now()) {
            return interaction.reply({ content: "That date is in the past!", flags: MessageFlags.Ephemeral });
        }

        const reminderMessage = `🔔 Reminder: ${role} have a session in ${wordNumber} days. Please react to this message if you are able to attend. If you do not, I will address you directly tomorrow.
            \nEvent Details:
            \nEvent Date: <t:${Math.floor(eventTimestamp / 1000)}:F> (<t:${Math.floor(eventTimestamp / 1000)}:R>).
            \nEvent Name: ${eventName}
            \nGroup: ${role}
            \nRecap Link: (coming soon)`;

        setTimeout(() => {
            channel.send(reminderMessage)
                .then(() => console.log(`Reminder sent for event ${eventName}`))
                .catch(console.error);
        }, eventTimestamp - Date.now()); // Delay from *now* until the scheduled time

        await interaction.reply({ content: `Reminder scheduled for <t:${Math.floor(reminderTimestamp / 1000)}:F> (<t:${Math.floor(reminderTimestamp / 1000)}:R>).`, flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "Something went wrong scheduling the reminder.", flags: MessageFlags.Ephemeral });
    }
}

//to-do: set interaction to different name, find variable alternatives, refactor reply to message when found
export async function scheduleEventOnBoot(client, savedEvent, serverId) {
    const serverName = savedEvent.serverName;
    const role = savedEvent.role;
    const eventName = savedEvent.event;
    const daysBefore = savedEvent.daysBefore;
    const guild = client.guilds.cache.get(serverId);
    if (guild.name !== serverName) return;
    const events = await guild.scheduledEvents.fetch();
    const eventsArray = Array.from(events.values());
    console.log(`events array for ${serverId}: `,eventsArray);
    if (eventsArray.length === 0) return;
    const wordNumber = numberToWords(daysBefore);
    let fetchedEvent;
    let channel;
    eventsArray.forEach((event) => {
        if (event.name === eventName) {
          fetchedEvent = event;
          console.log('fetched event: ',fetchedEvent);
          channel = guild.channels.cache.get(fetchedEvent.channelId)
          console.log('channel', channel);
        }
    })

    try {
        if (daysBefore % 1 !== 0) return channel.send({ 
          content: "I can't calculate fractions of a day. That's a little too much guesswork. Please enter a number of days.",
          flags: MessageFlags.Ephemeral,
        }); 

        // Calculate 3 days before
        const milliseconds = daysBefore * 24 * 60 * 60 * 1000; // milliseconds in 3 days
        const eventTimestamp = fetchedEvent.scheduledStartTimestamp;
        const reminderTimestamp = eventTimestamp - milliseconds;

        if (reminderTimestamp < Date.now()) {
            return channel.send({ content: "That date is in the past!", flags: MessageFlags.Ephemeral });
        }

        const reminderMessage = `🔔 Reminder: ${role} have a session in ${wordNumber} days. Please react to this message if you are able to attend. If you do not, I will address you directly tomorrow.
            \nEvent Details:
            \nEvent Date: <t:${Math.floor(eventTimestamp / 1000)}:F> (<t:${Math.floor(eventTimestamp / 1000)}:R>).
            \nEvent Name: ${eventName}
            \nGroup: ${role}
            \nRecap Link: (coming soon)`;

        setTimeout(() => {
            channel.send(reminderMessage)
                .then(() => console.log(`Reminder sent for event ${eventName}`))
                .catch(console.error);
        }, eventTimestamp - Date.now()); // Delay from *now* until the scheduled time

        await channel.send({ content: `Reminder scheduled for <t:${Math.floor(reminderTimestamp / 1000)}:F> (<t:${Math.floor(reminderTimestamp / 1000)}:R>).`, flags: MessageFlags.Ephemeral, });
    } catch (error) {
        console.error(error);
        channel.send({ content: "Something went wrong scheduling the reminder.", flags: MessageFlags.Ephemeral });
    }
}


const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);
const foldersPath = path.join(dirName, 'commands');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APP_ID;
const guildIds = process.env.SERVER_ID;
const allowedServers = guildIds ? guildIds.split(',') : [];

export async function writeCommandsToClient(client) {
  const commandFolders = fs.readdirSync(foldersPath);
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const filePathFixed = pathToFileURL(filePath).href;
      const command = await import(filePathFixed + `?update=${Date.now()}`);
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
  console.log('Commands updated in the client.', /*you can use client.commands here to look at them*/);
}

export async function deployCommandsToServer() {
  const commands = []
  const commandFolders = fs.readdirSync(foldersPath);
  console.log('allowedServers', allowedServers);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const filePathFixed = pathToFileURL(filePath).href;
      const command = await import(filePathFixed + `?update=${Date.now()}`);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(token);

  // and deploy your commands!
  (async () => {
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);
      allowedServers.forEach(async (server) => {
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationGuildCommands(clientId, server), { body: commands });
  
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        console.log(data);
      })
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();
}

const spellDcs = [
    { name: '1st Level', value: '11' },
    { name: '2nd Level', value: '12' },
    { name: '3rd Level', value: '13' },
    { name: '4th Level', value: '14' },
    { name: '5th Level', value: '15' },
    { name: '6th Level', value: '16' },
    { name: '7th Level', value: '17' },
    { name: '8th Level', value: '18' },
    { name: '9th Level', value: '19' },
]

const dice = [
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188978201334002/1_1.gif?ex=69783312&is=6976e192&hm=8f8e70dbb59b1e764c1a5074a97f2a1136a9b4f426654e2eea0556d61d24f742&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189019976597554/2.gif?ex=6978331c&is=6976e19c&hm=194c779a9648f63b2359db1be8faaaca1f4cb9b961518def9bfa868ef1c77aab&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189019448250399/3.gif?ex=6978331c&is=6976e19c&hm=44beb71a7b801187f0c9c9cd2d5fbef41ad17995f538c58a261f45fe858baa27&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189019158581259/4.gif?ex=6978331c&is=6976e19c&hm=c9d2dc31fe0b7bc6f4c65be77b198b02fce4fc631fcb44530635486465a92f11&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189018865242252/5.gif?ex=6978331b&is=6976e19b&hm=cbfc91972f78c6a92e208c860b94cb3459413d891c221e17ae4f3a7d1ca3be2f&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189018575569009/6.gif?ex=6978331b&is=6976e19b&hm=5382310e19564949050ec061e33f46ff9db0ab95bfde87881becb512fdb581c0&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189018311462964/7.gif?ex=6978331b&is=6976e19b&hm=196bd5ea657aaba57a2d1b96483c7b3f51d47d842327636c8a119da461bb81f3&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189017954816030/8.gif?ex=6978331b&is=6976e19b&hm=c48cf77aaadd0800a13aef24379170a4f4785a1cfa9f5ceb7ecb1fe0702acc33&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189017636311193/9.gif?ex=6978331b&is=6976e19b&hm=b8c28599c14f19560556358787efd91e0b1e0b521036cfdfbdc2e3cc2ae5c589&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189017367609388/10.gif?ex=6978331b&is=6976e19b&hm=a28491bef66c31fde8fe57b9c12b9802526864e55422956d5a129c1f8f3aef08&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465189017074139433/11.gif?ex=6978331b&is=6976e19b&hm=91f23a4ce68969486ef1a4034c6023138eb527cc8946fcecfcd7655a75b822fc&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188981380616253/12.gif?ex=69783313&is=6976e193&hm=2fc35cd7e8c7735a056042dc94868b33e372abb7362ebd0c8e227ca5ac8db537&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188981057781976/13.gif?ex=69783312&is=6976e192&hm=9f322317f49b4800929aa3705e76802e18511e6d49ca5d76da8dc45919132148&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188980550013136/14.gif?ex=69783312&is=6976e192&hm=d6944980ecac5756d40361b0357f52ed35ca0dfb4f58974ad7df58f70e2c1203&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188980155879475/15.gif?ex=69783312&is=6976e192&hm=e6a945692084a88ee2992b5021f8e35cb7f7329632c3c2a8c0a3dae7ffef212e&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188979895959717/16.gif?ex=69783312&is=6976e192&hm=e861833f60b104e642374bec6b8fab45bedcb8492b14dd83708b5720268bac7d&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188979358830635/17.gif?ex=69783312&is=6976e192&hm=356de9bcfa90e69800853f3f6b07358681d2100cacdf8d194785255194ccc470&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188979056972064/18.gif?ex=69783312&is=6976e192&hm=29e1d4132c5535fcf8012089179407cec35c004ccf4b473d65739e6b7c20eeab&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188978771886316/19.gif?ex=69783312&is=6976e192&hm=c41a9dbbbc7cfbd81295cdd1a733bae737d974b6e49064e67f6d120987db668b&',
  'https://cdn.discordapp.com/attachments/1462934450332766430/1465188978498998457/20.gif?ex=69783312&is=6976e192&hm=0cb308423277141a8087d1c84535f151521744284ef2d46df434a2e1addc7b4c&'
]

export async function castSpell(interaction) {
  const rollButton = new ButtonBuilder().setCustomId('roll').setLabel('Roll').setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder().addComponents(rollButton);

  const spell = interaction.options.getString('spell');
  const level = interaction.options.getString('level');
  const spellDc = spellDcs.find(dc => dc.name === level).value;
  const rolledNumber = Math.floor(Math.random() * 20) + 1;
  console.log(level);
  const target = interaction.options.getUser('target');
  await interaction.reply({
      content: `Hey ${target}, ${interaction.user.displayName} has cast ${spell} at ${level}. Please roll your saving throw (Save DC: ${spellDc}).`,
      withResponse: true,
  });
  const challenge = await target.send({
      content: `Hey ${target}, ${interaction.user.displayName} has cast ${spell} at ${level}. Please roll your saving throw (Save DC: ${spellDc}).`,
      components: [row],
  })
  try {
      const filter = (i) => {
          return i.user.id === target.id;
      }
      const confirmation = await challenge.awaitMessageComponent({ filter, time: 60_000 });
      if (confirmation.customId === 'roll') {
          const passFailString = rolledNumber >= parseInt(spellDc) ? 'passed' : 'failed'
          await interaction.followUp({
            content: `${target} has rolled a ${rolledNumber} and has ${passFailString} their saving throw against ${spell}. ${dice[rolledNumber - 1]}`
          }).then(() => { 
            challenge.edit({components: []});
            challenge.reply(`You passed this one with a ${rolledNumber}! Good save.`);
          })
      }
  } catch (error) {
      console.log('coward: ', error);
      await interaction.followUp({
        content: `${target} has not rolled their saving throw in time and has failed, taking ${spell}'s full effects. ${dice[0]}`,
      });
      challenge.edit({
        content: `~~Hey ${target}, ${interaction.user.displayName} has cast ${spell} at ${level}. Please roll your saving throw (Save DC: ${spellDc}).~~\n\nLooks like you failed to respond to this one in time.`,
        components: []
      });
  }
}