import os
import asyncio
import logging
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'gemini')
LLM_MODEL = os.environ.get('LLM_MODEL', 'gemini-2.0-flash')

CHAT_SYSTEM = """You are an expert AI debugging assistant with deep knowledge of software engineering.
You help developers understand bugs, trace root causes, and craft fixes.
You have access to relevant code snippets from the repository retrieved via semantic search.
Be precise, technically accurate, and helpful. Format code blocks with markdown.
When suggesting fixes, explain your reasoning clearly."""


class DebugChat:
    def __init__(self):
        self.client = self._init_client()

    def _init_client(self):
        if LLM_PROVIDER == 'gemini':
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
            return genai
        elif LLM_PROVIDER == 'openai':
            from openai import AsyncOpenAI
            return AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        elif LLM_PROVIDER == 'anthropic':
            import anthropic
            return anthropic.AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        raise ValueError(f"Unsupported provider: {LLM_PROVIDER}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def chat(self, messages: List[Dict], code_chunks: List[Dict],
                   context: Optional[Dict] = None) -> str:
        # Build system prompt with code context
        system = CHAT_SYSTEM
        if code_chunks:
            code_context = '\n\n'.join(
                f"### `{c['filePath']}` (lines {c['startLine']}-{c['endLine']})\n"
                f"```{c['language']}\n{c['content']}\n```"
                for c in code_chunks[:5]
            )
            system += f"\n\n## Relevant Code Context\n{code_context}"

        if context:
            if context.get('errorMessage'):
                system += f"\n\n## Current Bug\n```\n{context['errorMessage']}\n```"
            if context.get('analysis') and context['analysis'].get('rootCause'):
                system += f"\n\n## Previous Analysis\nRoot cause: {context['analysis']['rootCause']}"

        if LLM_PROVIDER == 'gemini':
            return await asyncio.get_event_loop().run_in_executor(
                None, self._call_gemini, system, messages
            )
        elif LLM_PROVIDER == 'anthropic':
            response = await self.client.messages.create(
                model=LLM_MODEL,
                max_tokens=2048,
                system=system,
                messages=messages,
            )
            return response.content[0].text
        else:
            all_messages = [{"role": "system", "content": system}] + messages
            response = await self.client.chat.completions.create(
                model=LLM_MODEL,
                max_tokens=2048,
                messages=all_messages,
            )
            return response.choices[0].message.content

    def _call_gemini(self, system: str, messages: List[Dict]) -> str:
        model = self.client.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system
        )
        # Convert message history to Gemini format
        history = []
        for m in messages[:-1]:
            history.append({
                'role': 'user' if m['role'] == 'user' else 'model',
                'parts': [m['content']]
            })
        chat = model.start_chat(history=history)
        last_message = messages[-1]['content'] if messages else ''
        response = chat.send_message(last_message)
        return response.text
