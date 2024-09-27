require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { DateTime } = require('luxon'); // Import luxon for date/time formatting

// Ensure that the DISCORD_TOKEN environment variable is loaded
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
    console.error('Error: Bot token or client ID is not set in the environment variables.');
    process.exit(1);  // Exit the application if the token or client ID is missing
}

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// Define the commands
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies With Pong!'),
    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Replies With An Embedded Message.'),
    new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays Information About The Server.'),
    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Displays The Avatar Of A User.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The User To Get The Avatar Of')
                .setRequired(false)),
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Repeats Your Message.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The Message To Repeat')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick A User.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The User To Kick')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban A User.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The User To Ban')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Creates A Poll.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The Poll Question')
                .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Custom Title For The Poll')
                        .setRequired(false)), // Custom title is optional
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears A Specified Number Of Messages.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number Of Messages To Delete')
                .setRequired(true))
].map(command => command.toJSON());

// Register commands with Discord API
const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started Refreshing Application (/) Commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log('Successfully Reloaded Application (/) Commands.');
    } catch (error) {
        console.error('Error refreshing application (/) commands:', error);
    }
})();

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged In As ${client.user.tag}!`);

    // Define activity status options
    const activities = [
        { name: 'Welcome To D4 Community', type: ActivityType.Custom },
        { name: 'DR4GY BOY', type: ActivityType.Listening },
        { name: 'D4 Community', type: ActivityType.Watching }
    ];

    let index = 0;
    // Update activity status every 10 seconds
    setInterval(() => {
        const activity = activities[index];
        client.user.setPresence({
            activities: [{ name: activity.name, type: activity.type }],
            status: 'dnd' // 'dnd' for Do Not Disturb
        });
        index = (index + 1) % activities.length;
    }, 10000); // Update every 10 seconds
});

// Respond to interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    try {
        const { commandName } = interaction;

        if (commandName === 'ping') {
            const userMention = `<@${interaction.user.id}>`;
            await interaction.reply(`> ${userMention} Pong 🎉`);
        } else if (commandName === 'embed') {
            const embed = new EmbedBuilder()
                .setTitle('Sample Embed')
                .setDescription('This Is An Embedded Sample Message!')
                .setColor(0x00AE86);
            await interaction.reply({ embeds: [embed] });
        } else if (commandName === 'serverinfo') {
            const { guild } = interaction;
            const embed = new EmbedBuilder()
                .setTitle(`${guild.name} Server Info`)
                .setDescription(`Total Members: ${guild.memberCount}`)
                .setColor(0x00AE86);
            await interaction.reply({ embeds: [embed] });
        } else if (commandName === 'avatar') {
            const user = interaction.options.getUser('target') || interaction.user;
            await interaction.reply(user.displayAvatarURL({ dynamic: true }));
        } else if (commandName === 'say') {
            const message = interaction.options.getString('message');
            await interaction.reply(message);
        } else if (commandName === 'kick') {
            const user = interaction.options.getUser('target');
            const member = interaction.guild.members.cache.get(user.id);

            if (member && member.kickable) {
                await member.kick();
                await interaction.reply(`> Kicked ${user.username}`);
            } else {
                await interaction.reply('> I cannot kick this user.');
            }
        } else if (commandName === 'ban') {
            const user = interaction.options.getUser('target');
            const member = interaction.guild.members.cache.get(user.id);

            if (member && member.bannable) {
                await member.ban();
                await interaction.reply(`Banned ${user.username}`);
            } else {
                await interaction.reply('> I cannot ban this user.');
            }
        // Modified /poll command to include the user's avatar as thumbnail
    } else if (commandName === 'poll') { 
        const question = interaction.options.getString('question');
        const title = interaction.options.getString('title') || 'D4 Community Latest Poll'; // Default title if no custom title is provided
        const user = interaction.user;  // Get the user who initiated the poll
        
        const pollEmbed = new EmbedBuilder()
            .setAuthor({ name: 'DR4GY BOY', iconURL: 'https://media.discordapp.net/attachments/1254025245950611587/1254027232075055235/Image_142.jpeg?ex=66d1a55e&is=66d053de&hm=d4457cc35462cf615bfc73ec2873d8ed80d37ad3025cb5678334e065a7fe516e&=&format=webp&width=473&height=473' })  // Use your own logo link here
            .setTitle(title) // Custom or default title
            .setDescription(question)
            .setColor(`#ffcc00`)
            .setTimestamp()
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))  // Set the user's avatar as the thumbnail
            .setFooter({text: `DR4GY BOY Community | © Copyright All Right Reserved 2024`, iconURL: 'https://media.discordapp.net/attachments/1254025245950611587/1254027232075055235/Image_142.jpeg?ex=66d1a55e&is=66d053de&hm=d4457cc35462cf615bfc73ec2873d8ed80d37ad3025cb5678334e065a7fe516e&=&format=webp&width=473&height=473'});
    
        const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });
        pollMessage.react('👍');
        pollMessage.react('👎');
        pollMessage.react('<:DR4GYBOY:1248997833617707020>');
        pollMessage.react('<a:Verification:1248969180481585344>');
    }
    
 else if (commandName === 'clear') {
            const amount = interaction.options.getInteger('amount');

            if (amount <= 100) {
                const messages = await interaction.channel.bulkDelete(amount, true);
                await interaction.reply(`> Successfully Cleared **${messages.size}** Messages. <:Correct:1248976791629074564>`);
            } else {
                await interaction.reply('> You Can Delete Up To **100** Messages At One Time. <:Wrong:1248976848570945594>');
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply('> There Was An Error While Executing This Command!');
    }
});

// Handle messages with !userinfo prefix
client.on('messageCreate', async message => {
    if (message.content.startsWith('!userinfo')) {
        const args = message.content.split(' ');
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);

        if (!member) {
            await message.channel.send('User not found in the guild.');
            return;
        }

        const topRole = member.roles.highest;
        const topRoleMention = `<@&${topRole.id}>`;  // Mentioning the role by ID

        const joinDate = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown'; // Mentioning the role by ID

        const embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setAuthor({ name: 'DR4GY BOY', iconURL: 'https://media.discordapp.net/attachments/1254025245950611587/1254027232075055235/Image_142.jpeg?ex=66d1a55e&is=66d053de&hm=d4457cc35462cf615bfc73ec2873d8ed80d37ad3025cb5678334e065a7fe516e&=&format=webp&width=473&height=473' })  // Use your own logo link here
            .setTitle(`User Information <a:Discord:1250318533649371187>`)
            .addFields(
                { name: 'User:', value: `${user}`, inline: true },
                { name: 'Member Id:', value: `\`${user.id}\``, inline: true },
                { name: 'Discord Tag:', value: `\`${user.tag}\``, inline: true },
                { name: 'Top Role:', value: `${topRoleMention}`, inline: true },  // Mention the role
                { name: 'Joined Server On:', value: `${joinDate}`, inline: true } // User joined date
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({text: `DR4GY BOY Community | © Copyright All Right Reserved 2024`, iconURL: 'https://media.discordapp.net/attachments/1254025245950611587/1254027232075055235/Image_142.jpeg?ex=66d1a55e&is=66d053de&hm=d4457cc35462cf615bfc73ec2873d8ed80d37ad3025cb5678334e065a7fe516e&=&format=webp&width=473&height=473'});

        await message.channel.send({ embeds: [embed] });
    }

    // Handle messages that start with /Hello
    if (message.content.startsWith('/Hello')) {
        const userMention = `<@${message.author.id}>`;
        message.channel.send(`> ${userMention} Hello Homie!`);
    }
});

// Login to Discord with your bot's token
client.login(token);
