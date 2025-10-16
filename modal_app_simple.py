import modal
import json
from typing import Dict, List

# Create Modal app
app = modal.App("georgian-chat-llm")

# Define the image with required dependencies
image = modal.Image.debian_slim().pip_install([
    "transformers",
    "torch",
    "accelerate",
    "sentencepiece",
    "protobuf",
    "requests"
])

# Global variable to store the model
model = None
tokenizer = None

def load_model():
    """Load the Mistral model and tokenizer"""
    global model, tokenizer
    
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    
    model_name = "mistralai/Mistral-7B-Instruct-v0.1"
    
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True
    )
    
    print("Model loaded successfully!")

@app.function(
    image=image,
    gpu="A10G",
    timeout=300,
    min_containers=1
)
def generate_response(messages: List[Dict[str, str]], character: str = "georgian-gentleman") -> Dict[str, str]:
    """Generate a response using the Mistral model"""
    global model, tokenizer
    
    # Load model if not already loaded
    if model is None or tokenizer is None:
        load_model()
    
    # Character-specific system prompts
    character_prompts = {
        "georgian-gentleman": "You are a refined gentleman from 18th-century London (1750-1800). You speak with the elegance and formality of the Georgian era, using period-appropriate language and references. You are well-educated, polite, and have a keen interest in the arts, literature, and society of your time.",
        "lady-regent": "You are an elegant lady from the Regency period (1811-1820). You are witty, intelligent, and well-versed in the social graces of the time. You speak with refinement and often make clever observations about society and relationships.",
        "colonial-scholar": "You are an educated colonist from pre-Revolutionary America (1750-1775). You are well-read in Enlightenment philosophy, concerned with liberty and justice, and speak with the intellectual fervor of someone who values both tradition and progress.",
        "mr-boz": "You are 'Mr. Boz,' a Victorian novelist and social observer from 1850s-1870s London. You are the author of several notable works including 'A Tale of Two Cities,' 'Great Expectations,' and 'Oliver Twist.' You speak with literary flair and keen social observation, using Victorian English with Dickensian insight."
    }
    
    # Get character prompt
    system_prompt = character_prompts.get(character, character_prompts["georgian-gentleman"])
    
    # Global prompt that applies to all characters
    global_prompt = """
GLOBAL INSTRUCTIONS FOR ALL CHARACTERS:
- Always maintain your character's personality and speech patterns
- Keep responses concise (1-3 sentences) unless the topic requires more detail
- Always end with a follow-up question to encourage continued conversation
- Stay in character and maintain historical authenticity
- Be engaging and encourage the user to share more about their thoughts
- If discussing modern topics, relate them to your historical perspective
- Show genuine interest in the user's responses and build on their ideas
"""
    
    # Combine prompts
    full_system_prompt = global_prompt + "\n\n" + system_prompt
    
    # Format messages for Mistral
    formatted_messages = [
        {"role": "system", "content": full_system_prompt}
    ] + messages
    
    # Convert to Mistral format
    conversation = ""
    for msg in formatted_messages:
        if msg["role"] == "system":
            conversation += f"<s>[INST] {msg['content']} [/INST]"
        elif msg["role"] == "user":
            conversation += f" {msg['content']} [/INST]"
        elif msg["role"] == "assistant":
            conversation += f" {msg['content']} <s>[INST]"
    
    # Add end token
    conversation += " "
    
    # Tokenize
    inputs = tokenizer(conversation, return_tensors="pt")
    
    # Move inputs to GPU
    import torch
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Generate response
    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            max_new_tokens=150,  # Limit response length
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id
        )
    
    # Decode response
    response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    
    # Clean up response
    response = response.strip()
    if response.startswith("[/INST]"):
        response = response[7:].strip()
    
    return {
        "response": response,
        "character": character,
        "model": "mistral-7b-instruct"
    }

@app.function(
    image=image,
    timeout=60,
    min_containers=1
)
def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "mistral-7b-instruct",
        "provider": "modal"
    }

# Local development function
@app.local_entrypoint()
def main():
    """Test the function locally"""
    test_messages = [
        {"role": "user", "content": "Good day, sir! How fares the weather in London today?"}
    ]
    
    result = generate_response.remote(test_messages, "georgian-gentleman")
    print("Response:", result["response"])
