require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const http = require('http');

// Simple web server to keep Render's port check happy
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AKASH X CHEATS is alive and running!');
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = 'x';
const db = { levels: {}, economy: {}, warnings: {}, giveaways: {} };

client.once('ready', async () => {
    console.log(`[ONLINE] Logged in as ${client.user.tag}! Powered by jackxiterrs for AKASH X CHEATS.`);

    const commands = [
        new SlashCommandBuilder().setName('info').setDescription('Get bot and creator info'),
        new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
        new SlashCommandBuilder().setName('supportticket').setDescription('Send the support ticket panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        new SlashCommandBuilder().setName('purchaseticket').setDescription('Send the purchase ticket panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        new SlashCommandBuilder().setName('reactionrole').setDescription('Send reaction role panel').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
        new SlashCommandBuilder().setName('panel').setDescription('Send a clean feature configuration panel').addStringOption(o => o.setName('title').setDescription('Panel title/header').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        new SlashCommandBuilder().setName('reminder').setDescription('Set a reminder').addIntegerOption(o=>o.setName('mins').setDescription('Minutes').setRequired(true)).addStringOption(o=>o.setName('task').setDescription('Task').setRequired(true)),
        new SlashCommandBuilder().setName('poll').setDescription('Create a quick poll').addStringOption(o=>o.setName('question').setDescription('Question').setRequired(true)),
        new SlashCommandBuilder().setName('suggestion').setDescription('Submit a suggestion').addStringOption(o=>o.setName('idea').setDescription('Idea').setRequired(true)),

        // Voice Channel Connect
        new SlashCommandBuilder().setName('joinvc').setDescription('Make the bot join your voice channel'),

        // Admin & Broadcast
        new SlashCommandBuilder().setName('broadcast').setDescription('Broadcast a custom message to a channel').addChannelOption(o=>o.setName('channel').setDescription('Target channel').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('Message').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder().setName('kick').setDescription('Kick a member').addUserOption(o=>o.setName('target').setDescription('User').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
        new SlashCommandBuilder().setName('ban').setDescription('Ban a member').addUserOption(o=>o.setName('target').setDescription('User').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason')).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
        new SlashCommandBuilder().setName('timeout').setDescription('Timeout a member').addUserOption(o=>o.setName('target').setDescription('User').setRequired(true)).addIntegerOption(o=>o.setName('mins').setDescription('Minutes').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        new SlashCommandBuilder().setName('warn').setDescription('Warn a user').addUserOption(o=>o.setName('target').setDescription('User').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('Reason').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
        new SlashCommandBuilder().setName('clear').setDescription('Clear messages').addIntegerOption(o=>o.setName('amount').setDescription('Amount').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        // Community, Leaderboards & Economy
        new SlashCommandBuilder().setName('level').setDescription('Check level'),
        new SlashCommandBuilder().setName('leaderboard').setDescription('View server top leaderboards').addStringOption(o=>o.setName('type').setDescription('Leaderboard type').setRequired(true).addChoices({name:'XP / Levels',value:'xp'},{name:'Economy Coins',value:'coins'})),
        
        // Timed Giveaway Subcommands
        new SlashCommandBuilder()
            .setName('giveaway')
            .setDescription('Manage timed giveaways')
            .addSubcommand(sub =>
                sub.setName('start')
                    .setDescription('Start a timed giveaway')
                    .addStringOption(o=>o.setName('duration').setDescription('Duration (e.g., 30s, 5m, 2h, 1d)').setRequired(true))
                    .addStringOption(o=>o.setName('prize').setDescription('What is being given away?').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('end')
                    .setDescription('End an active giveaway early')
                    .addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))
            )
            .addSubcommand(sub =>
                sub.setName('reroll')
                    .setDescription('Reroll a new winner for a giveaway')
                    .addStringOption(o=>o.setName('message_id').setDescription('Giveaway message ID').setRequired(true))
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

        new SlashCommandBuilder().setName('balance').setDescription('Check balance'),
        new SlashCommandBuilder().setName('daily').setDescription('Claim daily coins'),
        new SlashCommandBuilder().setName('work').setDescription('Work for coins'),
        new SlashCommandBuilder().setName('cf').setDescription('Gamble coins on a Coinflip').addIntegerOption(o=>o.setName('amount').setDescription('Coins to bet').setRequired(true)).addStringOption(o=>o.setName('choice').setDescription('Heads or Tails').setRequired(true).addChoices({name:'Heads',value:'heads'},{name:'Tails',value:'tails'})),
        new SlashCommandBuilder().setName('shop').setDescription('View shop'),

        // Gaming & Entertainment
        new SlashCommandBuilder().setName('mcstatus').setDescription('Minecraft status').addStringOption(o=>o.setName('ip').setDescription('IP').setRequired(true)),
        new SlashCommandBuilder().setName('freefire').setDescription('Free Fire updates'),
        new SlashCommandBuilder().setName('gtarp').setDescription('GTA RP stats'),
        new SlashCommandBuilder().setName('meme').setDescription('Random meme'),
        new SlashCommandBuilder().setName('joke').setDescription('Random joke'),
        new SlashCommandBuilder().setName('ai').setDescription('Chat with AI').addStringOption(o=>o.setName('prompt').setDescription('Prompt').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('[SUCCESS] Successfully registered all commands for AKASH X CHEATS.');
    } catch (error) {
        console.error(error);
    }
});

// Helper Function for Mod Logs
async function sendModLog(guild, title, description, color = 0xff0000) {
    const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs' || c.name === 'logs');
    if (!logChannel) return;
    const embed = new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
}

// Helper Function to Parse Duration (e.g. 10s, 5m, 2h, 1d)
function parseDuration(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === 's') return value * 1000;
    if (unit === 'm') return value * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    if (unit === 'd') return value * 24 * 60 * 60 * 1000;
    return null;
}

// Auto-Welcome System with Banner
client.on('guildMemberAdd', member => {
    const welcomeChannel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name.includes('welcome') || ch.name.includes('general'));
    if (!welcomeChannel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('⚡ Welcome to the Server!')
        .setDescription(`Hey ${member}, welcome to **${member.guild.name}**!\nPowered by **AKASH X CHEATS** (made by jackxiterrs).`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage('https://media.giphy.com/media/l41YtZQbZXElABNn2/giphy.gif')
        .setTimestamp()
        .setFooter({ text: 'AKASH X CHEATS • Welcome Bot' });

    welcomeChannel.send({ embeds: [welcomeEmbed] });
});

// Auto-Moderation & Message Handler
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // Anti-Invite Auto-Mod
    if (message.content.includes('discord.gg/') || message.content.includes('discord.com/invite/')) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            message.delete().catch(() => {});
            sendModLog(message.guild, '🛡️ Auto-Mod Triggered', `Deleted invite link sent by ${message.author.tag} in ${message.channel}`);
            return message.channel.send(`${message.author}, Discord invites are restricted by **AKASH X CHEATS**!`).then(m => setTimeout(() => m.delete().catch(()=>{}), 4000));
        }
    }

    // XP Tracking
    const uid = message.author.id;
    if (!db.levels[uid]) db.levels[uid] = { xp: 0, level: 1, tag: message.author.tag };
    db.levels[uid].xp += Math.floor(Math.random() * 10) + 5;
    db.levels[uid].tag = message.author.tag;

    if (db.levels[uid].xp >= db.levels[uid].level * 100) {
        db.levels[uid].level += 1;
        message.channel.send(`🎉 GG ${message.author}, you reached **Level ${db.levels[uid].level}**!`);
    }

    if (!message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'ping') message.reply(`Pong! Latency: ${client.ws.ping}ms`);
    else if (cmd === 'info') message.reply('⚡ **AKASH X CHEATS** • Created by jackxiterrs | All modules active!');
    else if (cmd === 'level') message.reply(`📊 Level: ${db.levels[uid]?.level || 1} | XP: ${db.levels[uid]?.xp || 0}`);
    else if (cmd === 'bal' || cmd === 'balance') message.reply(`💰 Balance: **${db.economy[uid] || 0} coins**`);
    else if (cmd === 'daily') {
        db.economy[uid] = (db.economy[uid] || 0) + 500;
        message.reply('🎁 Claimed daily reward: **+500 coins**!');
    }
    else if (cmd === 'work') {
        const earned = Math.floor(Math.random() * 150) + 50;
        db.economy[uid] = (db.economy[uid] || 0) + earned;
        message.reply(`💼 You worked hard and earned **+${earned} coins**!`);
    }
    else if (cmd === 'help') {
        message.reply('Prefix commands: `xping`, `xinfo`, `xjoinvc`, `xbroadcast`, `xbal`, `xdaily`, `xwork`, `xhelp` (Use `/` slash commands for full feature list!)');
    }
});

// Slash Commands & Button Interactions Handler
client.on('interactionCreate', async interaction => {
    // 1. Button Click Handlers (Tickets & Giveaways)
    if (interaction.isButton()) {
        if (interaction.customId === 'open_support_ticket' || interaction.customId === 'open_purchase_ticket') {
            const guild = interaction.guild;
            const member = interaction.user;
            const type = interaction.customId === 'open_support_ticket' ? 'support' : 'purchase';

            await interaction.deferReply({ ephemeral: true });

            try {
                const ticketChannel = await guild.channels.create({
                    name: `${type}-${member.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
                    ]
                });

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger)
                );

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🎫 ${type.toUpperCase()} Ticket - ${member.tag}`)
                    .setDescription('Welcome! Describe your inquiry below. Staff will be with you shortly.\n\nClick the button below when you wish to close this ticket.')
                    .setColor(0x00FFCC);

                await ticketChannel.send({ content: `${member}, welcome!`, embeds: [welcomeEmbed], components: [closeRow] });
                await interaction.editReply({ content: `✅ Your ticket has been created: ${ticketChannel}` });
            } catch (err) {
                console.error(err);
                await interaction.editReply({ content: '❌ Failed to create ticket. Please check bot permissions.' });
            }
        }
        else if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...' });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
        else if (interaction.customId === 'join_giveaway') {
            const giveaway = db.giveaways[interaction.message.id];
            if (!giveaway || giveaway.ended) {
                return interaction.reply({ content: '❌ This giveaway has already ended or is invalid!', ephemeral: true });
            }
            if (giveaway.entries.includes(interaction.user.id)) {
                return interaction.reply({ content: '⚠️ You are already entered in this giveaway!', ephemeral: true });
            }
            giveaway.entries.push(interaction.user.id);
            return interaction.reply({ content: '🎉 Successfully entered the giveaway!', ephemeral: true });
        }
    }

    // 2. Chat Input (Slash Commands) Handler
    if (!interaction.isChatInputCommand()) return;
    const { commandName, options } = interaction;

    if (commandName === 'info') {
        await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00FFFF).setTitle('⚡ AKASH X CHEATS').setDescription('Created by **jackxiterrs** • Separate Tickets, Giveaways, Leaderboards, Auto-Mod active.')] });
    }
    else if (commandName === 'ping') await interaction.reply(`Pong! Latency: ${client.ws.ping}ms`);
    else if (commandName === 'joinvc') {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
        joinVoiceChannel({ channelId: voiceChannel.id, guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator });
        await interaction.reply({ content: `🔊 Successfully joined **${voiceChannel.name}**!`, ephemeral: true });
    }
    else if (commandName === 'panel') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: '❌ Access Denied.', ephemeral: true });
        }

        const panelTitle = options.getString('title');
        const cleanEmbed = new EmbedBuilder()
            .setColor(0x8b00ff)
            .setDescription(
                `• **${panelTitle}**\n\n` +
                `> **Visual Function :-**\n\n` +
                `• **Esp Line**\n` +
                `• **Esp Box**\n` +
                `• **Many More**\n\n` +
                `> **Major Function :-**\n\n` +
                `• **Max Distance Limit**\n` +
                `• **Ignore Knocked Enemies**\n` +
                `• **120Fps Support**\n` +
                `• **Inverted GlooWall**\n` +
                `• **Instant Loot**\n` +
                `• **Aspect Ratio**\n` +
                `• **Stream Proof / Stream Hide**`
            );

        await interaction.channel.send({ embeds: [cleanEmbed] });
        await interaction.reply({ content: '✅ Panel sent successfully!', ephemeral: true });
    }
    else if (commandName === 'supportticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ Access Denied.', ephemeral: true });
        }

        const tEmbed = new EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('🛠️ AKASH X CHEATS - Support Tickets')
            .setDescription('Click below to open a private support ticket.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_support_ticket').setLabel('Create Support Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
        );

        await interaction.channel.send({ embeds: [tEmbed], components: [row] });
        await interaction.reply({ content: '✅ Support ticket panel sent!', ephemeral: true });
    }
    else if (commandName === 'purchaseticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ Access Denied.', ephemeral: true });
        }

        const tEmbed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🛒 AKASH X CHEATS - Purchase Tickets')
            .setDescription('Click below to open a private purchase ticket.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_purchase_ticket').setLabel('Create Purchase Ticket').setStyle(ButtonStyle.Success).setEmoji('🛒')
        );

        await interaction.channel.send({ embeds: [tEmbed], components: [row] });
        await interaction.reply({ content: '✅ Purchase ticket panel sent!', ephemeral: true });
    }
    else if (commandName === 'leaderboard') {
        const type = options.getString('type');
        if (type === 'xp') {
            const sorted = Object.entries(db.levels).sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp).slice(0, 10);
            const desc = sorted.length ? sorted.map((([id, data], index) => `**${index + 1}.** <@${id}> — Level **${data.level}** (${data.xp} XP)`)).join('\n') : 'No data recorded yet.';
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xf1c40f).setTitle('🏆 Server XP Leaderboard').setDescription(desc)] });
        } else {
            const sorted = Object.entries(db.economy).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const desc = sorted.length ? sorted.map((([id, coins], index) => `**${index + 1}.** <@${id}> — **${coins} coins**`)).join('\n') : 'No coins recorded yet.';
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setTitle('💰 Server Economy Leaderboard').setDescription(desc)] });
