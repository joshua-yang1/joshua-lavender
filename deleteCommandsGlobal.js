import { REST, Routes } from 'discord.js';
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const servers = process.env.SERVER_ID ? process.env.SERVER_ID.split(',') : [];

(() => {
    servers.forEach(async (server) => {
        try {
            // For all guild-based commands
            await rest.put(
                Routes.applicationGuildCommands(process.env.APP_ID, server),
                { body: [] },
            );
            console.log('Successfully deleted all guild commands.');
        } catch (error) {
            console.error(error);
        }
    })
})();