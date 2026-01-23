import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';

export const data = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Starts the player.")
    .addSubcommand(subcommand =>
        subcommand
            .setName("search")
            .setDescription("Searches for a song and plays it")
            .addStringOption(option =>
                option.setName("searchterms").setDescription("search keywords").setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName("playlist")
            .setDescription("Plays a playlist from YT")
            .addStringOption(option => option.setName("url").setDescription("the playlist's url").setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
        .setName("song")
        .setDescription("Plays a single song from YT")
        .addStringOption(option => option.setName("url").setDescription("the song's url").setRequired(true))
    )
    
export async function execute(interaction) {
    const player = useMainPlayer();
    const channel = interaction.member.voice.channel;

    if (!channel)
        return interaction.reply('You are not connected to a voice channel!'); // make sure we have a voice channel
    
    // let's defer the interaction as things can take time to process
    await interaction.deferReply();
    
    let embed = new EmbedBuilder()
    
    if (interaction.options.getSubcommand() === "song") {
        let url = interaction.options.getString("url")
        
        // Search for the song using the discord-player
        const result = await player.search(url, {
            requestedBy: interaction.user
        })

        // finish if no tracks were found
        if (result.tracks.length === 0)
            return interaction.reply("No results")

        // Add the track to the queue
        const song = result.tracks[0]
        try {
            const { track } = await player.play(channel, song, {
                nodeOptions: {
                    // nodeOptions are the options for guild node (aka your queue in simple word)
                    metadata: interaction.channel, // we can access this metadata object using queue.metadata later on
                    bufferingTimeout: 15000, //How long the player should attempt buffering before giving up
                    leaveOnStop: true, //If player should leave the voice channel after user stops the player
                    leaveOnStopCooldown: 5000, //Cooldown in ms
                    leaveOnEnd: true, //If player should leave after the whole queue is over
                    leaveOnEndCooldown: 15000, //Cooldown in ms
                    leaveOnEmpty: true, //If the player should leave when the voice channel is empty
                    leaveOnEmptyCooldown: 300000, //Cooldown in ms
                    skipOnNoStream: true,
                },
            });
        
            interaction.followUp(`**${track.title}** enqueued!`);
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp(`Something went wrong: ${e}`);
        }
        embed
            .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Duration: ${song.duration}`})

    } else if (interaction.options.getSubcommand() === "playlist") {

        // Search for the playlist using the discord-player
        let url = interaction.options.getString("url")
        const result = await player.search(url, {
            requestedBy: interaction.user
        })

        if (result.tracks.length === 0)
            return interaction.reply(`No playlists found with ${url}`)
        
        // Add the tracks to the queue
        const playlist = result.playlist
        try {
            const { track } = await player.play(channel, playlist, {
                nodeOptions: {
                    // nodeOptions are the options for guild node (aka your queue in simple word)
                    metadata: interaction.channel, // we can access this metadata object using queue.metadata later on
                    bufferingTimeout: 15000, //How long the player should attempt buffering before giving up
                    leaveOnStop: true, //If player should leave the voice channel after user stops the player
                    leaveOnStopCooldown: 5000, //Cooldown in ms
                    leaveOnEnd: true, //If player should leave after the whole queue is over
                    leaveOnEndCooldown: 15000, //Cooldown in ms
                    leaveOnEmpty: true, //If the player should leave when the voice channel is empty
                    leaveOnEmptyCooldown: 300000, //Cooldown in ms
                    skipOnNoStream: true,
                },
            });
        
            interaction.followUp(`**${track.title}** enqueued!`);
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp(`Something went wrong: ${e}`);
        }
        embed
            .setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** have been added to the Queue`)
            .setThumbnail(playlist.thumbnail)

    } else if (interaction.options.getSubcommand() === "search") {

        // Search for the song using the discord-player
        let url = interaction.options.getString("searchterms")
        const result = await player.search(url, {
            requestedBy: interaction.user
        })

        // finish if no tracks were found
        if (result.tracks.length === 0)
            return interaction.editReply("No results")
        
        // Add the track to the queue
        const song = result.tracks[0]
         try {
            const { track } = await player.play(channel, song, {
                nodeOptions: {
                    // nodeOptions are the options for guild node (aka your queue in simple word)
                    metadata: interaction.channel, // we can access this metadata object using queue.metadata later on
                    bufferingTimeout: 15000, //How long the player should attempt buffering before giving up
                    leaveOnStop: true, //If player should leave the voice channel after user stops the player
                    leaveOnStopCooldown: 5000, //Cooldown in ms
                    leaveOnEnd: true, //If player should leave after the whole queue is over
                    leaveOnEndCooldown: 15000, //Cooldown in ms
                    leaveOnEmpty: true, //If the player should leave when the voice channel is empty
                    leaveOnEmptyCooldown: 300000, //Cooldown in ms
                    skipOnNoStream: true,
                },
            });
        
            interaction.followUp(`**${track.title}** enqueued!`);
        } catch (e) {
            // let's return error if something failed
            return interaction.followUp(`Something went wrong: ${e}`);
        }
        embed
            .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `Duration: ${song.duration}`})
    }
    
    // Respond with the embed containing information about the player
    await interaction.followUp({
        embeds: [embed]
    })
}