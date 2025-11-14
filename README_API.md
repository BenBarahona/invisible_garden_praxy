# Invisible Garden Praxy - Frontend

A modern Web3 frontend application built with Next.js 14, Material UI, and Framer Motion.

## Tech Stack

- **Docker** - Run container applications
- **FAST API** - Python api
- **together** - Together AI API. 
- **transformers** - to train data.
- **PostgresSQL** - Database to store conversations
- **Sql Alchemy** - ORM library
- **Web3 Libraries** - wagmi, viem, RainbowKit, Web3Modal

## Getting Started
- Install Docker.
- Install docker-compose.

### Development

Development servers runs on http://localhost:8080

```bash
docker-compose -f docker-compose.yml up
```
 
### API end points

```bash
 POST /feedback

 {
  "user_id": "string",
  "question": "string",
  "model": "t_tuned | c_tuned | default" 
}
```

```bash
 GET /get_chat_by_user/{user_id}/{model_code}
```

```bash
 GET /docs
```





