import os
import json
from together import Together


def conversational_fine_tuning():
    client = Together(
        api_key=os.environ.get("TOGETHER_API_KEY"),
    )

    client.fine_tuning.create(
        training_file="file-d3227d60-4e86-46d1-be62-227405828c45",  # Replace with your uploaded file ID
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        train_on_inputs="auto",
        n_epochs=3,
        n_checkpoints=1,
        lora=True,  # Default True
        warmup_ratio=0,
        learning_rate=1e-5,
        suffix="test_conv_8b",
    )