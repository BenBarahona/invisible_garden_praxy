import os
import json
from together import Together


def tokenized_fine_tuning():
    client = Together(
        api_key=os.environ.get("TOGETHER_API_KEY"),
    )

    client.fine_tuning.create(
        training_file="file-76b220f4-8f0a-45c9-a4a9-d3011da5200f",
        model="meta-llama/Meta-Llama-3.1-8B-Instruct-Reference",
        train_on_inputs="auto",
        n_epochs=3,
        n_checkpoints=1,
        lora=True,
        warmup_ratio=0,
        learning_rate=1e-5,
        suffix="test_token_8b",
    )
