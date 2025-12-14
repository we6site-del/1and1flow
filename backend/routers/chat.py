from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union, Any, Dict
import os
from openai import AsyncOpenAI
from fastapi.responses import StreamingResponse
import json
import fal_client
import google.generativeai as genai
from services.model_router import model_router
import asyncio
import httpx

router = APIRouter()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=api_key) if api_key else None

# Initialize OpenRouter client
openrouter_key = os.getenv("OPENROUTER_API_KEY")
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_key,
) if openrouter_key else None



class Message(BaseModel):
    role: str
    content: Union[str, List[Any], Any]

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-4o"

# Tool Definitions
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "generate_fabric",
            "description": "Generate fabric textures based on a description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the fabric texture"},
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_palette",
            "description": "Generate a color palette based on a description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the mood or theme"},
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_ai_node",
            "description": "Create a new AI generation node (image or video) on the canvas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", "enum": ["image", "video"], "description": "The type of generation node to create"},
                    "prompt": {"type": "string", "description": "The generation prompt for the AI model"},
                    "model_id": {"type": "string", "description": "Optional: Specific model ID"},
                    "reference_image_url": {"type": "string", "description": "Optional: URL of a reference image to use for generation"},
                    "x": {"type": "number", "description": "Optional: X position"},
                    "y": {"type": "number", "description": "Optional: Y position"},
                },
                "required": ["type", "prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_node_settings",
            "description": "Update settings of an existing AI node.",
            "parameters": {
                "type": "object",
                "properties": {
                    "node_id": {"type": "string", "description": "The ID of the node to update"},
                    "prompt": {"type": "string", "description": "New prompt"},
                    "model_id": {"type": "string", "description": "New model ID"},
                },
                "required": ["node_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_content",
            "description": "Trigger generation for an existing AI node.",
            "parameters": {
                "type": "object",
                "properties": {
                    "node_id": {"type": "string", "description": "The ID of the node"},
                },
                "required": ["node_id"],
            },
        },
    }
]


SYSTEM_PROMPT = """
You are a Fashion Design Copilot.
When the user asks for visual assets (fabrics, colors), use the available tools.
When the user wants to create nodes on the canvas, use the create_ai_node tool.
If the user provides an image or context implies using an image, pass it as 'reference_image_url' to the create_ai_node tool.
Do NOT describe the assets in text if you use a tool.
The tool output will be sent to the user.
IMPORTANT: Always answer the user in Chinese (Simplified Chinese).
"""

class RefineRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o"

@router.post("/chat/refine")
async def refine_prompt(request: RefineRequest):
    """
    Refine a user prompt for better image generation results.
    """
    system_instruction = (
        "You are an expert prompt engineer for Stable Diffusion and Midjourney. "
        "Your task is to refine the user's input prompt into a high-quality, detailed English prompt "
        "that yields professional, artistic results. "
        "Add details about lighting, composition, style (e.g., 'cinematic lighting', '8k', 'photorealistic'), "
        "but keep the core intent of the user. "
        "Return ONLY the refined prompt text, no explanations."
    )
    
    try:
        if not client:
             raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        response = await client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.7,
            max_tokens=200,
        )
        
        refined_content = response.choices[0].message.content.strip()
        return {"refined_prompt": refined_content}

    except Exception as e:
        print(f"Refine error: {e}")
        # Fallback if AI fails or key missing
        return {"refined_prompt": request.prompt}

def format_ai_sdk_stream(text_chunk):
    """
    Format a text chunk for the Vercel AI SDK on the frontend.
    Protocol: '0:"text chunk"'
    """
    import json
    # Use json.dumps to safely escape newlines and quotes
    return f'0:{json.dumps(text_chunk)}\n'

async def execute_tool(tool_call_or_name, args_dict=None):
    """
    Execute a tool. 
    Supports two signatures:
    1. execute_tool(tool_call_object) -> for OpenAI
    2. execute_tool(name_str, args_dict) -> for Gemini
    """
    if isinstance(tool_call_or_name, str):
        name = tool_call_or_name
        args = args_dict or {}
    else:
        # OpenAI tool call object
        name = tool_call_or_name.function.name
        args = json.loads(tool_call_or_name.function.arguments)
    
    if name == "generate_fabric":
        # Call Fal.ai for texture generation
        # Using a fast SDXL model for textures
        try:
            prompt = args["prompt"] + ", top down view, texture, seamless, high quality, 8k"
            handler = await fal_client.submit_async(
                "fal-ai/fast-sdxl",
                arguments={"prompt": prompt, "num_images": 4}
            )
            result = await handler.get()
            images = [img["url"] for img in result["images"]]
            return f"<FABRIC_GRID>{json.dumps({'images': images, 'prompt': args['prompt']})}</FABRIC_GRID>"
        except Exception as e:
            print(f"Fal Error: {e}")
            return "Sorry, I failed to generate the fabric."

    elif name == "generate_palette":
        # Return a hardcoded/randomized palette for the demo based on keywords
        return f"<COLOR_PALETTE>{json.dumps({'colors': ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3']})}</COLOR_PALETTE>"

    elif name == "web_search":
        # Mock web search results
        query = args["query"]
        print(f"Web Search Query: {query}")
        # In a real app, call Tavily or Google Search API here
        return f"Search Results for '{query}':\n1. Top Fashion Trends 2025: Sustainable materials, digital fashion, and pastel colors.\n2. Color of the Year: Future Dusk (Blue-Purple).\n3. Fabric Trends: Bio-based leathers and recycled synthetics."

    elif name in ["create_ai_node", "update_node_settings", "generate_content"]:
        # Client-side tools
        # We return a special tag that the frontend will parse and execute
        # We pass the arguments exactly as received
        print(f"DEBUG: Constructing Client Action: {name} with args: {args}")
        return f"<CLIENT_ACTION type=\"{name}\" args='{json.dumps(args)}' />"

    return ""

def convert_tools_to_gemini(tools):
    """
    Convert OpenAI tool definitions to Gemini format using safe dictionary structure.
    Returns a list containing a single Tool dict with all function declarations.
    """
    function_declarations = []
    for tool in tools:
        if tool["type"] == "function":
            func_def = tool["function"]
            # Map parameters schema
            parameters = func_def.get("parameters", {})
            
            # Create FunctionDeclaration as dict
            func_decl = {
                "name": func_def["name"],
                "description": func_def.get("description", ""),
                "parameters": parameters,
            }
            function_declarations.append(func_decl)
            
    if not function_declarations:
        return None
        
    # Return list of Tools (Gemini expects list of Tool objects or dicts)
    return [{"function_declarations": function_declarations}]



async def chat_with_google(model_name: str, messages: List[dict]):
    """
    Handle chat interaction with Google Gemini models.
    Returns AI SDK compatible stream format.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")
        
    genai.configure(api_key=api_key)
    
    # 1. Extract System Prompt
    system_instruction = None
    chat_history = []
    last_message = ""
    
    print(f"DEBUG: Starting chat_with_google for model {model_name}")
    
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        
        parts = []
        
        # Handle complex content (image/text list)
        if isinstance(content, list):
            for part in content:
                if part.get("type") == "text":
                    text_value = part.get("text")
                    # Ensure text is a non-empty string, not None
                    if text_value is not None and str(text_value).strip():
                        parts.append(str(text_value).strip())
                elif part.get("type") == "image_url":
                    # Handle base64 image
                    url = part.get("image_url", {}).get("url", "")
                    if url.startswith("data:image"):
                        try:
                            # Extract base64 part
                            header, encoded = url.split(",", 1)
                            mime_type = header.split(":")[1].split(";")[0]
                            import base64
                            image_data = base64.b64decode(encoded)
                            parts.append({
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": image_data
                                }
                            })
                            print(f"DEBUG: Added image input (base64): {mime_type}")
                        except Exception as e:
                            print(f"DEBUG: Failed to process base64 image: {e}")
                    elif url.startswith("http"):
                        # Handle HTTP URL - Download image
                        try:
                            # Use sync download inside async function is risky? No, use httpx.AsyncClient
                            # But we are in async def but loop is not awaiting here?
                            # We should use httpx.AsyncClient().get(url)
                            # But we are gathering parts. We can await here.
                            async with httpx.AsyncClient() as client:
                                resp = await client.get(url)
                                resp.raise_for_status()
                                content_type = resp.headers.get("content-type", "image/jpeg")
                                image_data = resp.content
                                parts.append({
                                    "inline_data": {
                                        "mime_type": content_type,
                                        "data": image_data
                                    }
                                })
                                print(f"DEBUG: Added image input (url): {content_type}")
                        except Exception as e:
                            print(f"DEBUG: Failed to download image {url}: {e}")
        elif isinstance(content, str):
            # Ensure content is not empty
            content_str = content.strip()
            if content_str:
                parts.append(content_str)
        
        # Filter out None values, empty strings, and ensure all text parts are non-empty strings
        filtered_parts = []
        for p in parts:
            if p is None:
                continue
            if isinstance(p, str):
                # Only add non-empty strings
                if p.strip():
                    filtered_parts.append(p.strip())
            elif isinstance(p, dict):
                # Keep dict parts (for images)
                filtered_parts.append(p)
        
        parts = filtered_parts
        
        if not parts:
            print(f"DEBUG: Skipping message with role {role} - no valid parts")
            continue

        if role == "system":
            # For system instruction, extract first string part or convert to string
            # Only use string parts, ignore dict parts (images) for system instruction
            string_parts = [str(p).strip() for p in parts if isinstance(p, str) and str(p).strip()]
            if string_parts:
                system_instruction = " ".join(string_parts)
            else:
                system_instruction = SYSTEM_PROMPT
            # Ensure system_instruction is a non-empty string
            if not system_instruction or not isinstance(system_instruction, str):
                system_instruction = SYSTEM_PROMPT
            print(f"DEBUG: System instruction set (length={len(system_instruction)}): {system_instruction[:50]}...")
        elif role == "user":
            # Ensure all parts are valid (non-empty strings or dicts for images)
            valid_parts = []
            for p in parts:
                if isinstance(p, str) and p.strip():
                    valid_parts.append(p.strip())
                elif isinstance(p, dict):
                    valid_parts.append(p)
            if valid_parts:
                print(f"DEBUG: Adding user message with {len(valid_parts)} parts")
                chat_history.append({"role": "user", "parts": valid_parts})
                last_message = valid_parts
        elif role == "assistant":
            # Ensure all parts are valid (non-empty strings or dicts for images)
            valid_parts = []
            for p in parts:
                if isinstance(p, str) and p.strip():
                    valid_parts.append(p.strip())
                elif isinstance(p, dict):
                    valid_parts.append(p)
            if valid_parts:
                print(f"DEBUG: Adding assistant message with {len(valid_parts)} parts")
                chat_history.append({"role": "model", "parts": valid_parts})

    # Ensure system_instruction is set and is a valid string
    if not system_instruction or not isinstance(system_instruction, str) or not system_instruction.strip():
        system_instruction = SYSTEM_PROMPT
    system_instruction = str(system_instruction).strip()
    
    # Remove the last message from history as it will be sent in send_message
    if chat_history and chat_history[-1]["role"] == "user":
        chat_history.pop()
    
    print(f"DEBUG: History length: {len(chat_history)}")
    print(f"DEBUG: Last message parts: {last_message if last_message else 'None'}")
    
    # Validate chat_history - ensure all parts are valid
    validated_history = []
    for entry in chat_history:
        validated_parts = []
        for p in entry.get("parts", []):
            if isinstance(p, str) and p.strip():
                validated_parts.append(p.strip())
            elif isinstance(p, dict):
                validated_parts.append(p)
        if validated_parts:
            validated_history.append({
                "role": entry["role"],
                "parts": validated_parts
            })
    
    chat_history = validated_history
    print(f"DEBUG: Validated history length: {len(chat_history)}")
    
    # 2. Initialize Model with Tools
    gemini_tools = convert_tools_to_gemini(TOOLS)
    
    try:
        # Double-check history before creating model
        final_history = []
        for entry in chat_history:
            final_parts = []
            for p in entry.get("parts", []):
                if isinstance(p, str):
                    # Ensure it's a non-empty string
                    p_str = str(p).strip()
                    if p_str:
                        final_parts.append(p_str)
                elif isinstance(p, dict):
                    # Keep dict parts (for images) - validate structure
                    if "mime_type" in p and "data" in p:
                        final_parts.append(p)
                    else:
                        print(f"DEBUG: Skipping invalid dict part: {p}")
            if final_parts:
                final_history.append({
                    "role": entry["role"],
                    "parts": final_parts
                })
        
        print(f"DEBUG: Final history for model creation: {len(final_history)} entries")
        for i, entry in enumerate(final_history):
            parts_info = []
            for p in entry['parts']:
                if isinstance(p, str):
                    parts_info.append(f"str({len(p)} chars)")
                elif isinstance(p, dict):
                    parts_info.append(f"dict({p.get('mime_type', 'unknown')})")
                else:
                    parts_info.append(f"{type(p).__name__}")
            print(f"DEBUG: Entry {i}: role={entry['role']}, parts_count={len(entry['parts'])}, parts={parts_info}")
        
        # Validate system_instruction one more time
        if not isinstance(system_instruction, str) or not system_instruction.strip():
            print(f"DEBUG: Invalid system_instruction, using default")
            system_instruction = SYSTEM_PROMPT
        
        print(f"DEBUG: Creating GenerativeModel with system_instruction type={type(system_instruction).__name__}, length={len(system_instruction)}")
        
        model = genai.GenerativeModel(
            model_name,
            system_instruction=system_instruction,
            tools=gemini_tools,
            # Set tool config to auto
            tool_config={'function_calling_config': 'AUTO'}
        )
        
        print(f"DEBUG: Model created successfully")
        
        # Don't create chat here if we're using mock response
        chat = model.start_chat(history=final_history)
        
    except Exception as e:
        print(f"DEBUG: Error creating model: {e}")
        import traceback
        traceback.print_exc()
        if "429" in str(e) or "ResourceExhausted" in str(e) or "Quota exceeded" in str(e):
             yield format_ai_sdk_stream("⚠️ **系统繁忙 (配额超限)**\n\nAI 模型当前繁忙，请等待一分钟后再试。")
        else:
             yield format_ai_sdk_stream(f"Error initializing model: {str(e)}")
        return
    
    # 4. Generate Response (Stream)
    # We use stream=True but need to buffer to check for function calls
    print(f"Sending message to Google model: {model_name}")
    
    # print(f"DEBUG: Model initialized. Sending message...")

    # For streaming, we need to correctly use chat session or generate_content
    # Gemini python lib manages history automatically in ChatSession, but here we reconstructed history manually.
    # To use history, we create a chat session with history (excluding last message) and send last message.
    
    try:
        # Get the last user message to send
        if last_message:
            # Validate last_message parts
            validated_last_message = []
            for p in last_message:
                if isinstance(p, str) and p.strip():
                    validated_last_message.append(p.strip())
                elif isinstance(p, dict):
                    validated_last_message.append(p)
            current_msg_parts = validated_last_message if validated_last_message else ["Hello"]
            history_context = chat_history
        elif len(chat_history) > 0 and chat_history[-1]["role"] == "user":
            current_msg_parts = chat_history[-1]["parts"]
            history_context = chat_history[:-1]
        else:
            # Fallback if weird structure
            current_msg_parts = ["Hello"]
            history_context = []

        # Validate current_msg_parts before sending
        final_parts = []
        for p in current_msg_parts:
            if isinstance(p, str) and p.strip():
                final_parts.append(p.strip())
            elif isinstance(p, dict):
                final_parts.append(p)
        
        if not final_parts:
            final_parts = ["Hello"]
        
        print(f"DEBUG: Sending {len(final_parts)} parts to Gemini: {[str(p)[:50] if isinstance(p, str) else 'image' for p in final_parts]}")
        response = await chat.send_message_async(final_parts, stream=True)
        
        print(f"DEBUG: Response stream started. Iterating...")
        async for chunk in response:
            print(f"DEBUG: Received chunk: {chunk.text if hasattr(chunk, 'text') else 'No text'}")
            if hasattr(chunk, "text") and chunk.text:
                yield format_ai_sdk_stream(chunk.text)
            
            # Check for function calls
            # Note: Streaming function calls in Gemini python SDK is tricky. 
            # Usually the first chunk contains the function call.
            # We need to inspect parts.
            for part in chunk.parts:
                if fn := part.function_call:
                    print(f"DEBUG: Function Call detected: {fn.name}")
                    # Execute tool and yield result tag
                    tool_result = await execute_tool(fn.name, dict(fn.args))
                    print(f"DEBUG: Tool execution result: {tool_result[:50]}...")
                    yield format_ai_sdk_stream(tool_result)
    except Exception as e:
        print(f"DEBUG: Gemini Error: {e}")
        import traceback
        traceback.print_exc()
        if "429" in str(e) or "ResourceExhausted" in str(e) or "Quota exceeded" in str(e):
             yield format_ai_sdk_stream("⚠️ **系统繁忙 (配额超限)**\n\nAI 模型当前繁忙，请等待一分钟后再试。")
        else:
             yield format_ai_sdk_stream(f"Error: {str(e)}")


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        print(f"DEBUG: Chat Request received for model {request.model}")
        print(f"DEBUG: Request messages count: {len(request.messages)}")
        for i, m in enumerate(request.messages):
            print(f"DEBUG: Message {i}: role={m.role}, content_type={type(m.content).__name__}, content_length={len(str(m.content)) if m.content else 0}")
        
        # Process messages to handle vision input
        processed_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        for m in request.messages:
            content = m.content
            # Ensure content is a string
            if not isinstance(content, str):
                print(f"DEBUG: Warning: content is not a string, converting: {type(content)}")
                content = str(content) if content else ""
            
            # Check for our custom image tag convention: [IMAGE]data:image/png;base64,...[/IMAGE]
            if "[IMAGE]" in content and "[/IMAGE]" in content:
                parts = content.split("[IMAGE]")
                text_part = parts[0].strip()
                image_part = parts[1].split("[/IMAGE]")[0].strip()
                
                new_content = []
                # Always add text part to satisfy strict API requirements (Gemini via OpenRouter)
                # Use a space if empty, as some APIs reject empty strings
                text_content = str(text_part) if text_part else " "
                new_content.append({"type": "text", "text": text_content})
                
                if image_part:
                    new_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": str(image_part)
                        }
                    })
                
                processed_messages.append({"role": m.role, "content": new_content})
            else:
                # Ensure content is a non-empty string
                if content and content.strip():
                    processed_messages.append({"role": m.role, "content": str(content).strip()})
                else:
                    print(f"DEBUG: Skipping empty message for role {m.role}")

        print(f"DEBUG: Processed messages count: {len(processed_messages)}")
        for i, msg in enumerate(processed_messages):
            content_type = type(msg.get("content")).__name__
            print(f"DEBUG: Processed message {i}: role={msg.get('role')}, content_type={content_type}")

        # Determine which client to use
        
        # Dispatch to Google Gemini Handler if model starts with models/gemini
        if request.model.startswith("models/gemini"):
             return StreamingResponse(
                 chat_with_google(request.model, processed_messages),
                 media_type="text/event-stream"
             )

        active_client = client
        use_openrouter = False
        
        # Check for OpenRouter models (containing slash but not starting with models/gemini)
        # Common OpenRouter format: vendor/model-name
        if "/" in request.model and not request.model.startswith("models/gemini"):
            if not openrouter_client:
                raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
            print(f"DEBUG: Using OpenRouter for model {request.model}")
            active_client = openrouter_client
            use_openrouter = True
        else:
             if not client:
                raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        # --- Enhanced Message Processing for Compatibility ---
        
        final_messages = []
        
        # 1. Handle System Prompt
        # For OpenRouter/Gemini, it's often safer to prepend system prompt to first user message 
        # or use 'system' role if supported. But to be safe against "text parts" errors, we'll prepend.
        current_system_prompt = SYSTEM_PROMPT
        
        # Initialize with processed_messages (which has system prompt as first item currently)
        # We need to flatten/merge this.
        
        temp_messages = []
        for m in request.messages:
             content = m.content
             # Initial cleaning
             if not isinstance(content, str):
                 content = str(content) if content else ""
             
             # Image Tag Parsing (Keep this logic)
             if "[IMAGE]" in content and "[/IMAGE]" in content:
                 parts = content.split("[IMAGE]")
                 text_part = parts[0].strip()
                 image_part = parts[1].split("[/IMAGE]")[0].strip()
                 
                 new_content = []
                 # Always add text part (space if empty)
                 text_content = str(text_part) if text_part else " "
                 new_content.append({"type": "text", "text": text_content})
                 
                 if image_part:
                     new_content.append({
                         "type": "image_url",
                         "image_url": {
                             "url": str(image_part)
                         }
                     })
                 temp_messages.append({"role": m.role, "content": new_content})
             else:
                 if content and content.strip():
                     temp_messages.append({"role": m.role, "content": str(content).strip()})
        
        # 2. Merge Strategies
        # If using OpenRouter, we merge system prompt into first user message to avoid 'system' role issues
        # and merge consecutive same-role messages.
        
        merged_messages = []
        
        # Merge System Prompt into the first message if possible
        if temp_messages:
            first_msg = temp_messages[0]
            if first_msg["role"] == "user":
                if isinstance(first_msg["content"], str):
                    first_msg["content"] = current_system_prompt + "\n\n" + first_msg["content"]
                elif isinstance(first_msg["content"], list):
                    # Find text part
                    text_found = False
                    for part in first_msg["content"]:
                        if part.get("type") == "text":
                            part["text"] = current_system_prompt + "\n\n" + part["text"]
                            text_found = True
                            break
                    if not text_found:
                        # Insert at beginning
                        first_msg["content"].insert(0, {"type": "text", "text": current_system_prompt + "\n\n"})
            else:
                # First message is not user (rare, maybe assistant?), prepend a user message with system prompt
                merged_messages.append({"role": "user", "content": current_system_prompt})
        else:
            # No messages? Just send system prompt as user message
             merged_messages.append({"role": "user", "content": current_system_prompt})

        for msg in temp_messages:
            if not merged_messages:
                merged_messages.append(msg)
                continue
            
            last_msg = merged_messages[-1]
            
            # Merge consecutive same-role messages
            if last_msg["role"] == msg["role"]:
                # If both are strings, join them
                if isinstance(last_msg["content"], str) and isinstance(msg["content"], str):
                    last_msg["content"] += "\n\n" + msg["content"]
                # If one is list (has image), we need to make last_msg a list and append
                else:
                    # Convert last_msg to list if it isn't
                    if isinstance(last_msg["content"], str):
                        last_msg["content"] = [{"type": "text", "text": last_msg["content"]}]
                    
                    # Append new content
                    if isinstance(msg["content"], str):
                        last_msg["content"].append({"type": "text", "text": msg["content"]})
                    elif isinstance(msg["content"], list):
                        last_msg["content"].extend(msg["content"])
        
        # FINAL PASS: Flatten content if it's a list with only text parts (OpenRouter GLM fix)
        # GLM-4.6V throws "text parts expect a string value" if sent as structured list without images?
        # Or maybe it just prefers string. Safer to flatten.
        for msg in merged_messages:
            if isinstance(msg["content"], list):
                # Check if it only contains text
                if all(part.get("type") == "text" for part in msg["content"]):
                    # Join all text parts into a single string
                    msg["content"] = "\n\n".join(part["text"] for part in msg["content"])

        processed_messages = merged_messages
        
        # Debug Payload
        import json
        payload_debug = json.dumps(processed_messages, default=str)
        print(f"DEBUG: Processed Messages Payload: {payload_debug}")
        
        # Write to file for inspection
        try:
            with open("debug_payload.json", "w") as f:
                f.write(payload_debug)
        except Exception as e:
            print(f"Failed to write debug logging: {e}")

        # Smart Model Selection with Auto-Fallback
        attempted_models = []
        last_error = None
        
        # Load available chat models
        try:
            with open("backend/data/chat_models.json", "r") as f:
                all_chat_models = json.load(f)
        except:
            all_chat_models = []
        
        # Try requested model first, then fallback to available models
        models_to_try = [{"api_path": request.model, "name": "Requested"}]
        
        # Add other models as fallback
        for model in all_chat_models:
            if model["api_path"] != request.model:
                models_to_try.append(model)
        
        response = None
        for model_info in models_to_try:
            model_path = model_info["api_path"]
            
            # Skip if model is in cooldown
            if not model_router.is_model_available(model_path):
                print(f"Skipping {model_path} (in cooldown)")
                continue
            
            try:
                print(f"Attempting model: {model_path}")
                attempted_models.append(model_path)
                
                response = await active_client.chat.completions.create(
                    model=model_path,
                    messages=processed_messages,
                    tools=TOOLS,
                    tool_choice="auto",
                    stream=False
                )
                
                # Success! Break out of loop
                print(f"✓ Model {model_path} succeeded")
                break
                
            except Exception as e:
                error_str = str(e).lower()
                last_error = e
                
                # Check if it's a rate limit error
                if "429" in error_str or "rate limit" in error_str or "quota" in error_str:
                    print(f"✗ Model {model_path} rate limited")
                    model_router.mark_model_failed(model_path)
                else:
                    print(f"✗ Model {model_path} failed: {str(e)[:100]}")
                
                # Continue to next model
                continue
        
        # If all models failed
        if response is None:
            print(f"All models failed. Attempted: {attempted_models}")
            cooldown_info = model_router.get_cooldown_info()
            
            async def all_failed_generator():
                msg = "⚠️ **所有模型暂时不可用**\n\n"
                msg += f"已尝试的模型: {', '.join(attempted_models)}\n\n"
                
                if cooldown_info:
                    msg += "**冷却中的模型**:\n"
                    for model_path, remaining in cooldown_info.items():
                        msg += f"- `{model_path}`: {remaining}秒后可用\n"
                
                msg += "\n**建议**: 请稍等片刻后重试。"
                yield format_ai_sdk_stream(msg)
            
            return StreamingResponse(
                all_failed_generator(),
                media_type="text/event-stream"
            )

        message = response.choices[0].message

        if message.tool_calls:
            # Handle tool calls
            tool_outputs = []
            for tool_call in message.tool_calls:
                result = await execute_tool(tool_call)
                # Format as AI SDK stream
                async def tool_response_generator():
                    yield format_ai_sdk_stream(str(result))
                return StreamingResponse(tool_response_generator(), media_type="text/event-stream")
        
        else:
            # No tool calls, just stream the text response we already fetched
            # Optimization: Do NOT call API again with stream=True. Just yield the text we have.
            content = message.content or ""
            
            async def text_response_generator():
                # Simulate streaming for frontend compatibility
                 # Chunking it slightly for better UX (optional)
                chunk_size = 100
                for i in range(0, len(content), chunk_size):
                    chunk = content[i:i+chunk_size]
                    yield format_ai_sdk_stream(chunk)
                    await asyncio.sleep(0.01) # Tiny delay
            
            return StreamingResponse(text_response_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Chat Endpoint Error: {e}")
        try:
            with open("backend/backend_error.log", "w") as f:
                import traceback
                f.write(f"Error: {e}\n")
                f.write(traceback.format_exc())
                if hasattr(e, 'response') and hasattr(e.response, 'text'):
                     f.write(f"\nResponse Body: {e.response.text}\n")
        except:
             pass

        if hasattr(e, 'response') and hasattr(e.response, 'text'):
             print(f"Chat Endpoint Error Body: {e.response.text}")

        import traceback
        traceback.print_exc()
        
        # Check for OpenAI/OpenRouter specific errors
        error_str = str(e)
        if "429" in error_str or "rate limit" in error_str.lower() or "quota" in error_str.lower():
             model_name = request.model
             print(f"DEBUG: Returning 429 Error Response for {model_name}")
             
             async def error_generator():
                 yield format_ai_sdk_stream(f"⚠️ **系统繁忙 (配额超限)**\n\n模型 `{model_name}` 当前请求量过大或配额不足。\n\n**建议操作**：\n1. 请稍等几分钟后再试。\n2. 尝试切换其他模型 (如 GLM-4 Air)。")
             
             return StreamingResponse(
                 error_generator(),
                 media_type="text/event-stream"
             )
        
        raise HTTPException(status_code=500, detail=str(e))
