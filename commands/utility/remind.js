import { SlashCommandBuilder } from 'discord.js';
import { scheduleEvent } from '../../utils.js';

export const data = new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Schedules a reminder for all of the adventurers in an event')
    .addRoleOption(option =>
        option.setName('role').setDescription('The role associated with the scheduled session').setRequired(true)
    )
    .addStringOption(option =>
        option.setName('event').setDescription('The event you\'d like to schedule a reminder for').setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('days').setDescription('The number of days before the session to send the first reminder').setRequired(true)
    )
    .addChannelOption(option =>
        option.setName('channel').setDescription('The channel to post the reminder in').setRequired(true)
    )
;
export async function execute(interaction) {
    const role = interaction.options.getRole('role');
    const eventName = interaction.options.getString('event'); // e.g., "2026-02-15T14:00:00Z"
    const daysBefore = interaction.options.getInteger('days');
    const channelName = interaction.options.getChannel('channel'); // The channel to send the reminder in
    scheduleEvent(interaction, role, eventName, daysBefore, channelName);
}