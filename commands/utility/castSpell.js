import { SlashCommandBuilder } from 'discord.js';
import { castSpell } from '../../utils.js';

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
    castSpell(interaction);
}