import os
import json
import logging
import asyncio
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'gemini')
LLM_MODEL = os.environ.get('LLM_MODEL', 'gemini-1.5-flash')


class BugAnalyzer:
    def __init__(self):
        self.client = self._init_client()

    def _init_client(self):
        if LLM_PROVIDER == 'gemini':
            import google.generativeai as genai
            genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
            return genai
        elif LLM_PROVIDER == 'openai':
            from openai import AsyncOpenAI
            return AsyncOpenAI(
                api_key=os.environ.get('OPENAI_API_KEY'),
                base_url=os.environ.get('OPENAI_BASE_URL')
            )
        elif LLM_PROVIDER == 'anthropic':
            import anthropic
            return anthropic.AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        else:
            raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def analyze(self, error_message: str, stack_trace: Optional[str],
                       logs: Optional[str], code_chunks: List[Dict]) -> Dict:
        context = self._build_context(code_chunks)
        prompt = self._build_prompt(error_message, stack_trace, logs, context)

        if LLM_PROVIDER == 'gemini':
            try:
                raw = await asyncio.get_event_loop().run_in_executor(
                    None, self._call_gemini, prompt
                )
                if not raw:
                    raise ValueError("Empty response from Gemini")
                return self._parse_response(raw)
            except Exception as e:
                logger.error(f"Gemini failed: {str(e)}")
                return {
                    "analysis": {
                        "rootCause": "LLM request failed",
                        "explanation": str(e),
                        "suggestedFix": "Check API quota or try again later",
                        "affectedFiles": [],
                        "confidence": 0.1
                    },
                    "patch": None
                }

        elif LLM_PROVIDER == 'anthropic':
            response = await self.client.messages.create(
                model=LLM_MODEL,
                max_tokens=8192,
                messages=[{"role": "user", "content": f"{SYSTEM_PROMPT}\n\n{prompt}"}]
            )
            raw = response.content[0].text
        else:
            response = await self.client.chat.completions.create(
                model=LLM_MODEL,
                max_tokens=8192,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            )
            raw = response.choices[0].message.content

        return self._parse_response(raw)

    def _call_gemini(self, prompt: str) -> str:
        import google.generativeai as genai
        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=SYSTEM_PROMPT
        )
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                max_output_tokens=1500,
            )
        )
        return response.text if hasattr(response, 'text') else ""

    def _build_context(self, chunks: List[Dict]) -> str:
        parts = []
        for c in chunks[:8]:  # limit to 8 chunks to save tokens
            content = c['content'][:1500]  # limit content length
            parts.append(
                f"### File: `{c['filePath']}` (lines {c['startLine']}-{c['endLine']})\n"
                f"```{c['language']}\n{content}\n```"
            )
        return '\n\n'.join(parts)

    def _build_prompt(self, error_message, stack_trace, logs, context) -> str:
        return f"""Analyze this bug and respond ONLY with valid JSON.

Error: {error_message}

Stack Trace: {(stack_trace or 'Not provided')[:1000]}

Relevant Code:
{context}

Respond ONLY with this JSON format:
{{
  "analysis": {{
    "rootCause": "Detailed root cause explaining exactly what is wrong in the code, which component is failing and why",
    "explanation": "Detailed explanation of why this bug occurs, how it affects the system, and what happens if left unfixed",
    "suggestedFix": "Step by step instructions on exactly how to fix the bug with specific code changes needed",
    "affectedFiles": ["file/path"],
    "confidence": 0.85
  }},
  "patch": "--- a/path/to/file\\n+++ b/path/to/file\\n@@ -1,3 +1,3 @@\\n context line\\n-old line to remove\\n+new line to add\\n context line"
}}

IMPORTANT: The patch field MUST contain a real unified diff (git diff format) that fixes the bug based on the code shown above.
- Start with: diff --git a/filepath b/filepath
- Then: --- a/filepath
- Then: +++ b/filepath
- Then the @@ hunk headers with actual line changes
- Lines starting with - are removed, lines starting with + are added, lines starting with space are context
- Only use null for patch if absolutely no code change is needed to fix the bug."""

    def _parse_response(self, raw: str) -> Dict:
        raw = raw.strip()
        if raw.startswith('```'):
            raw = raw.split('\n', 1)[1]
            if raw.endswith('```'):
                raw = raw.rsplit('```', 1)[0]
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            return {
                "analysis": {
                    "rootCause": "Could not parse AI response",
                    "explanation": raw[:500],
                    "suggestedFix": "Try again",
                    "affectedFiles": [],
                    "confidence": 0.1
                },
                "patch": None
            }


SYSTEM_PROMPT = """You are an expert software debugger. Analyze bugs and respond ONLY with valid JSON. No prose before or after the JSON."""
