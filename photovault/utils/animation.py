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


    def create_animated_gif(
        self,
        input_path: str,
        output_path: str,
        animation_type: str = 'kenburns',
        duration: float = 3.0,
        speed: float = 1.0
    ) -> str:
        """
        Create an animated GIF with various effects
        
        Args:
            input_path: Path to input image
            output_path: Path for output GIF
            animation_type: Type of animation (kenburns, fadeinout, slideshow, parallax, vintage, living)
            duration: Duration in seconds
            speed: Speed multiplier
            
        Returns:
            Path to created GIF
        """
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            import math
            
            logger.info(f"Creating {animation_type} GIF animation: duration={duration}s, speed={speed}x")
            
            # Load image
            img = Image.open(input_path)
            if img.mode not in ('RGB', 'P'):
                img = img.convert('RGB')
            
            # Calculate frames
            fps = max(5, int(10 * speed))
            total_frames = max(10, int(duration * fps))
            
            frames = []
            width, height = img.size
            
            # Generate frames based on animation type
            if animation_type == 'living':
                # Use FaceAnimator for living portrait effect
                from photovault.utils.face_animator import FaceAnimator
                face_animator = FaceAnimator()
                
                success = face_animator.create_living_portrait(
                    input_path,
                    output_path,
                    duration=int(duration),
                    smile_intensity=0.4,
                    movement_amount=0.3,
                    blink_enabled=True
                )
                
                if success:
                    logger.info(f"✅ Living portrait GIF created: {output_path}")
                    return output_path
                else:
                    raise Exception("Failed to create living portrait animation")
            else:
                # Standard animations
                for i in range(total_frames):
                    progress = i / total_frames
                    
                    if animation_type == 'kenburns':
                        frame = self._create_kenburns_frame(img, progress)
                    elif animation_type == 'fadeinout':
                        frame = self._create_fade_frame(img, progress)
                    elif animation_type == 'slideshow':
                        frame = self._create_slideshow_frame(img, progress, width, height)
                    elif animation_type == 'parallax':
                        frame = self._create_parallax_frame(img, progress, width, height)
                    elif animation_type == 'vintage':
                        frame = self._create_vintage_frame(img)
                    else:
                        frame = img.copy()
                    
                    frames.append(frame)
            
            # Save as animated GIF
            frame_duration = int(1000 / fps)
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=frame_duration,
                loop=0,
                optimize=True
            )
            
            logger.info(f"✅ Animated GIF created: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"❌ GIF creation failed: {str(e)}")
            raise
    
    def _create_kenburns_frame(self, img: Image.Image, progress: float) -> Image.Image:
        """Create a single Ken Burns frame"""
        width, height = img.size
        scale = 1.0 + (0.3 * progress)
        new_size = (int(width * scale), int(height * scale))
        scaled = img.resize(new_size, Image.Resampling.LANCZOS)
        
        left = (scaled.width - width) // 2
        top = (scaled.height - height) // 2
        pan_x = int((scaled.width - width) * 0.1 * progress)
        pan_y = int((scaled.height - height) * 0.1 * progress)
        
        return scaled.crop((left + pan_x, top + pan_y, left + pan_x + width, top + pan_y + height))
    
    def _create_fade_frame(self, img: Image.Image, progress: float) -> Image.Image:
        """Create a single fade frame"""
        opacity = 0.3 + 0.7 * abs((progress * 2) % 2 - 1)
        background = Image.new('RGB', img.size, (255, 255, 255))
        return Image.blend(background, img, opacity)
    
    def _create_slideshow_frame(self, img: Image.Image, progress: float, width: int, height: int) -> Image.Image:
        """Create a single slideshow frame"""
        slide_progress = (progress * 2) % 2
        if slide_progress > 1:
            slide_progress = 2 - slide_progress
        
        canvas_width = int(width * 1.2)
        canvas = Image.new('RGB', (canvas_width, height), (240, 240, 240))
        x_offset = int(width * 0.2 * slide_progress)
        canvas.paste(img, (x_offset, 0))
        return canvas.crop((0, 0, width, height))
    
    def _create_parallax_frame(self, img: Image.Image, progress: float, width: int, height: int) -> Image.Image:
        """Create a single parallax frame"""
        import math
        
        scale = 1.2
        scaled = img.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
        y_offset = int(20 * math.sin(progress * math.pi * 2))
        
        left = (scaled.width - width) // 2
        top = max(0, min((scaled.height - height) // 2 + y_offset, scaled.height - height))
        return scaled.crop((left, top, left + width, top + height))
    
    def _create_vintage_frame(self, img: Image.Image) -> Image.Image:
        """Create a single vintage film frame with jitter"""
        import random
        from PIL import ImageEnhance
        
        width, height = img.size
        canvas = Image.new('RGB', (width + 10, height + 10), (20, 15, 10))
        
        jitter_x = random.randint(-2, 2)
        jitter_y = random.randint(-2, 2)
        brightness_factor = 0.85 + random.random() * 0.3
        
        sepia_img = img.copy()
        enhancer = ImageEnhance.Color(sepia_img)
        sepia_img = enhancer.enhance(0.3)
        
        brightness_enhancer = ImageEnhance.Brightness(sepia_img)
        sepia_img = brightness_enhancer.enhance(brightness_factor)
        
        contrast_enhancer = ImageEnhance.Contrast(sepia_img)
        sepia_img = contrast_enhancer.enhance(1.2)
        
        canvas.paste(sepia_img, (5 + jitter_x, 5 + jitter_y))
        frame = canvas.crop((5, 5, 5 + width, 5 + height))
        
        if random.random() > 0.7:
            frame = frame.filter(ImageFilter.BLUR)
        
        return frame


# Singleton instance
animator = PhotoAnimator()
