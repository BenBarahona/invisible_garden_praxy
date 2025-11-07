# Praxi Backend Setup

A simple Flask backend for the Praxi project.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Or if you're using Python 3:

```bash
pip3 install -r requirements.txt
```

### 2. Run the Backend

```bash
python app.py
```

Or:

```bash
python3 app.py
```

The server will start on `http://localhost:5000`

### 3. Connect to ngrok

In a separate terminal, run:

```bash
ngrok http 5000 --domain=tetradrachmal-melody-uncongested.ngrok-free.dev
```

> **Note:** Make sure you have ngrok installed and authenticated. If you haven't:
>
> - Install: `brew install ngrok` (macOS)
> - Authenticate: `ngrok config add-authtoken YOUR_AUTH_TOKEN`

Your backend will now be accessible at:
**https://tetradrachmal-melody-uncongested.ngrok-free.dev**

## API Endpoints

### `GET /`

Returns welcome message and list of available endpoints.

**Example:**

```bash
curl https://tetradrachmal-melody-uncongested.ngrok-free.dev/
```

### `GET /health`

Health check endpoint.

**Example:**

```bash
curl https://tetradrachmal-melody-uncongested.ngrok-free.dev/health
```

### `GET /api/hello?name=YourName`

Returns a personalized greeting.

**Example:**

```bash
curl "https://tetradrachmal-melody-uncongested.ngrok-free.dev/api/hello?name=Praxi"
```

### `POST /api/echo`

Echoes back the JSON data you send.

**Example:**

```bash
curl -X POST https://tetradrachmal-melody-uncongested.ngrok-free.dev/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, World!", "data": [1, 2, 3]}'
```

## Development

- The app runs with `debug=True` for development
- CORS is enabled for all origins
- The server listens on `0.0.0.0:5000`

## Extending the Backend

To add new endpoints, simply add new routes to `app.py`:

```python
@app.route('/api/yourEndpoint')
def your_endpoint():
    return jsonify({'your': 'data'})
```
