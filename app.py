from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Serve the frontend
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# API info endpoint
@app.route('/api')
def api_info():
    return jsonify({
        'message': 'Welcome to Praxy API!',
        'status': 'online',
        'endpoints': {
            '/': 'Frontend page',
            '/api': 'This API info page',
            '/health': 'Health check endpoint',
            '/api/hello': 'Simple hello world',
            '/api/echo': 'Echo back POST data'
        }
    })

# Health check endpoint
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

# Simple GET endpoint
@app.route('/api/hello')
def hello():
    name = request.args.get('name', 'World')
    return jsonify({
        'message': f'Hello, {name}!',
        'timestamp': request.headers.get('Date')
    })

# Echo endpoint (POST)
@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.get_json()
    return jsonify({
        'received': data,
        'message': 'Data echoed successfully'
    })

if __name__ == '__main__':
    # Run on port 4000
    app.run(debug=True, host='0.0.0.0', port=4000)

