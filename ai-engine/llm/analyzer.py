import os
import json
import logging
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'anthropic')
LLM_MODEL = os.environ.get('LLM_MODEL', 'claude-sonnet-4-20250514')


class BugAnalyzer:
    def __init__(self):
        self.client = self._init_client()

    def _init_client(self):
        if LLM_PROVIDER == 'anthropic':
            import anthropic
            return anthropic.AsyncAnthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        elif LLM_PROVIDER == 'openai':
            from openai import AsyncOpenAI
            return AsyncOpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        else:
            raise ValueError(f"Unsupported LLM provider: {LLM_PROVIDER}")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def analyze(self, error_message: str, stack_trace: Optional[str],
                       logs: Optional[str], code_chunks: List[Dict]) -> Dict:
        context = self._build_context(code_chunks)
        prompt = self._build_prompt(error_message, stack_trace, logs, context)

        if LLM_PROVIDER == 'anthropic':
            response = await self.client.messages.create(
                model=LLM_MODEL,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.content[0].text
        else:
            response = await self.client.chat.completions.create(
                model=LLM_MODEL,
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
            )
            raw = response.choices[0].message.content

        return self._parse_response(raw)

    def _build_context(self, chunks: List[Dict]) -> str:
        parts = []
        for c in chunks:
            parts.append(
                f"### File: `{c['filePath']}` (lines {c['startLine']}-{c['endLine']}, score: {c['score']})\n"
                f"```{c['language']}\n{c['content']}\n```"
            )
        return '\n\n'.join(parts)

    def _build_prompt(self, error_message, stack_trace, logs, context) -> str:
        return f"""Analyze the following bug using the provided code context.

## Error Message
```
{error_message}
```

## Stack Trace
```
{stack_trace or 'Not provided'}
```

## Logs
```
{logs or 'Not provided'}
```

## Relevant Code (retrieved via semantic search)
{context}

Respond ONLY with a valid JSON object in this exact format:
{{
  "analysis": {{
    "rootCause": "One clear sentence describing the root cause",
    "explanation": "Detailed explanation of why the bug occurs and how it manifests",
    "suggestedFix": "Clear description of what needs to be changed and why",
    "affectedFiles": ["list", "of", "file", "paths"],
    "confidence": 0.85
  }},
  "patch": "A valid unified diff git patch that fixes the bug. Must start with 'diff --git'. If you cannot generate a patch, use null."
}}"""

    def _parse_response(self, raw: str) -> Dict:
        # Strip markdown code fences if present
        raw = raw.strip()
        if raw.startswith('```'):
            raw = raw.split('\n', 1)[1]
            if raw.endswith('```'):
                raw = raw.rsplit('```', 1)[0]

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: extract JSON from prose
            import re
            match = re.search(r'\{[\s\S]*\}', raw)
            if match:
                return json.loads(match.group())
            raise ValueError(f"Could not parse LLM response as JSON: {raw[:200]}")


SYSTEM_PROMPT = """You are an expert software debugger and code analyst. Your role is to:
1. Analyze bugs from error messages, stack traces, and relevant source code
2. Identify the precise root cause with high accuracy
3. Generate a working git patch (unified diff format) that fixes the issue
4. Be concise, accurate, and actionable

Always respond with valid JSON only. No prose before or after the JSON object.
When generating patches, ensure they are syntactically valid unified diff format.
"""
