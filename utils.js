import 'dotenv/config';

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


export function getRandomTea() {
  const teaList = [
    'jasmine tea',
    'earl grey tea',
    'chamomile tea',
    'peppermint tea',
    'arsenic'
  ]
  return teaList[Math.floor(Math.random() * teaList.length)];
}

//to-do: set interaction to different name, find variable alternatives, refactor reply to message when found
export async function scheduleEvent(interaction, role, eventName, daysBefore, channelName) {
    const guild = interaction.guild;
    const events = await guild.scheduledEvents.fetch();
    const eventsArray = Array.from(events.values()) || [];
    const numberToWords = numberToWords(daysBefore);
    console.log('events', events);
    let fetchedEvent;
    eventsArray.forEach((event) => {
        console.log('event', event);
        if (event.name === eventName) fetchedEvent = event;
    })
    console.log('guild', guild);
    const channel = guild.channels.cache.find(channel => channel.name === channelName);
    const channelId = channel.id;

    try {
        if (daysBefore % 1 !== 0) return interaction.reply({ content: "I can't calculate fractions of a day. That's a little too much guesswork. Please enter a number of days.", ephemeral: true });

        // Calculate 3 days before
        const milliseconds = daysBefore * 24 * 60 * 60 * 1000; // milliseconds in 3 days
        const eventTimestamp = fetchedEvent.scheduledStartTimestamp;
        const reminderTimestamp = eventTimestamp - milliseconds;

        if (reminderTimestamp < Date.now()) {
            return interaction.reply({ content: "That date is in the past!", ephemeral: true });
        }

        const reminderMessage = `🔔 Reminder: ${role} have a session in ${numberToWords} days. Please react to this message if you are able to attend. If you do not, I will address you directly tomorrow.
            \nEvent Details:
            \nEvent Date: <t:${Math.floor(eventTimestamp / 1000)}:F> (<t:${Math.floor(eventTimestamp / 1000)}:R>).
            \nEvent Name: ${eventName}
            \nGroup: ${role}
            \nRecap Link: (coming soon)`;

        setTimeout(() => {
            interaction.client.channels.cache.get(channelId)?.send(reminderMessage)
                .then(() => console.log(`Reminder sent for event ${eventName}`))
                .catch(console.error);
        }, eventTimestamp - Date.now()); // Delay from *now* until the scheduled time

        await interaction.reply({ content: `Reminder scheduled for <t:${Math.floor(reminderTimestamp / 1000)}:F> (<t:${Math.floor(reminderTimestamp / 1000)}:R>).`, ephemeral: true });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "Something went wrong scheduling the reminder.", ephemeral: true });
    }
}