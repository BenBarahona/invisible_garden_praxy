# Chat API Integration Guide

## Overview

The chat page has been successfully integrated with the FastAPI backend service. Users can now have real conversations with an AI medical assistant specialized in sore throat diagnosis and treatment.

## Features Implemented

### 1. **Message Sending & Receiving**

- Users can send messages to the AI assistant
- The AI responds using fine-tuned medical models
- Messages are automatically saved to the database

### 2. **Chat History**

- Chat history is automatically loaded when the page opens
- History persists across sessions using the nullifier hash as a unique identifier
- Each model (t_tuned, c-tuned, default) maintains separate conversation histories

### 3. **Model Selection**

- Users can switch between three AI models:
  - **Token Tuned** (default) - Fine-tuned for medical queries
  - **Conversational Tuned** - Optimized for dialogue
  - **Default** - General purpose Llama 3.3-70B

### 4. **Privacy Preservation**

- User identification uses the ZK proof nullifier hash
- No personally identifiable information is stored
- Anonymous yet persistent conversations

## Technical Details

### API Endpoints Used

#### POST `/feedback`

Sends a message and receives AI response:

```json
{
  "user_id": "nullifier_hash",
  "question": "user_message",
  "model": "t_tuned | c-tuned | default"
}
```

#### GET `/get_chat_by_user/{user_id}/{model_code}`

Retrieves conversation history for a specific user and model.

### State Management

- **messages**: Array of message objects (role, content, timestamp)
- **inputMessage**: Current input field value
- **isLoading**: Loading state during API calls
- **selectedModel**: Currently selected AI model
- **isLoadingHistory**: Loading state for chat history

### User Experience Features

- Auto-scroll to latest message
- Optimistic UI updates (messages appear immediately)
- Loading indicators during AI response
- Disabled state when sending messages
- Enter key to send messages
- Model selector in chat header
- Message count display
- Timestamps for each message

## Running the Application

### 1. Start Backend Services

```bash
docker-compose -f docker-compose.yml up
```

This starts:

- FastAPI server on http://localhost:8080
- PostgreSQL database
- Any other dependent services

### 2. Start Frontend

```bash
cd src
npm run dev
# or
pnpm dev
```

### 3. Access the Chat

1. Navigate to the app
2. Complete ZK proof verification
3. Access the chat page (protected route)
4. Start chatting with the AI assistant!

## API Configuration

The API base URL is configured in the chat page:

```typescript
const API_BASE_URL = "http://localhost:8080";
```

For production, update this to your deployed API endpoint.

## Model Information

### Available Models (from gateway/app.py)

```python
AVAILABLE_MODELS = {
    "default": "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "c-tuned": "jdestephen07_1f06/Meta-Llama-3.1-8B-Instruct-Reference-test_conv_8b-4fd4f33d",
    "t_tuned": "jdestephen07_1f06/Meta-Llama-3.1-8B-Instruct-Reference-test_token_8b-14cdef80",
}
```

## Database Schema

Messages are stored with:

- user_id (linked to nullifier hash)
- role (user/assistant)
- content (message text)
- model_code (which model was used)
- created_at (timestamp)

## Troubleshooting

### Common Issues

**API Connection Failed**

- Ensure Docker services are running: `docker-compose ps`
- Check if port 8080 is available
- Verify API_BASE_URL is correct

**Messages Not Loading**

- Check browser console for errors
- Verify the backend database is initialized
- Check Docker logs: `docker-compose logs gateway`

**Chat History Not Persisting**

- Verify user_id (nullifier hash) is being passed correctly
- Check database connection
- Ensure messages are being saved (check API logs)

## Environment Variables

Required in `.env` for backend:

```
TOGETHER_API_KEY=your_together_ai_key
DATABASE_URL=postgresql://...
```

## Security Notes

1. **Zero-Knowledge Privacy**: The nullifier hash is used as user_id, preserving anonymity
2. **No PII Storage**: No personal information is stored in the database
3. **Session-Based Access**: Chat is only accessible after ZK proof verification
4. **End-to-End Flow**: Verification → Chat Access → Anonymous Messaging

## Future Enhancements

Potential improvements:

- [ ] Real-time updates with WebSockets
- [ ] Message reactions or ratings
- [ ] Export chat history
- [ ] Multi-model comparison view
- [ ] Voice input/output
- [ ] Image upload for medical queries
- [ ] Conversation summarization
