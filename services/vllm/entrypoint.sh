#!/bin/bash

# Required environment variables for CPU operation
export VLLM_CPU_KVCACHE_SPACE=0
export CUDA_VISIBLE_DEVICES=""

# Set default values
MODEL=${VLLM_MODEL:-"mistralai/Mistral-7B-Instruct-v0.1"}
DEVICE=${VLLM_DEVICE:-"cpu"}
DTYPE=${VLLM_DTYPE:-"float32"}
HOST=${VLLM_HOST:-"0.0.0.0"}
PORT=${VLLM_PORT:-"8000"}

echo "Starting vLLM server on CPU..."
echo "Model: $MODEL"
echo "This may take several minutes to download and load the model..."

# Start the server with CPU-specific flags
exec python -m vllm.entrypoints.openai.api_server \
    --host "$HOST" \
    --port "$PORT" \
    --model "$MODEL" \
    --device "$DEVICE" \
    --dtype "$DTYPE" \
    --blocking \
    --served-model-name "$MODEL"