"""
Animation Routes for PhotoVault
Handles photo animation effects and animated GIF creation
"""
import os
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from photovault.models import Photo
from photovault.extensions import db, csrf
from werkzeug.utils import secure_filename
from datetime import datetime
import random

logger = logging.getLogger(__name__)

# Create blueprint
animation_bp = Blueprint('animation', __name__, url_prefix='/api/animation')

@animation_bp.route('/create-gif', methods=['POST'])
@login_required
def create_animated_gif():
    """
    Create an animated GIF from a photo with various animation effects
    
    Request JSON:
        {
            "photo_id": int,
            "animation_type": str,  # kenburns, fadeinout, slideshow, parallax, vintage
            "duration": float,      # Duration in seconds
            "speed": float          # Speed multiplier
        }
    
    Returns:
        {
            "success": bool,
            "gif_url": str,
            "filename": str,
            "message": str
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'photo_id' not in data:
            return jsonify({
                'success': False,
                'error': 'photo_id is required'
            }), 400
        
        photo_id = data['photo_id']
        animation_type = data.get('animation_type', 'kenburns')
        duration = float(data.get('duration', 3.0))
        speed = float(data.get('speed', 1.0))
        
        # Validate animation type
        valid_types = ['kenburns', 'fadeinout', 'slideshow', 'parallax', 'vintage']
        if animation_type not in valid_types:
            return jsonify({
                'success': False,
                'error': f'Invalid animation type. Must be one of: {", ".join(valid_types)}'
            }), 400
        
        # Get photo from database
        photo = Photo.query.filter_by(id=photo_id, user_id=current_user.id).first()
        
        if not photo:
            return jsonify({
                'success': False,
                'error': 'Photo not found or unauthorized'
            }), 404
        
        # Get file path
        original_path = photo.file_path
        
        if not os.path.exists(original_path):
            return jsonify({
                'success': False,
                'error': 'Original photo file not found'
            }), 404
        
        # Generate GIF filename
        date = datetime.now().strftime('%Y%m%d')
        random_number = random.randint(100000, 999999)
        safe_username = secure_filename(current_user.username)
        gif_filename = f"{safe_username}.{date}.anim.{animation_type}.{random_number}.gif"
        
        # Create user folder
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'photovault/uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        gif_path = os.path.join(user_folder, gif_filename)
        
        logger.info(f"Creating animated GIF for photo {photo_id}: type={animation_type}, duration={duration}, speed={speed}")
        
        # Import animation utility
        from photovault.utils.animation import PhotoAnimator
        animator = PhotoAnimator()
        
        # Create animated GIF
        try:
            result_path = animator.create_animated_gif(
                original_path,
                gif_path,
                animation_type=animation_type,
                duration=duration,
                speed=speed
            )
            
            # Generate URL for the GIF
            from flask import url_for
            gif_url = url_for('gallery.uploaded_file', 
                            user_id=current_user.id, 
                            filename=gif_filename,
                            _external=False)
            
            logger.info(f"Animated GIF created successfully: {result_path}")
            
            return jsonify({
                'success': True,
                'gif_url': gif_url,
                'filename': gif_filename,
                'message': f'{animation_type.title()} animation created successfully!'
            }), 200
            
        except Exception as e:
            logger.error(f"Error creating animated GIF: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Animation creation failed: {str(e)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Unexpected error in create_animated_gif: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
