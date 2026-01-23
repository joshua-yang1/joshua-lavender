import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ActionRowBuilder } from 'discord.js';

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

]

const rollButton = new ButtonBuilder().setCustomId('roll').setLabel('Roll').setStyle(ButtonStyle.Primary);
const row = new ActionRowBuilder().addComponents(rollButton);


export const data = new SlashCommandBuilder()
    .setName('cast-spell')
    .setDescription('Casts a spell at your opponent.')
    .addUserOption(option => 
        option.setName('target').setDescription('The target you are casting against.').setRequired(true)
    )
    .addStringOption(option => 
        option.setName('spell').setDescription('The spell you would like to cast.').setRequired(true)
    )
    .addStringOption(option => 
        option.setName('level').setDescription('The spell level you would like to use.').setRequired(true)
        .addChoices(
            { name: '1st Level', value: '1st Level' },
            { name: '2nd Level', value: '2nd Level' },
            { name: '3rd Level', value: '3rd Level' },
            { name: '4th Level', value: '4th Level' },
            { name: '5th Level', value: '5th Level' },
            { name: '6th Level', value: '6th Level' },
            { name: '7th Level', value: '7th Level' },
            { name: '8th Level', value: '8th Level' },
            { name: '9th Level', value: '9th Level' },
        )
    )
export async function execute(interaction) {
    const spell = interaction.options.getString('spell');
    const level = interaction.options.getString('level');
    const spellDc = spellDcs.find(dc => dc.name === level).value;
    console.log(level);
    const target = interaction.options.getUser('target');
    interaction.reply('Surprise Round!');
    const challenge = await interaction.channel.send({
        content: `Hey ${target}, ${interaction.user.displayName} has cast ${spell} at ${level}. Please roll your saving throw (Save DC: ${spellDc}).`,
        components: [row],
        withResponse: true,
        fetchReply: true,
    });
    try {
        const filter = (i) => {
            console.log('interaction user id: ', i.user.id, 'target id', target.id);
            return i.user.id === target.id;
        }
        const confirmation = await challenge.awaitMessageComponent({ filter, time: 60_000 });
        if (confirmation.customId === 'roll') {
            const rolledNumber = Math.floor(Math.random() * 20) + 1;
            const passFailString = rolledNumber >= parseInt(spellDc) ? 'passed' : 'failed'
            await interaction.channel.send(
                `${target} has rolled a ${rolledNumber} and has ${passFailString} their saving throw.`
            ).then(() => {
                challenge.edit({components: []});
            }).catch(console.error);
        }
    } catch (error) {
        console.log('coward: ', error);
        await interaction.channel.send(
            `${target} has not rolled their saving throw in time and has failed, taking ${spell}'s full effects.`
        );
        challenge.edit({components: []});
    }
}