const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const DATA_FILE = path.join(__dirname, 'wallets.json');
const token = process.env.DISCORD_TOKEN;

function loadWallets() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    return {};
  }
}

function saveWallets(wallets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(wallets, null, 2));
}

function getWallet(userId) {
  const wallets = loadWallets();

  if (!wallets[userId]) {
    wallets[userId] = {
      balance: 0,
      lastDaily: 0,
      lastWork: 0,
    };
    saveWallets(wallets);
  }

  return wallets[userId];
}

function updateWallet(userId, updater) {
  const wallets = loadWallets();

  if (!wallets[userId]) {
    wallets[userId] = {
      balance: 0,
      lastDaily: 0,
      lastWork: 0,
    };
  }

  updater(wallets[userId]);
  saveWallets(wallets);
}

function formatMoney(amount) {
  return `${Number(amount).toLocaleString()} coins`;
}

function getCooldownSeconds(msLeft) {
  return Math.max(1, Math.ceil(msLeft / 1000));
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();
  const userId = message.author.id;

  if (command === '!balance' || command === '!bal') {
    const wallet = getWallet(userId);
    const embed = new EmbedBuilder()
      .setColor('#00d1b2')
      .setTitle('💰 Wallet')
      .setDescription(`You currently have ${formatMoney(wallet.balance)}.`);

    return message.channel.send({ embeds: [embed] });
  }

  if (command === '!work') {
    const now = Date.now();
    const wallet = getWallet(userId);
    const cooldownMs = 60 * 1000;

    if (now - wallet.lastWork < cooldownMs) {
      const remaining = cooldownMs - (now - wallet.lastWork);
      return message.reply(
        `You need to wait ${getCooldownSeconds(remaining)} seconds before working again.`
      );
    }

    const payout = Math.floor(Math.random() * 150) + 50;

    updateWallet(userId, (userWallet) => {
      userWallet.balance += payout;
      userWallet.lastWork = now;
    });

    return message.reply(`You worked hard and earned ${formatMoney(payout)}!`);
  }

  if (command === '!daily') {
    const now = Date.now();
    const wallet = getWallet(userId);
    const cooldownMs = 24 * 60 * 60 * 1000;

    if (now - wallet.lastDaily < cooldownMs) {
      const remaining = cooldownMs - (now - wallet.lastDaily);
      const hoursLeft = Math.max(1, Math.ceil(remaining / (60 * 60 * 1000)));
      return message.reply(`Your daily reward is available in ${hoursLeft} hour(s).`);
    }

    const reward = 500 + Math.floor(Math.random() * 300);

    updateWallet(userId, (userWallet) => {
      userWallet.balance += reward;
      userWallet.lastDaily = now;
    });

    return message.reply(`Daily reward claimed: ${formatMoney(reward)}!`);
  }

  if (command === '!give') {
    const target = message.mentions.users.first();
    const amount = Number(args[2]);

    if (!target || !amount || amount <= 0) {
      return message.reply('Usage: `!give @user 100`');
    }

    const senderWallet = getWallet(userId);
    if (senderWallet.balance < amount) {
      return message.reply('You do not have enough coins to send that amount.');
    }

    updateWallet(userId, (userWallet) => {
      userWallet.balance -= amount;
    });

    updateWallet(target.id, (userWallet) => {
      userWallet.balance += amount;
    });

    return message.reply(`You gave ${target.tag} ${formatMoney(amount)}.`);
  }

  if (command === '!leaderboard' || command === '!lb') {
    const wallets = loadWallets();
    const sorted = Object.entries(wallets)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .slice(0, 10);

    if (!sorted.length) {
      return message.reply('No one has money yet. Start with `!work`!');
    }

    const lines = sorted.map(([id, data], index) => {
      const username = client.users.cache.get(id)?.tag || 'Unknown User';
      return `${index + 1}. ${username} - ${formatMoney(data.balance)}`;
    });

    return message.channel.send(`\`\`\`\n${lines.join('\n')}\n\`\`\` `);
  }

  if (command === '!help') {
    const helpText = [
      '💸 Money Bot Commands',
      '`!work` - Earn random coins every minute',
      '`!daily` - Claim a bigger daily reward',
      '`!balance` - Check your wallet',
      '`!give @user 100` - Send coins to another user',
      '`!leaderboard` - View top earners',
      '`!help` - Show this help menu',
    ].join('\n');

    return message.channel.send(helpText);
  }
});

if (!token) {
  console.error('DISCORD_TOKEN is missing. Set it in your environment before starting the bot.');
  process.exit(1);
}

client.login(token);
