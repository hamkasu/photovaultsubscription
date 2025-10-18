"""
Facial Animation Utilities
Creates living portrait animations using MediaPipe face detection
and morphing techniques to add smiles and subtle movements.
"""

import cv2
import numpy as np
from PIL import Image
import logging
from typing import Tuple, Optional, List
import mediapipe as mp

logger = logging.getLogger(__name__)


class FaceAnimator:
    """Handles facial animation effects using MediaPipe and morphing"""
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Key landmark indices for facial features
        self.LIPS_INDICES = [
            61, 146, 91, 181, 84, 17, 314, 405, 321, 375,
            291, 409, 270, 269, 267, 0, 37, 39, 40, 185
        ]
        self.LEFT_EYE_INDICES = [
            33, 7, 163, 144, 145, 153, 154, 155, 133,
            173, 157, 158, 159, 160, 161, 246
        ]
        self.RIGHT_EYE_INDICES = [
            263, 249, 390, 373, 374, 380, 381, 382, 362,
            398, 384, 385, 386, 387, 388, 466
        ]
        
    def detect_face_landmarks(self, image: np.ndarray) -> Optional[List]:
        """
        Detect facial landmarks using MediaPipe
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            List of face landmarks or None if no face detected
        """
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            with self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5
            ) as face_mesh:
                results = face_mesh.process(rgb_image)
                
                if results.multi_face_landmarks:
                    return results.multi_face_landmarks[0]
                return None
                
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return None
    
    def create_smile(
        self,
        landmarks,
        image_shape: Tuple[int, int],
        intensity: float = 0.3
    ) -> np.ndarray:
        """
        Generate smile transformation map
        
        Args:
            landmarks: MediaPipe face landmarks
            image_shape: (height, width) of image
            intensity: Smile intensity (0.0 to 1.0)
            
        Returns:
            Flow map for morphing image to smile
        """
        h, w = image_shape
        flow_x = np.zeros((h, w), dtype=np.float32)
        flow_y = np.zeros((h, w), dtype=np.float32)
        
        # Get mouth corner landmarks
        mouth_left = landmarks.landmark[61]   # Left mouth corner
        mouth_right = landmarks.landmark[291]  # Right mouth corner
        mouth_top = landmarks.landmark[13]     # Upper lip center
        mouth_bottom = landmarks.landmark[14]  # Lower lip center
        
        # Convert to pixel coordinates
        ml_x, ml_y = int(mouth_left.x * w), int(mouth_left.y * h)
        mr_x, mr_y = int(mouth_right.x * w), int(mouth_right.y * h)
        mt_x, mt_y = int(mouth_top.x * w), int(mouth_top.y * h)
        mb_x, mb_y = int(mouth_bottom.x * w), int(mouth_bottom.y * h)
        
        # Calculate smile transformation
        # Pull mouth corners up and out
        mouth_center_x = (ml_x + mr_x) // 2
        mouth_center_y = (ml_y + mr_y) // 2
        
        # Create radial smile effect around mouth
        y_coords, x_coords = np.mgrid[0:h, 0:w]
        
        # Distance from mouth center
        dx = x_coords - mouth_center_x
        dy = y_coords - mouth_center_y
        distance = np.sqrt(dx**2 + dy**2)
        
        # Smile radius (affects area around mouth)
        smile_radius = int(np.sqrt((mr_x - ml_x)**2 + (mr_y - ml_y)**2))
        
        # Gaussian falloff for natural transition
        sigma = smile_radius * 0.6
        influence = np.exp(-distance**2 / (2 * sigma**2))
        
        # Apply smile transformation
        # Lift corners up and slightly out
        angle_to_center = np.arctan2(dy, dx)
        lift_amount = intensity * 15 * influence  # pixels to lift
        spread_amount = intensity * 10 * influence  # pixels to spread
        
        # Vertical lift (mainly in mouth corner region)
        flow_y -= lift_amount * np.abs(np.cos(angle_to_center))
        
        # Horizontal spread (pulling corners outward)
        flow_x += spread_amount * np.sign(dx) * (1 - np.abs(np.sin(angle_to_center)))
        
        return np.stack([flow_x, flow_y], axis=-1)
    
    def create_blink(
        self,
        landmarks,
        image_shape: Tuple[int, int],
        closure: float = 0.7
    ) -> np.ndarray:
        """
        Generate eye blink transformation
        
        Args:
            landmarks: MediaPipe face landmarks
            image_shape: (height, width) of image
            closure: Eye closure amount (0.0 = open, 1.0 = closed)
            
        Returns:
            Flow map for eye blink effect
        """
        h, w = image_shape
        flow_x = np.zeros((h, w), dtype=np.float32)
        flow_y = np.zeros((h, w), dtype=np.float32)
        
        # Process both eyes
        for eye_indices in [self.LEFT_EYE_INDICES, self.RIGHT_EYE_INDICES]:
            # Get eye landmarks
            eye_points = [(int(landmarks.landmark[idx].x * w),
                          int(landmarks.landmark[idx].y * h))
                         for idx in eye_indices[:8]]  # Top half of eye
            
            if not eye_points:
                continue
            
            # Calculate eye center
            eye_center_x = sum(p[0] for p in eye_points) // len(eye_points)
            eye_center_y = sum(p[1] for p in eye_points) // len(eye_points)
            
            # Create eye blink effect
            y_coords, x_coords = np.mgrid[0:h, 0:w]
            dx = x_coords - eye_center_x
            dy = y_coords - eye_center_y
            distance = np.sqrt(dx**2 + dy**2)
            
            # Eye radius
            eye_radius = 20  # pixels
            sigma = eye_radius * 0.8
            influence = np.exp(-distance**2 / (2 * sigma**2))
            
            # Close eyelids (push pixels toward eye center vertically)
            close_amount = closure * 12 * influence
            flow_y += close_amount * np.sign(dy)
        
        return np.stack([flow_x, flow_y], axis=-1)
    
    def create_head_tilt(
        self,
        image_shape: Tuple[int, int],
        angle: float = 2.0
    ) -> np.ndarray:
        """
        Generate subtle head tilt transformation
        
        Args:
            image_shape: (height, width) of image
            angle: Tilt angle in degrees (small values for subtle effect)
            
        Returns:
            Flow map for head tilt
        """
        h, w = image_shape
        center_x, center_y = w // 2, h // 2
        
        # Create rotation matrix
        angle_rad = np.radians(angle)
        cos_a = np.cos(angle_rad)
        sin_a = np.sin(angle_rad)
        
        # Generate coordinate grids
        y_coords, x_coords = np.mgrid[0:h, 0:w]
        
        # Translate to origin
        x_centered = x_coords - center_x
        y_centered = y_coords - center_y
        
        # Apply rotation
        x_rotated = cos_a * x_centered - sin_a * y_centered
        y_rotated = sin_a * x_centered + cos_a * y_centered
        
        # Calculate displacement
        flow_x = x_rotated - x_centered
        flow_y = y_rotated - y_centered
        
        return np.stack([flow_x, flow_y], axis=-1)
    
    def apply_flow_warp(
        self,
        image: np.ndarray,
        flow: np.ndarray
    ) -> np.ndarray:
        """
        Apply optical flow warping to image
        
        Args:
            image: Input image
            flow: Flow map (H x W x 2)
            
        Returns:
            Warped image
        """
        h, w = image.shape[:2]
        
        # Create destination coordinates
        y_coords, x_coords = np.mgrid[0:h, 0:w].astype(np.float32)
        
        # Apply flow
        map_x = x_coords + flow[:, :, 0]
        map_y = y_coords + flow[:, :, 1]
        
        # Remap image
        warped = cv2.remap(
            image,
            map_x,
            map_y,
            interpolation=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        return warped
    
    def create_living_portrait(
        self,
        input_path: str,
        output_path: str,
        duration: int = 5,
        smile_intensity: float = 0.4,
        movement_amount: float = 0.3,
        blink_enabled: bool = True
    ) -> bool:
        """
        Create living portrait animation with smile and subtle movements
        
        Args:
            input_path: Path to input image
            output_path: Path to save animated GIF
            duration: Animation duration in seconds
            smile_intensity: Smile strength (0.0 to 1.0)
            movement_amount: Amount of head movement (0.0 to 1.0)
            blink_enabled: Enable eye blinking
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"🎭 Creating living portrait animation...")
            
            # Read image
            img = cv2.imread(input_path)
            if img is None:
                logger.error(f"Failed to read image: {input_path}")
                return False
            
            h, w = img.shape[:2]
            fps = 15  # Lower FPS for GIF
            total_frames = duration * fps
            
            # Detect face landmarks
            logger.info("🔍 Detecting facial landmarks...")
            landmarks = self.detect_face_landmarks(img)
            
            if landmarks is None:
                logger.warning("No face detected in image")
                return False
            
            logger.info(f"✅ Face detected with {len(landmarks.landmark)} landmarks")
            
            # Generate transformation maps
            smile_flow = self.create_smile(landmarks, (h, w), smile_intensity)
            
            # Create animation frames
            frames = []
            
            for frame_num in range(total_frames):
                progress = frame_num / total_frames
                
                # Smooth transitions using sine wave
                t = progress * 2 * np.pi
                
                # Smile animation (gradual smile that holds)
                if progress < 0.3:
                    # Gradually increase smile
                    smile_factor = np.sin(progress / 0.3 * np.pi / 2)
                else:
                    # Hold smile with subtle variation
                    smile_factor = 0.9 + 0.1 * np.sin(t * 2)
                
                current_smile_flow = smile_flow * smile_factor
                
                # Head tilt/sway
                tilt_angle = movement_amount * 3 * np.sin(t)
                tilt_flow = self.create_head_tilt((h, w), tilt_angle)
                
                # Combine flows
                combined_flow = current_smile_flow + tilt_flow * 0.3
                
                # Apply transformation
                frame = self.apply_flow_warp(img, combined_flow)
                
                # Add blink at specific intervals
                if blink_enabled and frame_num % (fps * 2) < 5:  # Blink every 2 seconds
                    blink_progress = (frame_num % (fps * 2)) / 5
                    if blink_progress < 0.5:
                        # Closing
                        closure = blink_progress * 2
                    else:
                        # Opening
                        closure = (1 - blink_progress) * 2
                    
                    blink_flow = self.create_blink(landmarks, (h, w), closure)
                    frame = self.apply_flow_warp(frame, blink_flow)
                
                # Convert to RGB for PIL
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(Image.fromarray(frame_rgb))
            
            # Save as animated GIF
            logger.info(f"💾 Saving animated GIF with {len(frames)} frames...")
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=int(1000 / fps),  # milliseconds per frame
                loop=0,
                optimize=False
            )
            
            logger.info(f"✅ Living portrait created: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating living portrait: {e}", exc_info=True)
            return False
