# Telegram Bot Setup Guide for PraxY

This guide will help you set up and run the PraxY Telegram bot.

## Prerequisites

- Python 3.8 or higher
- A Telegram account
- pip package manager

## Step 1: Get Your Bot Token from BotFather

1. Open Telegram and search for **@BotFather** (the official bot for creating bots)
2. Start a chat with BotFather by clicking "Start" or sending `/start`
3. Create a new bot by sending `/newbot`
4. Follow the prompts:
   - Choose a name for your bot (e.g., "PraxY Medical Assistant")
   - Choose a username for your bot (must end in 'bot', e.g., "praxy_medical_bot")
5. BotFather will give you a **token** that looks like this:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. **Copy this token** - you'll need it in the next step

## Step 2: Configure Environment Variables

1. In the `praxy` directory, create a `.env` file (or copy from `.env.example`):

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your bot token:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

## Step 3: Install Dependencies

From the `praxy` directory, run:

```bash
pip install -r requirements.txt
```

This will install:

- `python-telegram-bot` - The Telegram bot framework
- `python-dotenv` - For loading environment variables
- Other required dependencies

## Step 4: Run the Bot

Start the bot by running:

```bash
python services/telegram_bot.py
```

You should see output like:

```
2024-11-07 - telegram.ext._application - INFO - Application started
Bot is running! Press Ctrl-C to stop.
```

## Step 5: Test Your Bot

1. Open Telegram and search for your bot's username (e.g., `@praxy_medical_bot`)
2. Click "Start" or send `/start`
3. You should receive a welcome message from PraxY!

## Available Commands

- `/start` - Show welcome message
- `/help` - Get help and instructions
- `/info` - Learn about PraxY
- `/ask <question>` - Ask a specific question

You can also just send any text message, and the bot will respond!

## Bot Features (Current Demo Version)

✅ Basic command handling
✅ Text message responses
✅ Error handling and logging
✅ User interaction tracking

## Next Steps (To Be Implemented)

🔜 Integration with RAG system for intelligent responses
🔜 zkID authentication for verified medical professionals
🔜 On-chain audit trail for all interactions
🔜 Connection to your gateway service for AI-powered answers

## Troubleshooting

### Bot doesn't respond

- Check that the bot is running (should see "Bot is running!" in console)
- Verify your `TELEGRAM_BOT_TOKEN` in the `.env` file is correct
- Make sure you've sent `/start` to initialize the bot

### Import errors

- Ensure you've installed all dependencies: `pip install -r requirements.txt`
- Check that you're in the correct directory

### Token errors

- Verify your bot token from BotFather
- Make sure there are no extra spaces in the `.env` file
- Ensure the token is in the format: `TELEGRAM_BOT_TOKEN=your_token_here`

## Optional: Customize Your Bot

You can customize the bot with BotFather:

- `/setdescription` - Set bot description
- `/setabouttext` - Set "About" text
- `/setuserpic` - Set bot profile picture
- `/setcommands` - Set command list (for better UI)

Example command list to send to BotFather:

```
start - Show welcome message
help - Get help and instructions
info - Learn more about PraxY
ask - Ask a medical question
```

## Security Notes

⚠️ **Important:**

- Never commit your `.env` file to Git
- Keep your bot token secret
- The `.env` file is already in `.gitignore`
- Regenerate your token if it's accidentally exposed

## Development Mode

The current bot is in **demo mode** and provides simple responses. To integrate with your RAG system and gateway service, you'll need to:

1. Update the `handle_medical_query()` function
2. Add HTTP client to call your gateway service at `/query`
3. Implement embedding generation for user queries
4. Add authentication/authorization logic

## Support

For issues or questions, refer to:

- [python-telegram-bot documentation](https://docs.python-telegram-bot.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
