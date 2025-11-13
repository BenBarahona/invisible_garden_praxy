import json, argparse
from datasets import Dataset
from transformers import AutoTokenizer


def build_parquet(jsonl_in, parquet_out, model_name="meta-llama/Llama-3.3-70B-Instruct", max_len=8192):
    tok = AutoTokenizer.from_pretrained(model_name, use_fast=True)

    input_ids_list, attn_list, labels_list = [], [], []

    with open(jsonl_in, "r", encoding="utf-8") as f:
        for line in f:
            print("line:", line)
            ex = json.loads(line)
            msgs = ex["messages"]

            # tokens for full conversation (includes assistant content)
            full_ids = tok.apply_chat_template(
                msgs, tokenize=True, add_generation_prompt=False, return_tensors=None
            )

            # assume last message is assistant; if not, skip/continue as needed
            pre_msgs = msgs[:-1]
            prompt_ids = tok.apply_chat_template(
                pre_msgs, tokenize=True, add_generation_prompt=True, return_tensors=None
            )

            # build attention mask (no padding yet; all 1s)
            attn = [1] * len(full_ids)

            # labels: mask everything except assistant span
            labels = [-100] * len(full_ids)
            start = len(prompt_ids)
            end = len(full_ids)
            # (Optionally trim trailing special tokens after assistant if you don’t want them in loss)
            # Here we include all assistant content as-is:
            labels[start:end] = full_ids[start:end]

            # truncate if needed (no packing for clarity)
            input_ids = full_ids[:max_len]
            attn = attn[:max_len]
            labels = labels[:max_len]

            input_ids_list.append(input_ids)
            attn_list.append(attn)
            labels_list.append(labels)

    ds = Dataset.from_dict({
        "input_ids": input_ids_list,
        "attention_mask": attn_list,
        "labels": labels_list
    })
    ds.to_parquet(parquet_out)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--in_jsonl", required=True)
    p.add_argument("--out_parquet", required=True)
    p.add_argument("--model", default="meta-llama/Llama-3.3-70B-Instruct")
    p.add_argument("--max_len", type=int, default=8192)
    args = p.parse_args()
    build_parquet(args.in_jsonl, args.out_parquet, args.model, args.max_len)
