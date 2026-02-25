import 'dotenv/config';
import { REST, Routes } from 'discord.js';
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        // For all global commands
        await rest.put(
            Routes.applicationCommands(process.env.APP_ID),
            { body: [] },
        );
        console.log('Successfully deleted all global commands.');
    } catch (error) {
        console.error(error);
    }
})();