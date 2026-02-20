import requests
import json
import os
import argparse

def download_file(url, filename):
    if os.path.exists(filename):
        print(f"{filename} already exists, skipping download.")
        return
    print(f"Downloading {url}...")
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
    else:
        raise Exception(f"Failed to download {url}")

def prepare_data(input_file, output_file):
    print(f"Processing {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    training_data = []
    
    # Tanzil format: surah|ayah|text
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
            
        parts = line.split('|')
        if len(parts) < 3:
            continue
            
        text_content = parts[2]
        words = text_content.split()
        
        # Strategy 1: Full Ayah Completion
        # Prompt: "User: Complete: <First 2 words> Assistant: <Rest of Ayah>"
        if len(words) > 2:
            prompt_words = words[:2]
            completion_words = words[2:]
            
            entry = {
                "text": f"<s>User: Complete the verse: {' '.join(prompt_words)} Assistant: {' '.join(completion_words)} </s>"
            }
            training_data.append(entry)

        # Strategy 2: Mid-Ayah Continuation (for robustness)
        if len(words) > 5:
            mid = len(words) // 2
            prompt_part = words[:mid]
            completion_part = words[mid:]
            
            entry = {
                "text": f"<s>User: Continue recitation: {' '.join(prompt_part)} Assistant: {' '.join(completion_part)} </s>"
            }
            training_data.append(entry)

    print(f"Generated {len(training_data)} training examples.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in training_data:
            json.dump(item, f, ensure_ascii=False)
            f.write('\n')
            
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="quran-uthmani.txt", help="Input raw text file")
    parser.add_argument("--output", default="quran_train.jsonl", help="Output JSONL file")
    args = parser.parse_args()

    # Download source if not present
    if not os.path.exists(args.input):
        download_file("http://tanzil.net/pub/download/download.php?q=quran-uthmani.txt&n=quran-uthmani", args.input)

    prepare_data(args.input, args.output)
