# NyTro Money Bot

A simple JavaScript Discord economy bot that gives users fake coins through commands like `!work`, `!daily`, and `!balance`.

## Features

- Earn coins with `!work`
- Claim extra coins with `!daily`
- Check wallet balance with `!balance`
- Send coins to other users with `!give`
- See top players on the leaderboard

## Requirements

- Node.js 18+
- A Discord bot token

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file or export the token in your shell:

```bash
export DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN"
```

3. Start the bot:

```bash
npm start
```

## Commands

- `!help` — Show all commands
- `!work` — Earn random coins
- `!daily` — Claim a daily reward
- `!balance` — Check your balance
- `!give @user 100` — Give another user coins
- `!leaderboard` — View the top users

## Notes

This bot uses a local JSON file to store balances, so it is best for small personal servers or testing.
