const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

// ======================================================
// PLUTO BOT — VOID COMMUNITY
// ======================================================

// IMPORTANT:
// Put your NEW Discord bot token between the quotes.
// NEVER share your token with anyone.
const TOKEN = process.env.DISCORD_TOKEN;

const CLIENT_ID = '1546493953396834364';

// Optional:
// Put your Void Community server ID here.
// Leave '' if you want global commands.
const GUILD_ID = '1480236074910613718';


// ======================================================
// DATA FILE
// ======================================================

const DATA_FILE = path.join(__dirname, 'pluto-data.json');

let gameData = {};

function loadGameData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            gameData = JSON.parse(
                fs.readFileSync(DATA_FILE, 'utf8')
            );
        } else {
            gameData = {};
        }
    } catch (error) {
        console.error('Could not load game data:', error);
        gameData = {};
    }
}

function saveGameData() {
    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(gameData, null, 2)
        );
    } catch (error) {
        console.error('Could not save game data:', error);
    }
}

function getUserData(userId) {
    if (!gameData[userId]) {
        gameData[userId] = {
            coins: 0,
            games: 0,
            wins: 0,
            losses: 0
        };
    }

    return gameData[userId];
}

function addCoins(userId, amount) {
    const user = getUserData(userId);
    user.coins += amount;
    saveGameData();
}


// ======================================================
// BOT CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

    // ==================================================
    // BASIC
    // ==================================================

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if Pluto is online'),
   new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Pluto anything')
    .addStringOption(option =>
        option
            .setName('question')
            .setDescription('What do you want to ask Pluto?')
            .setRequired(true)
    )

    new SlashCommandBuilder()
        .setName('server')
        .setDescription('Show information about Void'),

    new SlashCommandBuilder()
        .setName('user')
        .setDescription('Show information about a user')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('User to check')
                .setRequired(false)
        ),

    // ==================================================
    // MODERATION
    // ==================================================

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make Pluto send a message')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('Message to send')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Member to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        ),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Member to ban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option
                .setName('member')
                .setDescription('Member to timeout')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('minutes')
                .setDescription('Timeout duration')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Reason')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    // ==================================================
    // GAMES
    // ==================================================

    new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and earn Pluto Coins'),

    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll a six-sided dice'),

    new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock Paper Scissors')
        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Rock',
                        value: 'rock'
                    },
                    {
                        name: 'Paper',
                        value: 'paper'
                    },
                    {
                        name: 'Scissors',
                        value: 'scissors'
                    }
                )
        ),

    new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer a random trivia question'),

    new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the Pluto slot machine'),

    // ==================================================
    // ECONOMY
    // ==================================================

    new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your Pluto Coins'),

    new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the Pluto Coins leaderboard'),

    new SlashCommandBuilder()
        .setName('games')
        .setDescription('View Pluto games')
        
].map(command => command.toJSON());


// ======================================================
// REGISTER COMMANDS
// ======================================================

const rest = new REST({
    version: '10'
}).setToken(TOKEN);

async function registerCommands() {

    try {

        console.log('Registering Pluto commands...');

        if (GUILD_ID) {

            await rest.put(
                Routes.applicationGuildCommands(
                    CLIENT_ID,
                    GUILD_ID
                ),
                {
                    body: commands
                }
            );

            console.log('Commands registered in Void!');

        } else {

            await rest.put(
                Routes.applicationCommands(
                    CLIENT_ID
                ),
                {
                    body: commands
                }
            );

            console.log('Commands registered globally!');
        }

    } catch (error) {

        console.error(
            'Command registration error:',
            error.message
        );
    }
}


// ======================================================
// RULES PANEL
// ======================================================

async function sendRulesPanel() {

    for (const guild of client.guilds.cache.values()) {

        console.log(
            `Checking rules channel in: ${guild.name}`
        );

        const rulesChannel =
            guild.channels.cache.find(
                channel =>
                    channel.isTextBased() &&
                    channel.name
                        .toLowerCase()
                        .endsWith('rules')
            );

        if (!rulesChannel) {

            console.log(
                `No rules channel found in ${guild.name}.`
            );

            continue;
        }

        try {

            const messages =
                await rulesChannel.messages.fetch({
                    limit: 20
                });

            const alreadyPosted =
                messages.some(
                    message =>
                        message.author.id === client.user.id &&
                        message.embeds.some(
                            embed =>
                                embed.title ===
                                'SERVER RULES PLEASE FOLLOW'
                        )
                );

            if (alreadyPosted) {

                console.log(
                    `Rules panel already exists in ${guild.name}.`
                );

                continue;
            }

            const rulesEmbed =
                new EmbedBuilder()
                    .setTitle(
                        'SERVER RULES PLEASE FOLLOW'
                    )
                    .setDescription(
                        '**VOID COMMUNITY**\n\n' +
                        'Please read and follow all server rules.'
                    )
                    .addFields(

                        {
                            name: '1) Be Respectful',
                            value:
                                'Show respect to all members. Harassment and bullying are not allowed in any form and may result in moderation.'
                        },

                        {
                            name: '2) Follow Discord’s Rules',
                            value:
                                'Do not do anything that could get yourself or this server banned from Discord.'
                        },

                        {
                            name: '3) Follow Real-World Laws',
                            value:
                                'Do not discuss or encourage activities that involve breaking real-world laws, including hacking or doxing.'
                        },

                        {
                            name: '4) No Adult Content',
                            value:
                                'Adult or NSFW content and NSFW images or videos are prohibited.'
                        },

                        {
                            name: '5) No Offensive Profiles',
                            value:
                                'Profile names or pictures containing adult or offensive material may be requested to be changed.'
                        },

                        {
                            name: '6) No Spamming',
                            value:
                                'Do not repeatedly send a large volume of messages.'
                        },

                        {
                            name: '7) Do Not Raid Other Servers',
                            value:
                                'Discussing or participating in raids of other servers is not tolerated.'
                        },

                        {
                            name: '8) No Advertising',
                            value:
                                'Advertising products, services, servers, or other communities is not allowed.'
                        },

                        {
                            name: '9) Contact Admin For Questions',
                            value:
                                'If you are unsure whether something is allowed, contact staff before posting it.'
                        },

                        {
                            name: '10) Follow Staff Decisions',
                            value:
                                'Moderators may take action when necessary to protect the community.'
                        }

                    )
                    .setFooter({
                        text:
                            'Void Community • Please follow the rules'
                    })
                    .setTimestamp();

            await rulesChannel.send({
                embeds: [rulesEmbed]
            });

            console.log(
                `Rules panel posted in ${guild.name}!`
            );

        } catch (error) {

            console.error(
                `Could not send rules panel in ${guild.name}:`,
                error.message
            );
        }
    }
}


// ======================================================
// LEADERBOARD PANEL
// ======================================================

async function updateLeaderboardPanel(guild) {

    try {

        const leaderboardChannel =
            guild.channels.cache.find(
                channel =>
                    channel.isTextBased() &&
                    (
                        channel.name
                            .toLowerCase()
                            .endsWith('leaderboard') ||
                        channel.name
                            .toLowerCase()
                            .includes('leaderboard')
                    )
            );

        if (!leaderboardChannel) {
            return;
        }

        const sortedUsers =
            Object.entries(gameData)
                .sort(
                    (a, b) =>
                        (b[1].coins || 0) -
                        (a[1].coins || 0)
                )
                .slice(0, 10);

        let description = '';

        if (sortedUsers.length === 0) {

            description =
                'No players yet.\n\n' +
                'Play Pluto games to become the first player!';

        } else {

            const medals = [
                '🥇',
                '🥈',
                '🥉'
            ];

            sortedUsers.forEach(
                ([userId, data], index) => {

                    const medal =
                        medals[index] ||
                        `**${index + 1}.**`;

                    description +=
                        `${medal} <@${userId}> — **${data.coins || 0} coins**\n`;
                }
            );
        }

        const leaderboardEmbed =
            new EmbedBuilder()
                .setTitle('PLUTO LEADERBOARD')
                .setDescription(
                    '🏆 **Top Pluto Coin Players**\n\n' +
                    description
                )
                .addFields({
                    name: '🎮 How to earn coins',
                    value:
                        'Use `/coinflip`, `/roll`, `/rps`, `/trivia`, and `/slots`.'
                })
                .setFooter({
                    text: 'Pluto Games • Leaderboard'
                })
                .setTimestamp();

        const messages =
            await leaderboardChannel.messages.fetch({
                limit: 20
            });

        const oldPanel =
            messages.find(
                message =>
                    message.author.id === client.user.id &&
                    message.embeds.some(
                        embed =>
                            embed.title ===
                            'PLUTO LEADERBOARD'
                    )
            );

        if (oldPanel) {

            await oldPanel.edit({
                embeds: [leaderboardEmbed]
            });

        } else {

            await leaderboardChannel.send({
                embeds: [leaderboardEmbed]
            });
        }

    } catch (error) {

        console.error(
            'Leaderboard update error:',
            error.message
        );
    }
}

async function updateAllLeaderboards() {

    for (const guild of client.guilds.cache.values()) {
        await updateLeaderboardPanel(guild);
    }
}


// ======================================================
// WELCOME MESSAGE
// ======================================================

client.on(
    'guildMemberAdd',
    async member => {

        const channel =
            member.guild.channels.cache.find(
                channel =>
                    channel.isTextBased() &&
                    channel.name
                        .toLowerCase()
                        .endsWith('welcome')
            ) ||
            member.guild.systemChannel;

        if (!channel) return;

        const welcomeEmbed =
            new EmbedBuilder()
                .setTitle(
                    'Welcome to Void Community'
                )
                .setDescription(
                    `Welcome ${member}!\n\n` +
                    'We are glad to have you here.'
                )
                .setThumbnail(
                    member.user.displayAvatarURL()
                )
                .setFooter({
                    text: 'Pluto'
                })
                .setTimestamp();

        try {

            await channel.send({
                embeds: [welcomeEmbed]
            });

        } catch (error) {

            console.log(
                'Could not send welcome message:',
                error.message
            );
        }
    }
);


// ======================================================
// BOT READY
// ======================================================

client.once('ready', async () => {

    loadGameData();

    console.log('=================================');
    console.log('Pluto is ONLINE!');
    console.log(
        `Logged in as ${client.user.tag}`
    );
    console.log(
        `Serving ${client.guilds.cache.size} server(s)`
    );
    console.log('=================================');

    client.user.setActivity(
        'Void Community',
        {
            type: 3
        }
    );

    await sendRulesPanel();

    await updateAllLeaderboards();

    // Update leaderboard every 60 seconds
    setInterval(
        async () => {
            await updateAllLeaderboards();
        },
        60 * 1000
    );
});


// ======================================================
// SLASH COMMAND HANDLER
// ======================================================

client.on(
    'interactionCreate',
    async interaction => {

        if (!interaction.isChatInputCommand()) return;

        try {

            // ==================================================
            // PING
            // ==================================================

            if (
                interaction.commandName === 'ping'
            ) {

                const latency =
                    Date.now() -
                    interaction.createdTimestamp;

                await interaction.reply(
                    `Pong!\nPluto latency: **${latency}ms**`
                );
            }


            // ==================================================
            // SERVER
            // ==================================================

            else if (
                interaction.commandName === 'server'
            ) {

                const guild =
                    interaction.guild;

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            guild.name
                        )
                        .addFields(

                            {
                                name: 'Members',
                                value:
                                    `${guild.memberCount}`,
                                inline: true
                            },

                            {
                                name: 'Channels',
                                value:
                                    `${guild.channels.cache.size}`,
                                inline: true
                            },

                            {
                                name: 'Roles',
                                value:
                                    `${guild.roles.cache.size}`,
                                inline: true
                            },

                            {
                                name: 'Owner',
                                value:
                                    `<@${guild.ownerId}>`
                            }

                        )
                        .setThumbnail(
                            guild.iconURL()
                        )
                        .setTimestamp();

                await interaction.reply({
                    embeds: [embed]
                });
            }


            // ==================================================
            // USER
            // ==================================================

            else if (
                interaction.commandName === 'user'
            ) {

                const member =
                    interaction.options.getMember(
                        'member'
                    ) ||
                    interaction.member;

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            member.user.username
                        )
                        .setThumbnail(
                            member.user.displayAvatarURL()
                        )
                        .addFields(

                            {
                                name: 'User ID',
                                value:
                                    member.user.id
                            },

                            {
                                name: 'Account Created',
                                value:
                                    `<t:${Math.floor(
                                        member.user.createdTimestamp / 1000
                                    )}:D>`
                            }

                        )
                        .setTimestamp();

                await interaction.reply({
                    embeds: [embed]
                });
            }


            // ==================================================
            // SAY
            // ==================================================

            else if (
                interaction.commandName === 'say'
            ) {

                const message =
                    interaction.options.getString(
                        'message'
                    );

                await interaction.reply({
                    content: 'Sent.',
                    ephemeral: true
                });

                await interaction.channel.send(
                    message
                );
            }


            // ==================================================
            // CLEAR
            // ==================================================

            else if (
                interaction.commandName === 'clear'
            ) {

                const amount =
                    interaction.options.getInteger(
                        'amount'
                    );

                const deleted =
                    await interaction.channel.bulkDelete(
                        amount,
                        true
                    );

                await interaction.reply({
                    content:
                        `Deleted **${deleted.size}** messages.`,
                    ephemeral: true
                });
            }


            // ==================================================
            // KICK
            // ==================================================

            else if (
                interaction.commandName === 'kick'
            ) {

                const member =
                    interaction.options.getMember(
                        'member'
                    );

                const reason =
                    interaction.options.getString(
                        'reason'
                    ) ||
                    'No reason provided';

                if (
                    !member ||
                    !member.kickable
                ) {

                    return interaction.reply({
                        content:
                            'I cannot kick this member. Check my permissions and role position.',
                        ephemeral: true
                    });
                }

                await member.kick(
                    reason
                );

                await interaction.reply(
                    `**${member.user.tag}** was kicked.\nReason: ${reason}`
                );
            }


            // ==================================================
            // BAN
            // ==================================================

            else if (
                interaction.commandName === 'ban'
            ) {

                const member =
                    interaction.options.getMember(
                        'member'
                    );

                const reason =
                    interaction.options.getString(
                        'reason'
                    ) ||
                    'No reason provided';

                if (
                    !member ||
                    !member.bannable
                ) {

                    return interaction.reply({
                        content:
                            'I cannot ban this member. Check my permissions and role position.',
                        ephemeral: true
                    });
                }

                await member.ban({
                    reason: reason
                });

                await interaction.reply(
                    `**${member.user.tag}** was banned.\nReason: ${reason}`
                );
            }


            // ==================================================
            // TIMEOUT
            // ==================================================

            else if (
                interaction.commandName === 'timeout'
            ) {

                const member =
                    interaction.options.getMember(
                        'member'
                    );

                const minutes =
                    interaction.options.getInteger(
                        'minutes'
                    );

                const reason =
                    interaction.options.getString(
                        'reason'
                    ) ||
                    'No reason provided';

                if (
                    !member ||
                    !member.moderatable
                ) {

                    return interaction.reply({
                        content:
                            'I cannot timeout this member. Check my permissions and role position.',
                        ephemeral: true
                    });
                }

                await member.timeout(
                    minutes * 60 * 1000,
                    reason
                );

                await interaction.reply(
                    `**${member.user.tag}** was timed out for **${minutes} minutes**.\nReason: ${reason}`
                );
            }


            // ==================================================
            // GAMES MENU
            // ==================================================

            else if (
                interaction.commandName === 'games'
            ) {

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            'PLUTO GAMES'
                        )
                        .setDescription(
                            '🎮 **Welcome to Pluto Games!**\n\n' +
                            'Play games, earn Pluto Coins, and climb the leaderboard.'
                        )
                        .addFields(

                            {
                                name: '🪙 Coinflip',
                                value:
                                    '`/coinflip`\nFlip a coin and win or lose coins.'
                            },

                            {
                                name: '🎲 Roll',
                                value:
                                    '`/roll`\nRoll the dice for a random coin reward.'
                            },

                            {
                                name: '✊ Rock Paper Scissors',
                                value:
                                    '`/rps`\nChallenge Pluto in RPS.'
                            },

                            {
                                name: '🧠 Trivia',
                                value:
                                    '`/trivia`\nAnswer a random trivia question.'
                            },

                            {
                                name: '🎰 Slots',
                                value:
                                    '`/slots`\nTry your luck at the Pluto slots.'
                            },

                            {
                                name: '💰 Economy',
                                value:
                                    '`/balance` — Check coins\n`/leaderboard` — View rankings'
                            }

                        )
                        .setFooter({
                            text: 'Pluto Games • Have fun!'
                        });

                await interaction.reply({
                    embeds: [embed]
                });
            }


            // ==================================================
            // BALANCE
            // ==================================================

            else if (
                interaction.commandName === 'balance'
            ) {

                const data =
                    getUserData(
                        interaction.user.id
                    );

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            'PLUTO BALANCE'
                        )
                        .setDescription(
                            `${interaction.user}\n\n` +
                            `💰 **${data.coins} Pluto Coins**`
                        )
                        .addFields(

                            {
                                name: '🎮 Games Played',
                                value:
                                    `${data.games}`,
                                inline: true
                            },

                            {
                                name: '🏆 Wins',
                                value:
                                    `${data.wins}`,
                                inline: true
                            },

                            {
                                name: '📉 Losses',
                                value:
                                    `${data.losses}`,
                                inline: true
                            }

                        )
                        .setThumbnail(
                            interaction.user.displayAvatarURL()
                        );

                await interaction.reply({
                    embeds: [embed]
                });
            }


            // ==================================================
            // LEADERBOARD
            // ==================================================

            else if (
                interaction.commandName === 'leaderboard'
            ) {

                const sortedUsers =
                    Object.entries(gameData)
                        .sort(
                            (a, b) =>
                                (b[1].coins || 0) -
                                (a[1].coins || 0)
                        )
                        .slice(0, 10);

                let description = '';

                if (sortedUsers.length === 0) {

                    description =
                        'No players yet. Be the first to play!';

                } else {

                    const medals = [
                        '🥇',
                        '🥈',
                        '🥉'
                    ];

                    sortedUsers.forEach(
                        ([userId, data], index) => {

                            const medal =
                                medals[index] ||
                                `**${index + 1}.**`;

                            description +=
                                `${medal} <@${userId}> — **${data.coins || 0} coins**\n`;
                        }
                    );
                }

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            'PLUTO LEADERBOARD'
                        )
                        .setDescription(
                            '🏆 **Top Pluto Coin Players**\n\n' +
                            description
                        )
                        .setFooter({
                            text:
                                'Play games to climb the leaderboard!'
                        })
                        .setTimestamp();

                await interaction.reply({
                    embeds: [embed]
                });
            }


            // ==================================================
            // COINFLIP
            // ==================================================

            else if (
                interaction.commandName === 'coinflip'
            ) {

                const data =
                    getUserData(
                        interaction.user.id
                    );

                const result =
                    Math.random() < 0.5
                        ? 'HEADS'
                        : 'TAILS';

                const won =
                    Math.random() < 0.5;

                data.games++;

                if (won) {

                    data.wins++;

                    const reward =
                        Math.floor(
                            Math.random() * 51
                        ) + 25;

                    data.coins += reward;

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    '🪙 COINFLIP'
                                )
                                .setDescription(
                                    `The coin landed on **${result}**!\n\n` +
                                    `🎉 You won **${reward} Pluto Coins**!`
                                )
                                .setFooter({
                                    text:
                                        `Balance: ${data.coins} coins`
                                })
                        ]
                    });

                } else {

                    data.losses++;

                    const loss =
                        Math.min(
                            data.coins,
                            Math.floor(
                                Math.random() * 21
                            ) + 5
                        );

                    data.coins -= loss;

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(
                                    '🪙 COINFLIP'
                                )
                                .setDescription(
                                    `The coin landed on **${result}**.\n\n` +
                                    `You lost **${loss} Pluto Coins**.`
                                )
                                .setFooter({
                                    text:
                                        `Balance: ${data.coins} coins`
                                })
                        ]
                    });
                }

                saveGameData();
            }


            // ==================================================
            // ROLL
            // ==================================================

            else if (
                interaction.commandName === 'roll'
            ) {

                const data =
                    getUserData(
                        interaction.user.id
                    );

                const roll =
                    Math.floor(
                        Math.random() * 6
                    ) + 1;

                data.games++;

                let reward = 0;

                if (roll === 6) {
                    reward = 100;
                    data.wins++;
                } else if (roll === 5) {
                    reward = 60;
                    data.wins++;
                } else if (roll === 4) {
                    reward = 40;
                    data.wins++;
                } else if (roll === 3) {
                    reward = 20;
                } else {
                    reward = 5;
                }

                data.coins += reward;

                saveGameData();

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                '🎲 DICE ROLL'
                            )
                            .setDescription(
                                `You rolled **${roll}**!\n\n` +
                                `💰 You earned **${reward} Pluto Coins**.`
                            )
                            .setFooter({
                                text:
                                    `Balance: ${data.coins} coins`
                            })
                    ]
                });
            }


            // ==================================================
            // RPS
            // ==================================================

            else if (
                interaction.commandName === 'rps'
            ) {

                const data =
                    getUserData(
                        interaction.user.id
                    );

                const playerChoice =
                    interaction.options.getString(
                        'choice'
                    );

                const choices = [
                    'rock',
                    'paper',
                    'scissors'
                ];

                const botChoice =
                    choices[
                        Math.floor(
                            Math.random() *
                            choices.length
                        )
                    ];

                data.games++;

                let result;
                let reward = 0;

                if (
                    playerChoice ===
                    botChoice
                ) {

                    result =
                        '🤝 It\'s a draw!';

                    reward = 15;

                } else if (

                    (
                        playerChoice === 'rock' &&
                        botChoice === 'scissors'
                    ) ||

                    (
                        playerChoice === 'paper' &&
                        botChoice === 'rock'
                    ) ||

                    (
                        playerChoice === 'scissors' &&
                        botChoice === 'paper'
                    )

                ) {

                    result =
                        '🎉 You win!';

                    reward = 75;

                    data.wins++;

                } else {

                    result =
                        '❌ Pluto wins!';

                    data.losses++;

                    reward = 0;
                }

                data.coins += reward;

                saveGameData();

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                '✊ ROCK PAPER SCISSORS'
                            )
                            .setDescription(
                                `**You:** ${playerChoice}\n` +
                                `**Pluto:** ${botChoice}\n\n` +
                                `${result}\n\n` +
                                `💰 Coins earned: **${reward}**`
                            )
                            .setFooter({
                                text:
                                    `Balance: ${data.coins} coins`
                            })
                    ]
                });
            }


            // ==================================================
            // TRIVIA
            // ==================================================

            else if (
                interaction.commandName === 'trivia'
            ) {

                const questions = [

                    {
                        question:
                            'What planet is known as the Red Planet?',
                        answer:
                            'mars',
                        reward:
                            100
                    },

                    {
                        question:
                            'How many days are in a week?',
                        answer:
                            '7',
                        reward:
                            75
                    },

                    {
                        question:
                            'What is the largest ocean on Earth?',
                        answer:
                            'pacific',
                        reward:
                            100
                    },

                    {
                        question:
                            'What is the capital of France?',
                        answer:
                            'paris',
                        reward:
                            100
                    },

                    {
                        question:
                            'How many sides does a triangle have?',
                        answer:
                            '3',
                        reward:
                            75
                    },

                    {
                        question:
                            'What gas do humans need to breathe?',
                        answer:
                            'oxygen',
                        reward:
                            100
                    }

                ];

                const question =
                    questions[
                        Math.floor(
                            Math.random() *
                            questions.length
                        )
                    ];

                await interaction.reply({
                    content:
                        `🧠 **TRIVIA TIME**\n\n` +
                        `**${question.question}**\n\n` +
                        `Reply with your answer within **20 seconds**!`
                });

                const filter =
                    message =>
                        message.author.id ===
                        interaction.user.id;

                try {

                    const collected =
                        await interaction.channel.awaitMessages({
                            filter,
                            max: 1,
                            time: 20000,
                            errors: ['time']
                        });

                    const answer =
                        collected.first()
                            .content
                            .toLowerCase()
                            .trim();

                    const data =
                        getUserData(
                            interaction.user.id
                        );

                    data.games++;

                    if (
                        answer ===
                        question.answer
                    ) {

                        data.wins++;
                        data.coins +=
                            question.reward;

                        saveGameData();

                        await interaction.followUp(
                            `🎉 Correct! You earned **${question.reward} Pluto Coins**!`
                        );

                    } else {

                        data.losses++;

                        saveGameData();

                        await interaction.followUp(
                            `❌ Not quite! The correct answer was **${question.answer}**.`
                        );
                    }

                } catch {

                    await interaction.followUp(
                        `⏰ Time's up! The answer was **${question.answer}**.`
                    );
                }
            }


            // ==================================================
            // SLOTS
            // ==================================================

            else if (
                interaction.commandName === 'slots'
            ) {

                const data =
                    getUserData(
                        interaction.user.id
                    );

                const symbols = [
                    '🍒',
                    '🍋',
                    '🍊',
                    '⭐',
                    '💎'
                ];

                const a =
                    symbols[
                        Math.floor(
                            Math.random() *
                            symbols.length
                        )
                    ];

                const b =
                    symbols[
                        Math.floor(
                            Math.random() *
                            symbols.length
                        )
                    ];

                const c =
                    symbols[
                        Math.floor(
                            Math.random() *
                            symbols.length
                        )
                    ];

                data.games++;

                let reward = 0;

                if (
                    a === b &&
                    b === c
                ) {

                    reward = 250;
                    data.wins++;

                } else if (
                    a === b ||
                    b === c ||
                    a === c
                ) {

                    reward = 75;

                } else {

                    reward = 10;
                }

                data.coins += reward;

                saveGameData();

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                '🎰 PLUTO SLOTS'
                            )
                            .setDescription(
                                `# ${a} | ${b} | ${c}\n\n` +
                                `💰 You earned **${reward} Pluto Coins**!`
                            )
                            .setFooter({
                                text:
                                    `Balance: ${data.coins} coins`
                            })
                    ]
                });
            }

        }

        catch (error) {

            console.error(
                'Command error:',
                error
            );

            try {

                if (interaction.replied) {

                    await interaction.followUp({
                        content:
                            'Something went wrong.',
                        ephemeral: true
                    });

                } else {

                    await interaction.reply({
                        content:
                            'Something went wrong.',
                        ephemeral: true
                    });
                }

            } catch (replyError) {

                console.error(
                    'Could not send error response:',
                    replyError
                );
            }
        }
    }
);


// ======================================================
// PLUTO CHAT SYSTEM
// ======================================================

// Pluto ONLY responds when somebody actually says
// "Pluto" or mentions the bot.
//
// "hi"         -> silent
// "hello"      -> silent
// "help"       -> silent
// "hey pluto"  -> Pluto responds

client.on(
    'messageCreate',
    async message => {

        if (message.author.bot) return;

        const content =
            message.content.toLowerCase();

        const saidPluto =
            /\bpluto\b/i.test(content);

        const mentionedPluto =
            client.user &&
            message.mentions.has(
                client.user
            );

        if (
            !saidPluto &&
            !mentionedPluto
        ) {
            return;
        }

        try {

            await message.reply(
                'Pluto is busy. I will ping you when he is back!'
            );

        } catch (error) {

            console.log(
                'Could not send Pluto response:',
                error.message
            );
        }
    }
);


// ======================================================
// BASIC ANTI-SPAM
// ======================================================

const messageTracker =
    new Map();

client.on(
    'messageCreate',
    async message => {

        if (message.author.bot) return;

        const userId =
            message.author.id;

        const now =
            Date.now();

        if (
            !messageTracker.has(
                userId
            )
        ) {

            messageTracker.set(
                userId,
                []
            );
        }

        const timestamps =
            messageTracker.get(
                userId
            );

        timestamps.push(
            now
        );

        const recent =
            timestamps.filter(
                timestamp =>
                    now - timestamp < 5000
            );

        messageTracker.set(
            userId,
            recent
        );

        if (
            recent.length >= 8
        ) {

            try {

                if (
                    message.member &&
                    message.member.moderatable
                ) {

                    await message.member.timeout(
                        10 * 60 * 1000,
                        'Automatic anti-spam protection'
                    );

                    await message.channel.send(
                        `${message.author} was temporarily timed out for spam.`
                    );
                }

                messageTracker.delete(
                    userId
                );

            }

            catch (error) {

                console.log(
                    'Anti-spam could not timeout member:',
                    error.message
                );
            }
        }
    }
);


// ======================================================
// ERROR HANDLING
// ======================================================

client.on(
    'error',
    error => {

        console.error(
            'Discord client error:',
            error
        );
    }
);

process.on(
    'unhandledRejection',
    error => {

        console.error(
            'Unhandled promise rejection:',
            error
        );
    }
);


// ======================================================
// START PLUTO
// ======================================================

loadGameData();

registerCommands();

client.login(
    TOKEN
);