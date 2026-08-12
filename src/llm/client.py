import os
from abc import ABC, abstractmethod

from dotenv import load_dotenv
from google import genai


load_dotenv()


class LLMClient(ABC):
    """Interface for prerequisite reasoning LLMs."""

    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass


class MockLLMClient(LLMClient):
    """Mock LLM client for development and testing."""

    def generate(self, prompt: str) -> str:
        return """
[
  {
    "source": "C_002",
    "target": "C_001",
    "relationship": "PREREQUISITE_OF",
    "confidence": 0.95,
    "reason": "A student needs to understand data types to determine what kind of value a variable can store.",
    "validation_status": "PENDING"
  },
  {
    "source": "C_002",
    "target": "C_003",
    "relationship": "PREREQUISITE_OF",
    "confidence": 0.90,
    "reason": "Operators operate on values whose types determine how the operations behave.",
    "validation_status": "PENDING"
  },
  {
    "source": "C_003",
    "target": "C_004",
    "relationship": "PREREQUISITE_OF",
    "confidence": 0.91,
    "reason": "Conditional expressions rely on operators used to compare or combine values.",
    "validation_status": "PENDING"
  }
]
"""


class GeminiClient(LLMClient):
    """Gemini implementation of the LLM client."""

    def __init__(self, model="gemini-3.6-flash"):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set."
            )

        self.client = genai.Client(
            api_key=api_key
        )

        self.model = model

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt
        )

        return response.text