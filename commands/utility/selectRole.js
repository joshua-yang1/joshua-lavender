import { MessageFlags, StringSelectMenuBuilder, ActionRowBuilder, SlashCommandBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('select-role')
    .setDescription('Select a role from the menu.');
export async function execute(interaction) {
    if (interaction.guildId === '385969323036114954') {
        interaction.reply('Role selection command is not available in the Pathfinder server.')
    } else {
        const options = [
            {
                label: 'Florida Man (if we met in Florida)',
                value: 'Florida Man'
            },
            {
                label: 'Ohio Will Be Eliminated (if we met in Ohio)',
                value: 'Ohio Will Be Eliminated'
            },
            {
                label: 'Elite Doxxer (if we met online)',
                value: 'Elite Doxxer'
            },
            {
                label: 'Art Goblin (get tagged in art posts)',
                value: 'Art Goblin'
            },
            {
                label: 'Audiophile (get tagged in music posts)',
                value: 'Audiophile'
            },
            {
                label: 'Nat 1 Roller (get tagged in ttrpg posts)',
                value: 'Nat 1 Roller'
            },
            {
                label: 'Extrovert (if you wanna be talked to)',
                value: 'Extrovert'
            },
            {
                label: 'Introvert (if you wanna be included, but left alone)',
                value: 'Introvert'
            },
            {
                label: 'Irish Goodbye (if you leave calls without saying goodbye)',
                value: 'Irish Goodbye'
            },
            {
                label: 'Trigger Warning (if you want people to be mindful of your triggers)',
                value: 'Trigger Warning'
            },
            {
                label: '[at your own risk] Rob Victim',
                value: 'Rob Victim'
            },
            {
                label: '[nsfw access: partial, no nudes] Gooner',
                value: 'Gooner'
            },
            {
                label: '[nsfw access: partial, no posting] Voyeur',
                value: 'Voyeur'
            },
            {
                label: '[nsfw access: full] Exhibitionist',
                value: 'Exhibitionist'
            }
        ]
        const currentlySelectedRoles = interaction.member.roles.cache;
        const selectedRoleNames = currentlySelectedRoles.map(r => r.name);
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role_select_menu')
            .setPlaceholder('Lets you select your own roles.')
            .setMinValues(1) // Minimum number of roles a user must select
            .setMaxValues(Math.min(options.length, 25))
            .addOptions(options.map((option) => {
                const builtOption = new StringSelectMenuOptionBuilder()
                    .setLabel(option.label)
                    .setValue(option.value);
                if (selectedRoleNames.find(n => n === option.value)) {
                    builtOption.setDefault(true);
                }
                return builtOption;
            }))
        const actionRow = new ActionRowBuilder()
            .addComponents(selectMenu);
        
        await interaction.reply({
            content: 'Go ahead and grab some roles for yourself. You can have as many as you want, but now that you\'re here, you need at least one of the Florida/Ohio/Internet roles just so I can sort you guys easier. Any extra stuff you need to know, just check the roles channel at #roles .',
            components: [actionRow],
            flags: MessageFlags.Ephemeral // Makes the message only visible to the user who used the command
        });
    }
}

