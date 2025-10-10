"""
Mobile API Routes for StoryKeep iOS/Android App
"""
from flask import Blueprint, jsonify, request, current_app, url_for
from photovault.models import Photo, UserSubscription, FamilyVault, FamilyMember, User
from photovault.extensions import db, csrf
from photovault.utils.jwt_auth import token_required
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import os
import uuid
from datetime import datetime, timedelta
from PIL import Image
import logging
import jwt
import re

logger = logging.getLogger(__name__)
mobile_api_bp = Blueprint('mobile_api', __name__, url_prefix='/api')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@mobile_api_bp.route('/auth/login', methods=['POST'])
@csrf.exempt
def mobile_login():
    """Mobile app login endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Support both email and username for login
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email or username
        user = User.query.filter(
            (User.email == email) | (User.username == email)
        ).first()
        
        if not user or not check_password_hash(user.password_hash, password):
            logger.warning(f"Failed login attempt for: {email}")
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        logger.info(f"Successful mobile login for user: {user.username}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Mobile login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login'}), 500

@mobile_api_bp.route('/auth/register', methods=['POST'])
@csrf.exempt
def mobile_register():
    """Mobile app registration endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        # Validation
        if not username or not email or not password:
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            if existing_user.username == username:
                return jsonify({'error': 'Username already exists'}), 400
            else:
                return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        new_user = User()
        new_user.username = username
        new_user.email = email
        new_user.password_hash = generate_password_hash(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': new_user.id,
            'username': new_user.username,
            'exp': datetime.utcnow() + timedelta(days=30)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')
        
        logger.info(f"New mobile user registered: {username}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Mobile registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration'}), 500

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
            # Get thumbnail filename from path
            thumbnail_filename = os.path.basename(photo.thumbnail_path) if photo.thumbnail_path else photo.filename
            
            photo_data = {
                'id': photo.id,
                'filename': photo.filename,
                'url': url_for('gallery.uploaded_file', 
                             user_id=current_user.id, 
                             filename=photo.filename, 
                             _external=True),
                'thumbnail_url': url_for('gallery.uploaded_file',
                                       user_id=current_user.id,
                                       filename=thumbnail_filename,
                                       _external=True),
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
        if not file.filename:
            return jsonify({'error': 'Invalid filename'}), 400
            
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{current_user.id}_{uuid.uuid4().hex[:12]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
        
        # Save file
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        filepath = os.path.join(user_folder, unique_filename)
        file.save(filepath)
        
        # Create thumbnail
        thumbnail_filename = f"thumb_{unique_filename}"
        thumbnail_path = os.path.join(user_folder, thumbnail_filename)
        try:
            img = Image.open(filepath)
            img.thumbnail((300, 300))
            img.save(thumbnail_path)
        except Exception as e:
            logger.error(f"Thumbnail creation failed: {e}")
            thumbnail_path = filepath
        
        # Create photo record
        photo = Photo()
        photo.user_id = current_user.id
        photo.filename = unique_filename
        photo.original_name = file.filename
        photo.file_path = filepath
        photo.thumbnail_path = thumbnail_path
        photo.file_size = file_size
        photo.upload_source = 'mobile_camera'
        
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
                                       filename=os.path.basename(thumbnail_path),
                                       _external=True)
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Upload failed'}), 500

@mobile_api_bp.route('/detect-and-extract', methods=['POST'])
@csrf.exempt
@token_required
def detect_and_extract_photos(current_user):
    """Detect and extract photos from uploaded image (digitizer functionality)"""
    try:
        from photovault.utils.photo_detection import PhotoDetector
        
        logger.info(f"Photo detection request from user: {current_user.id}")
        
        # Check if request has JSON data
        if not request.json:
            return jsonify({'error': 'Invalid request format, JSON expected'}), 400
        
        # Check if photo_id was provided
        if 'photo_id' not in request.json:
            return jsonify({'error': 'No photo_id provided'}), 400
        
        photo_id = request.json['photo_id']
        
        # Get the original photo
        photo = Photo.query.filter_by(id=photo_id, user_id=current_user.id).first()
        if not photo:
            return jsonify({'error': 'Photo not found'}), 404
        
        # Initialize detector
        detector = PhotoDetector()
        
        # Detect photos in the image
        detected = detector.detect_photos(photo.file_path)
        
        if not detected or len(detected) == 0:
            return jsonify({
                'success': True,
                'message': 'No photos detected',
                'extracted_photos': []
            })
        
        # Extract detected photos using the extract_photos method
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        # Use the extract_photos method which handles all extractions at once
        extracted_files = detector.extract_photos(photo.file_path, user_folder, detected)
        
        extracted_photos = []
        
        for i, extracted_file in enumerate(extracted_files):
            try:
                extracted_path = extracted_file['file_path']
                
                # Create thumbnail
                thumbnail_filename = f"thumb_{os.path.basename(extracted_path)}"
                thumbnail_path = os.path.join(user_folder, thumbnail_filename)
                try:
                    img = Image.open(extracted_path)
                    img.thumbnail((300, 300))
                    img.save(thumbnail_path)
                except Exception as e:
                    logger.error(f"Thumbnail creation failed: {e}")
                    thumbnail_path = extracted_path
                
                # Get file size
                extracted_size = os.path.getsize(extracted_path)
                
                # Create new photo record following the correct pattern
                extracted_photo = Photo()
                extracted_photo.user_id = current_user.id
                extracted_photo.filename = os.path.basename(extracted_path)
                extracted_photo.original_name = f"extracted_{i}_from_{photo.original_name}"
                extracted_photo.file_path = extracted_path
                extracted_photo.thumbnail_path = thumbnail_path
                extracted_photo.file_size = extracted_size
                extracted_photo.upload_source = 'digitizer'
                
                db.session.add(extracted_photo)
                db.session.commit()
                
                extracted_photos.append({
                    'id': extracted_photo.id,
                    'filename': extracted_photo.filename,
                    'confidence': extracted_file.get('confidence', 0),
                    'url': url_for('gallery.uploaded_file',
                                 user_id=current_user.id,
                                 filename=extracted_photo.filename,
                                 _external=True),
                    'thumbnail_url': url_for('gallery.uploaded_file',
                                           user_id=current_user.id,
                                           filename=thumbnail_filename,
                                           _external=True)
                })
                
            except Exception as extract_error:
                logger.error(f"Error processing extracted photo {i}: {extract_error}")
                continue
        
        logger.info(f"Extracted {len(extracted_photos)} photos from image {photo_id}")
        
        return jsonify({
            'success': True,
            'message': f'Successfully extracted {len(extracted_photos)} photos',
            'total_detected': len(detected),
            'extracted_photos': extracted_photos
        }), 200
        
    except Exception as e:
        logger.error(f"Photo detection error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Photo detection failed'}), 500

@mobile_api_bp.route('/family/vaults', methods=['GET'])
@token_required
def get_family_vaults(current_user):
    """Get user's family vaults for mobile app"""
    try:
        # Get vaults created by user
        created_vaults = FamilyVault.query.filter_by(created_by=current_user.id).all()
        
        # Get vaults user is a member of
        member_vaults = db.session.query(FamilyVault).join(FamilyMember).filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.status == 'active'
        ).all()
        
        # Combine and deduplicate
        all_vaults = list({v.id: v for v in created_vaults + member_vaults}.values())
        
        # Build response
        vaults_list = []
        for vault in all_vaults:
            vault_data = {
                'id': vault.id,
                'name': vault.name,
                'description': vault.description,
                'vault_code': vault.vault_code,
                'is_public': vault.is_public,
                'created_at': vault.created_at.isoformat() if vault.created_at else None,
                'is_creator': vault.created_by == current_user.id,
                'member_role': vault.get_member_role(current_user.id) if hasattr(vault, 'get_member_role') else 'member'
            }
            vaults_list.append(vault_data)
        
        return jsonify({
            'success': True,
            'vaults': vaults_list
        })
        
    except Exception as e:
        logger.error(f"Error fetching family vaults: {str(e)}")
        return jsonify({'error': str(e)}), 500

@mobile_api_bp.route('/family/vault/<int:vault_id>', methods=['GET'])
@token_required
def get_vault_detail(current_user, vault_id):
    """Get vault details for mobile app"""
    try:
        from photovault.models import VaultPhoto
        
        # Get vault
        vault = FamilyVault.query.get(vault_id)
        if not vault:
            return jsonify({'error': 'Vault not found'}), 404
        
        # Check if user has access
        has_access = (vault.created_by == current_user.id or 
                     vault.has_member(current_user.id) if hasattr(vault, 'has_member') else False)
        
        if not has_access:
            return jsonify({'error': 'Access denied'}), 403
        
        # Get vault photos
        vault_photos = VaultPhoto.query.filter_by(vault_id=vault_id).order_by(VaultPhoto.shared_at.desc()).all()
        
        # Get vault members
        members = FamilyMember.query.filter_by(vault_id=vault_id, status='active').all()
        
        # Build response
        photos_list = []
        for vp in vault_photos:
            photo = vp.photo if hasattr(vp, 'photo') else None
            if photo:
                photos_list.append({
                    'id': photo.id,
                    'filename': photo.filename,
                    'url': url_for('gallery.uploaded_file',
                                 user_id=photo.user_id,
                                 filename=photo.filename,
                                 _external=True),
                    'thumbnail_url': url_for('gallery.uploaded_file',
                                           user_id=photo.user_id,
                                           filename=photo.thumbnail_filename,
                                           _external=True) if photo.thumbnail_filename else None,
                    'shared_at': vp.shared_at.isoformat() if vp.shared_at else None
                })
        
        members_list = []
        for member in members:
            user = member.user if hasattr(member, 'user') else None
            if user:
                members_list.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': member.role,
                    'joined_at': member.joined_at.isoformat() if member.joined_at else None
                })
        
        return jsonify({
            'success': True,
            'vault': {
                'id': vault.id,
                'name': vault.name,
                'description': vault.description,
                'vault_code': vault.vault_code,
                'is_public': vault.is_public,
                'created_at': vault.created_at.isoformat() if vault.created_at else None,
                'is_creator': vault.created_by == current_user.id,
                'member_role': vault.get_member_role(current_user.id) if hasattr(vault, 'get_member_role') else 'member'
            },
            'photos': photos_list,
            'members': members_list
        })
        
    except Exception as e:
        logger.error(f"Error fetching vault details: {str(e)}")
        return jsonify({'error': str(e)}), 500
