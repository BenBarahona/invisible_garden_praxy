import os
import json

from together import Together
from together.utils import check_file

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")


def upload_conversational_data():
    client = Together(api_key=TOGETHER_API_KEY)
    file_path = os.path.abspath("training/conversational/data.jsonl")

    sft_report = check_file(file_path)
    print(json.dumps(sft_report, indent=2))

    assert sft_report["is_check_passed"] == True

    train_file_resp = client.files.upload(file_path, check=True)

    print("conversational", train_file_resp.id)  


def upload_tokenized_data():
    client = Together(api_key=TOGETHER_API_KEY)
    file_path = os.path.abspath("training/tokenized/data.parquet")

    sft_report = check_file(file_path)
    print(json.dumps(sft_report, indent=2))

    assert sft_report["is_check_passed"] == True

    train_file_resp = client.files.upload(file_path, check=True)

    print("tokenized: ", train_file_resp.id)  # file-76b220f4-8f0a-45c9-a4a9-d3011da5200f