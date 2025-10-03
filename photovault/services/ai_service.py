"""
AI Service for PhotoVault
Copyright (c) 2025 Calmic Sdn Bhd. All rights reserved.

Handles OpenAI integration for AI-powered image processing
"""

import os
import base64
import logging
from typing import Dict, Optional, Tuple
from PIL import Image
import io

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user
from openai import OpenAI

logger = logging.getLogger(__name__)

class AIService:
    """Handles AI-powered image processing using OpenAI"""
    
    def __init__(self):
        """Initialize AI service with OpenAI client"""
        self.api_key = os.environ.get('OPENAI_API_KEY')
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not found - AI features will be disabled")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("AI service initialized successfully")
    
    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.client is not None
    
    def encode_image(self, image_path: str) -> str:
        """
        Encode image to base64 for OpenAI API
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded image string
        """
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def colorize_image_ai(self, image_path: str, output_path: str) -> Tuple[str, Dict]:
        """
        Colorize black and white image using AI
        
        Args:
            image_path: Path to the input grayscale image
            output_path: Path to save the colorized image
            
        Returns:
            Tuple of (output_path, metadata_dict)
        """
        if not self.is_available():
            raise RuntimeError("AI service not available - OPENAI_API_KEY not configured")
        
        try:
            # Encode image
            base64_image = self.encode_image(image_path)
            
            # Request AI colorization guidance
            response = self.client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert photo colorization assistant. Analyze this black and white photo and provide detailed, realistic color suggestions for different elements in the image. Be specific about colors, tones, and natural appearances."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Please analyze this black and white photo and suggest realistic colors for the main elements. Provide your response as a detailed description of what colors should be applied to different parts of the image for a natural, realistic colorization."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_completion_tokens=1024
            )
            
            color_guidance = response.choices[0].message.content
            logger.info(f"AI colorization guidance generated: {len(color_guidance)} chars")
            
            # For now, we'll use the existing DNN colorization but store AI guidance
            # In a full implementation, you could use DALL-E or other image generation
            from photovault.utils.colorization import get_colorizer
            colorizer = get_colorizer()
            
            # Use DNN colorization if available, otherwise basic
            result_path, method = colorizer.colorize_image(image_path, output_path, method='auto')
            
            metadata = {
                'method': 'ai_guided_' + method,
                'ai_guidance': color_guidance,
                'model': 'gpt-5'
            }
            
            return result_path, metadata
            
        except Exception as e:
            logger.error(f"AI colorization failed: {e}")
            raise
    
    def enhance_image_ai(self, image_path: str) -> Dict:
        """
        Analyze image and provide AI-powered enhancement suggestions
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with enhancement suggestions
        """
        if not self.is_available():
            raise RuntimeError("AI service not available - OPENAI_API_KEY not configured")
        
        try:
            base64_image = self.encode_image(image_path)
            
            response = self.client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional photo restoration and enhancement expert. Analyze photos and provide specific, actionable suggestions for improvement. Respond in JSON format with: {'needs_enhancement': boolean, 'suggestions': [list of suggestions], 'priority': 'low'|'medium'|'high', 'issues': [list of detected issues]}"
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this photo and suggest enhancements. Identify issues like: low contrast, poor lighting, color fading, scratches, dust, blurriness, or any other quality problems. Provide specific enhancement suggestions."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_completion_tokens=1024
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            logger.info(f"AI enhancement analysis completed: {result.get('priority', 'unknown')} priority")
            
            return result
            
        except Exception as e:
            logger.error(f"AI enhancement analysis failed: {e}")
            raise
    
    def analyze_image(self, image_path: str) -> str:
        """
        Analyze image content and provide detailed description
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Detailed description of the image
        """
        if not self.is_available():
            raise RuntimeError("AI service not available - OPENAI_API_KEY not configured")
        
        try:
            base64_image = self.encode_image(image_path)
            
            response = self.client.chat.completions.create(
                model="gpt-5",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this photo in detail. Describe the content, setting, subjects, time period (if identifiable), and any notable elements. This will be used for photo organization and tagging."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_completion_tokens=512
            )
            
            analysis = response.choices[0].message.content
            logger.info(f"Image analysis completed: {len(analysis)} chars")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            raise


# Singleton instance
_ai_service = None

def get_ai_service() -> AIService:
    """Get or create singleton AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
