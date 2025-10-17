"""
Photo Animation Utilities
Provides local motion effects for animating static photos:
- Ken Burns Effect: Classic zoom and pan animation
- Parallax 3D: Depth-based layered movement
- Cinemagraph: Subtle motion effect

All effects output MP4 videos compatible with web, iOS, and Android.
"""

import cv2
import numpy as np
from PIL import Image
import logging
import os
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class PhotoAnimator:
    """Handles photo animation effects using OpenCV"""
    
    def __init__(self):
        self.default_fps = 30
        self.default_duration = 5  # seconds
        
    def ken_burns_effect(
        self, 
        input_path: str, 
        output_path: str,
        duration: int = 5,
        zoom_direction: str = 'in',  # 'in' or 'out'
        pan_direction: str = 'center'  # 'center', 'left', 'right', 'up', 'down'
    ) -> bool:
        """
        Create Ken Burns zoom/pan effect
        
        Args:
            input_path: Path to input image
            output_path: Path to save MP4 video
            duration: Video duration in seconds
            zoom_direction: 'in' for zoom in, 'out' for zoom out
            pan_direction: Direction to pan while zooming
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"🎬 Creating Ken Burns effect: {zoom_direction} zoom with {pan_direction} pan")
            
            # Read image
            img = cv2.imread(input_path)
            if img is None:
                logger.error(f"Failed to read image: {input_path}")
                return False
                
            height, width = img.shape[:2]
            total_frames = duration * self.default_fps
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Define video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, self.default_fps, (width, height))
            
            # Validate VideoWriter opened successfully
            if not out.isOpened():
                logger.error(f"Failed to open VideoWriter for: {output_path}")
                return False
            
            # Calculate zoom and pan parameters
            if zoom_direction == 'in':
                start_scale = 1.0
                end_scale = 1.3  # 30% zoom in
            else:
                start_scale = 1.3
                end_scale = 1.0
                
            # Pan offsets based on direction
            pan_offsets = {
                'center': (0, 0),
                'left': (-0.1, 0),
                'right': (0.1, 0),
                'up': (0, -0.1),
                'down': (0, 0.1)
            }
            pan_x, pan_y = pan_offsets.get(pan_direction, (0, 0))
            
            # Generate frames
            for frame_num in range(total_frames):
                # Calculate current scale
                progress = frame_num / total_frames
                current_scale = start_scale + (end_scale - start_scale) * progress
                
                # Calculate pan offset
                current_pan_x = pan_x * progress * width
                current_pan_y = pan_y * progress * height
                
                # Calculate crop region
                new_width = int(width / current_scale)
                new_height = int(height / current_scale)
                
                # Center point with pan offset
                center_x = width // 2 + int(current_pan_x)
                center_y = height // 2 + int(current_pan_y)
                
                # Crop coordinates
                x1 = max(0, center_x - new_width // 2)
                y1 = max(0, center_y - new_height // 2)
                x2 = min(width, x1 + new_width)
                y2 = min(height, y1 + new_height)
                
                # Crop and resize
                cropped = img[y1:y2, x1:x2]
                frame = cv2.resize(cropped, (width, height), interpolation=cv2.INTER_LINEAR)
                
                out.write(frame)
            
            out.release()
            logger.info(f"✅ Ken Burns effect created: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Ken Burns effect failed: {str(e)}")
            return False
    
    def parallax_3d_effect(
        self,
        input_path: str,
        output_path: str,
        duration: int = 5,
        intensity: float = 0.05
    ) -> bool:
        """
        Create parallax 3D depth effect
        Uses edge detection to create depth layers and animate them
        
        Args:
            input_path: Path to input image
            output_path: Path to save MP4 video
            duration: Video duration in seconds
            intensity: Movement intensity (0.0 to 0.1)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"🌊 Creating Parallax 3D effect with intensity {intensity}")
            
            # Read image
            img = cv2.imread(input_path)
            if img is None:
                logger.error(f"Failed to read image: {input_path}")
                return False
                
            height, width = img.shape[:2]
            total_frames = duration * self.default_fps
            
            # Create depth map using edge detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            
            # Blur edges to create depth layers
            depth_map = cv2.GaussianBlur(edges, (21, 21), 0)
            depth_map = depth_map.astype(float) / 255.0
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Define video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, self.default_fps, (width, height))
            
            # Validate VideoWriter opened successfully
            if not out.isOpened():
                logger.error(f"Failed to open VideoWriter for: {output_path}")
                return False
            
            # Generate frames with parallax movement
            for frame_num in range(total_frames):
                # Create sinusoidal movement
                progress = frame_num / total_frames * 2 * np.pi
                offset_x = np.sin(progress) * intensity * width
                offset_y = np.cos(progress * 0.5) * intensity * height
                
                # Create transformation matrix for each layer
                frame = np.zeros_like(img)
                
                # Split into 3 depth layers
                for layer in range(3):
                    layer_depth = layer / 2.0  # 0, 0.5, 1.0
                    layer_offset_x = offset_x * layer_depth
                    layer_offset_y = offset_y * layer_depth
                    
                    # Create mask for this depth layer
                    mask_threshold = layer / 3.0
                    layer_mask = ((depth_map >= mask_threshold) & (depth_map < mask_threshold + 0.33)).astype(np.uint8)
                    
                    # Apply parallax shift
                    M = np.float32([[1, 0, layer_offset_x], [0, 1, layer_offset_y]])
                    shifted = cv2.warpAffine(img, M, (width, height))
                    
                    # Blend layer
                    for c in range(3):
                        frame[:, :, c] = np.where(layer_mask > 0, shifted[:, :, c], frame[:, :, c])
                
                # Fill empty areas with original image
                empty_mask = (frame.sum(axis=2) == 0)
                for c in range(3):
                    frame[:, :, c] = np.where(empty_mask, img[:, :, c], frame[:, :, c])
                
                out.write(frame.astype(np.uint8))
            
            out.release()
            logger.info(f"✅ Parallax 3D effect created: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Parallax 3D effect failed: {str(e)}")
            return False
    
    def cinemagraph_effect(
        self,
        input_path: str,
        output_path: str,
        duration: int = 5,
        motion_area: str = 'center',  # 'center', 'top', 'bottom', 'left', 'right'
        motion_type: str = 'wave'  # 'wave', 'shimmer', 'pulse'
    ) -> bool:
        """
        Create cinemagraph effect - subtle motion in one area
        
        Args:
            input_path: Path to input image
            output_path: Path to save MP4 video
            duration: Video duration in seconds
            motion_area: Area where motion occurs
            motion_type: Type of motion effect
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"✨ Creating Cinemagraph effect: {motion_type} in {motion_area}")
            
            # Read image
            img = cv2.imread(input_path)
            if img is None:
                logger.error(f"Failed to read image: {input_path}")
                return False
                
            height, width = img.shape[:2]
            total_frames = duration * self.default_fps
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Create motion mask based on area
            motion_mask = np.zeros((height, width), dtype=np.float32)
            
            if motion_area == 'center':
                center_x, center_y = width // 2, height // 2
                radius = min(width, height) // 4
                Y, X = np.ogrid[:height, :width]
                dist_from_center = np.sqrt((X - center_x)**2 + (Y - center_y)**2)
                motion_mask = np.clip(1 - dist_from_center / radius, 0, 1)
                
            elif motion_area == 'top':
                motion_mask[:height//3, :] = 1.0
                # Feather edge
                motion_mask[height//3:height//2, :] = np.linspace(1, 0, height//6)[:, np.newaxis]
                
            elif motion_area == 'bottom':
                motion_mask[2*height//3:, :] = 1.0
                # Feather edge
                motion_mask[height//2:2*height//3, :] = np.linspace(0, 1, height//6)[:, np.newaxis]
                
            elif motion_area == 'left':
                motion_mask[:, :width//3] = 1.0
                # Feather edge
                motion_mask[:, width//3:width//2] = np.linspace(1, 0, width//6)[np.newaxis, :]
                
            elif motion_area == 'right':
                motion_mask[:, 2*width//3:] = 1.0
                # Feather edge
                motion_mask[:, width//2:2*width//3] = np.linspace(0, 1, width//6)[np.newaxis, :]
            
            # Define video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, self.default_fps, (width, height))
            
            # Validate VideoWriter opened successfully
            if not out.isOpened():
                logger.error(f"Failed to open VideoWriter for: {output_path}")
                return False
            
            # Generate frames
            for frame_num in range(total_frames):
                progress = frame_num / total_frames * 2 * np.pi
                
                # Create motion effect
                if motion_type == 'wave':
                    # Sinusoidal wave motion
                    offset = np.sin(progress) * 10 * motion_mask
                    M = np.float32([[1, 0, offset.mean()], [0, 1, 0]])
                    motion_img = cv2.warpAffine(img, M, (width, height))
                    
                elif motion_type == 'shimmer':
                    # Brightness shimmer
                    brightness = 1.0 + np.sin(progress) * 0.15 * motion_mask[:, :, np.newaxis]
                    motion_img = np.clip(img * brightness, 0, 255).astype(np.uint8)
                    
                elif motion_type == 'pulse':
                    # Scale pulsing
                    scale = 1.0 + np.sin(progress) * 0.05
                    center_x, center_y = width // 2, height // 2
                    M = cv2.getRotationMatrix2D((center_x, center_y), 0, scale)
                    motion_img = cv2.warpAffine(img, M, (width, height))
                else:
                    motion_img = img.copy()
                
                # Blend motion area with static image
                motion_mask_3ch = motion_mask[:, :, np.newaxis]
                frame = (motion_img * motion_mask_3ch + img * (1 - motion_mask_3ch)).astype(np.uint8)
                
                out.write(frame)
            
            out.release()
            logger.info(f"✅ Cinemagraph effect created: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Cinemagraph effect failed: {str(e)}")
            return False
    
    def create_animation(
        self,
        input_path: str,
        output_path: str,
        effect_type: str,
        settings: dict = None
    ) -> Tuple[bool, str]:
        """
        Main method to create animation with specified effect
        
        Args:
            input_path: Path to input image
            output_path: Path to save MP4 video
            effect_type: Type of effect ('ken_burns', 'parallax', 'cinemagraph')
            settings: Optional settings dict for the effect
            
        Returns:
            Tuple[bool, str]: (success, message)
        """
        if settings is None:
            settings = {}
        
        try:
            if effect_type == 'ken_burns':
                success = self.ken_burns_effect(
                    input_path,
                    output_path,
                    duration=settings.get('duration', 5),
                    zoom_direction=settings.get('zoom_direction', 'in'),
                    pan_direction=settings.get('pan_direction', 'center')
                )
                return success, "Ken Burns animation created" if success else "Failed to create Ken Burns animation"
                
            elif effect_type == 'parallax':
                success = self.parallax_3d_effect(
                    input_path,
                    output_path,
                    duration=settings.get('duration', 5),
                    intensity=settings.get('intensity', 0.05)
                )
                return success, "Parallax 3D animation created" if success else "Failed to create Parallax animation"
                
            elif effect_type == 'cinemagraph':
                success = self.cinemagraph_effect(
                    input_path,
                    output_path,
                    duration=settings.get('duration', 5),
                    motion_area=settings.get('motion_area', 'center'),
                    motion_type=settings.get('motion_type', 'wave')
                )
                return success, "Cinemagraph animation created" if success else "Failed to create Cinemagraph"
                
            else:
                return False, f"Unknown effect type: {effect_type}"
                
        except Exception as e:
            logger.error(f"Animation creation failed: {str(e)}")
            return False, f"Animation failed: {str(e)}"


# Singleton instance
animator = PhotoAnimator()
