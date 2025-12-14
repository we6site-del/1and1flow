import google.generativeai as genai
import os

print(f"GenAI Version: {genai.__version__}")

try:
    print("Checking genai.protos...")
    print(dir(genai.protos))
    
    # Try to construct a tool
    func_decl = genai.protos.FunctionDeclaration(
        name="test_func",
        description="test",
        parameters={"type": "object", "properties": {"p": {"type": "string"}}}
    )
    tool = genai.protos.Tool(function_declarations=[func_decl])
    print("Tool construction successful!")
except Exception as e:
    print(f"Error: {e}")
