"""
Mobile API Routes for StoryKeep iOS/Android App
"""
from flask import Blueprint, jsonify, request, current_app, url_for
from photovault.models import Photo, UserSubscription
from photovault.extensions import db, csrf
from photovault.utils.jwt_auth import token_required
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from PIL import Image
import logging

logger = logging.getLogger(__name__)
mobile_api_bp = Blueprint('mobile_api', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@mobile_api_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    """Get dashboard statistics for mobile app"""
    try:
        # Calculate photo statistics
        total_photos = Photo.query.filter_by(user_id=current_user.id).count()
        
        # Calculate total storage
        photos = Photo.query.filter_by(user_id=current_user.id).all()
        total_size_bytes = sum(photo.file_size or 0 for photo in photos)
        total_size_mb = round(total_size_bytes / 1024 / 1024, 2) if total_size_bytes > 0 else 0
        
        # Get subscription info
        user_subscription = UserSubscription.query.filter_by(user_id=current_user.id).first()
        
        return jsonify({
            'stats': {
                'total_photos': total_photos,
                'total_albums': 0,  # TODO: Implement albums
                'storage_used': f'{total_size_mb} MB'
            },
            'user': {
                'username': current_user.username,
                'email': current_user.email,
                'subscription_plan': user_subscription.plan.name if user_subscription and user_subscription.plan else 'Free'
            }
        })
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@mobile_api_bp.route('/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile for mobile app"""
    try:
        user_subscription = UserSubscription.query.filter_by(user_id=current_user.id).first()
        
        return jsonify({
            'username': current_user.username,
            'email': current_user.email,
            'subscription_plan': user_subscription.plan.name if user_subscription and user_subscription.plan else 'Free'
        })
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@mobile_api_bp.route('/photos', methods=['GET'])
@token_required
def get_photos(current_user):
    """Get photos for mobile app gallery with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 20, type=int)
        
        # Query photos for current user
        photos_query = Photo.query.filter_by(user_id=current_user.id)\
            .order_by(Photo.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        # Build photo list with URLs
        photos_list = []
        for photo in photos_query.items:
            photo_data = {
                'id': photo.id,
                'filename': photo.filename,
                'url': url_for('gallery.uploaded_file', 
                             user_id=current_user.id, 
                             filename=photo.filename, 
                             _external=True),
                'thumbnail_url': url_for('gallery.uploaded_file',
                                       user_id=current_user.id,
                                       filename=photo.thumbnail_filename,
                                       _external=True) if photo.thumbnail_filename else None,
                'created_at': photo.created_at.isoformat(),
                'file_size': photo.file_size,
                'has_edited': photo.edited_filename is not None
            }
            
            # Include edited version if available
            if photo.edited_filename:
                photo_data['edited_url'] = url_for('gallery.uploaded_file',
                                                  user_id=current_user.id,
                                                  filename=photo.edited_filename,
                                                  _external=True)
            
            photos_list.append(photo_data)
        
        return jsonify({
            'success': True,
            'photos': photos_list,
            'page': page,
            'per_page': per_page,
            'total': photos_query.total,
            'has_more': photos_query.has_next
        })
        
    except Exception as e:
        logger.error(f"Error fetching photos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@mobile_api_bp.route('/upload', methods=['POST'])
@csrf.exempt
@token_required
def upload_photo(current_user):
    """Upload photo from mobile app with photo detection support"""
    try:
        logger.info(f"Mobile upload from user: {current_user.id}")
        
        # Check if file was provided
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo provided'}), 400
        
        file = request.files['photo']
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Check file size
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': 'File too large (max 50MB)'}), 400
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save file
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        filepath = os.path.join(user_folder, unique_filename)
        file.save(filepath)
        
        # Create thumbnail
        try:
            img = Image.open(filepath)
            img.thumbnail((300, 300))
            thumbnail_filename = f"thumb_{unique_filename}"
            thumbnail_path = os.path.join(user_folder, thumbnail_filename)
            img.save(thumbnail_path)
        except Exception as e:
            logger.error(f"Thumbnail creation failed: {e}")
            thumbnail_filename = unique_filename
        
        # Create photo record
        photo = Photo(
            user_id=current_user.id,
            filename=unique_filename,
            thumbnail_filename=thumbnail_filename,
            file_size=file_size,
            upload_source='mobile_camera'
        )
        
        db.session.add(photo)
        db.session.commit()
        
        logger.info(f"Photo uploaded successfully: {photo.id}")
        
        return jsonify({
            'success': True,
            'photo': {
                'id': photo.id,
                'filename': photo.filename,
                'url': url_for('gallery.uploaded_file',
                             user_id=current_user.id,
                             filename=photo.filename,
                             _external=True),
                'thumbnail_url': url_for('gallery.uploaded_file',
                                       user_id=current_user.id,
                                       filename=thumbnail_filename,
                                       _external=True)
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Upload failed'}), 500
