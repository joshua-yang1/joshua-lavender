import { SlashCommandBuilder } from 'discord.js';
import * as math from 'mathjs';

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls a d20 for you to save you the trouble of finding one yourself.')
    .addStringOption(option =>
        option.setName('dicenotation').setDescription('Use Roll20 dice notation here. Alternatively, just leave this blank to roll a single d20.').setRequired(false)
    );
export async function execute(interaction) {
    const notation = interaction.options.getString('dicenotation');
    let equation = notation;
    let expressionResult;
    const diceRolled = [];

    if (notation) {
        const matches = [...equation.matchAll(/(\d*)d(\d+)/gi)];

        if (matches.length === 0) {
            // No valid dice notation found; fall back or evaluate as plain math
            expressionResult = math.evaluate(equation);
        } else {
            matches.forEach((match) => {
                const [fullMatch, countStr, sidesStr] = match;
                const count = countStr ? parseInt(countStr) : 1;
                const sides = parseInt(sidesStr);

                let total = 0;
                const rolls = [];
                for (let i = 0; i < count; i++) {
                    const roll = Math.floor(Math.random() * sides) + 1;
                    rolls.push(roll);
                    total += roll;
                }

                diceRolled.push(`${fullMatch}: [${rolls.join(', ')}] = ${total}`);
                equation = equation.replace(fullMatch, `(${total})`);
            });

            expressionResult = math.evaluate(equation);
        }
    } else {
        expressionResult = Math.floor(Math.random() * 20) + 1;
    }

    await interaction.reply(
        `Rolling ${notation ? notation : "a D20"}: ${diceRolled.length > 0 ? `${expressionResult} (${diceRolled.join(", ")})` : expressionResult}`
    );
}

