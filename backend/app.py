from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

app = FastAPI(title="Hafiz-LM API")

# Allow CORS for React App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"
ADAPTER_MODEL = "./Hafiz-LM-1.5B-v1"

# Global Model State
model = None
tokenizer = None

def load_model():
    global model, tokenizer
    if os.path.exists(ADAPTER_MODEL):
        print(f"Loading Fine-Tuned Adapter from {ADAPTER_MODEL}...")
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
        base_model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            return_dict=True,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        model = PeftModel.from_pretrained(base_model, ADAPTER_MODEL)
        model.eval()
    else:
        print(f"Adapter not found at {ADAPTER_MODEL}. Loading Base Model {BASE_MODEL}...")
        # Fallback to base model if training hasn't happened yet
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            return_dict=True,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        model.eval()

@app.on_event("startup")
async def startup_event():
    load_model()

class PredictRequest(BaseModel):
    text: str
    max_tokens: int = 20

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
async def predict(req: PredictRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Prompt format must match training (User/Assistant)
    # Using 'Continue' prompt style
    prompt = f"User: Continue recitation: {req.text} Assistant:"
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=req.max_tokens,
            do_sample=False, # Deterministic for Quran
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.2
        )

    full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract just the assistant response
    if "Assistant:" in full_output:
        prediction = full_output.split("Assistant:")[-1].strip()
    else:
        prediction = full_output

    return {
        "input": req.text,
        "prediction": prediction
    }

# Run with: uvicorn app:app --reload --port 8000
