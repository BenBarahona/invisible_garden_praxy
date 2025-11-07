"""
PraxY Telegram Bot - Simple Version
Handles basic user interactions via Telegram
"""
import os
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# Load environment variables
load_dotenv()

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot token from environment
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not found in environment variables!")


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a welcome message when the /start command is issued."""
    user = update.effective_user
    welcome_message = f"""
👋 Hello {user.first_name}! Welcome to PraxY!

I'm your medical AI assistant, here to help you with medical questions and institutional protocols.

🔹 Available Commands:
/start - Show this welcome message
/help - Get help and instructions
/info - Learn more about PraxY
/ask - Ask a medical question

Just send me a message and I'll do my best to help!
    """
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a help message when the /help command is issued."""
    help_text = """
📋 How to use PraxY:

1️⃣ Simply type your medical question
2️⃣ I'll provide assistance based on institutional protocols
3️⃣ All interactions are logged securely

Commands:
/start - Welcome message
/help - This help message
/info - About PraxY
/ask - Ask a specific question

Example questions:
• "What's the protocol for hypertension treatment?"
• "What are the contraindications for aspirin?"
• "Dosage guidelines for pediatric patients?"
    """
    await update.message.reply_text(help_text)


async def info_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send information about PraxY."""
    info_text = """
ℹ️ About PraxY

PraxY is a medical AI assistant designed to act as a digital clone of a Medical Director or Head Physician.

🎯 Features:
• Trained with institutional knowledge
• Provides protocol-based recommendations
• Secure and verifiable responses
• Available 24/7 via Telegram

🔐 Security:
• zkID authentication (coming soon)
• On-chain audit trails
• HIPAA-compliant design

Version: 0.1.0 (Beta)
    """
    await update.message.reply_text(info_text)


async def ask_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /ask command."""
    if context.args:
        # User provided a question with the command
        question = ' '.join(context.args)
        await handle_medical_query(update, question)
    else:
        await update.message.reply_text(
            "Please provide your question after the /ask command.\n"
            "Example: /ask What is the protocol for hypertension?"
        )


async def handle_medical_query(update: Update, query: str) -> None:
    """Process a medical query and send a response."""
    # For now, just send a simple acknowledgment
    # Later, this will integrate with your RAG system
    response = f"""
🤖 Query received: "{query}"

💡 Simple Response (Demo Mode):
Thank you for your question. In the current demo version, I'm providing simple responses. 

For medical questions, please:
• Consult with institutional protocols
• Verify with current medical literature
• Consider patient-specific factors

🔧 Full AI-powered responses coming soon with RAG integration!
    """
    await update.message.reply_text(response)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle regular text messages from users."""
    user_message = update.message.text
    user = update.effective_user
    
    logger.info(f"User {user.id} ({user.username}) sent: {user_message}")
    
    # Simple response for now
    await handle_medical_query(update, user_message)


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log errors caused by updates."""
    logger.error(f"Update {update} caused error {context.error}")
    
    if update and update.message:
        await update.message.reply_text(
            "⚠️ Sorry, an error occurred while processing your request. "
            "Please try again later."
        )


def main() -> None:
    """Start the bot."""
    logger.info("Starting PraxY Telegram Bot...")
    
    # Create the Application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Register command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("info", info_command))
    application.add_handler(CommandHandler("ask", ask_command))
    
    # Register message handler for regular messages
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Register error handler
    application.add_error_handler(error_handler)
    
    # Start the bot
    logger.info("Bot is running! Press Ctrl-C to stop.")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()

