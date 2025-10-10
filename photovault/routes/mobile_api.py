"""
Mobile API Routes for StoryKeep iOS/Android App
"""
from flask import Blueprint, jsonify, request, current_app, url_for
from photovault.models import Photo, UserSubscription, FamilyVault, FamilyMember, User, VaultPhoto
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
        
        # Count enhanced photos (photos with edited_filename)
        enhanced_photos = Photo.query.filter_by(user_id=current_user.id).filter(
            Photo.edited_filename.isnot(None)
        ).count()
        
        # Calculate total storage
        photos = Photo.query.filter_by(user_id=current_user.id).all()
        total_size_bytes = sum(photo.file_size or 0 for photo in photos)
        total_size_mb = round(total_size_bytes / 1024 / 1024, 2) if total_size_bytes > 0 else 0
        
        # Get subscription info
        user_subscription = UserSubscription.query.filter_by(user_id=current_user.id).first()
        subscription_plan = user_subscription.plan.name if user_subscription and user_subscription.plan else 'Free'
        
        # Sort photos by creation date (newest first)
        sorted_photos = sorted(photos, key=lambda p: p.created_at if p.created_at else datetime.min, reverse=True)
        
        # Get one recent photo for diagnostic
        recent_photo = None
        if sorted_photos:
            photo = sorted_photos[0]
            recent_photo = {
                'id': photo.id,
                'filename': photo.filename,
                'original_url': f'/uploads/{current_user.id}/{photo.filename}' if photo.filename else None,
                'edited_url': f'/uploads/{current_user.id}/{photo.edited_filename}' if photo.edited_filename else None,
                'created_at': photo.created_at.isoformat() if photo.created_at else None
            }
        
        # Return ALL photos using same pattern for Gallery to use
        all_photos = []
        for photo in sorted_photos:
            all_photos.append({
                'id': photo.id,
                'filename': photo.filename,
                'url': f'/uploads/{current_user.id}/{photo.filename}' if photo.filename else None,
                'original_url': f'/uploads/{current_user.id}/{photo.filename}' if photo.filename else None,
                'edited_url': f'/uploads/{current_user.id}/{photo.edited_filename}' if photo.edited_filename else None,
                'created_at': photo.created_at.isoformat() if photo.created_at else None,
                'file_size': photo.file_size,
                'has_edited': photo.edited_filename is not None
            })
        
        return jsonify({
            'total_photos': total_photos,
            'enhanced_photos': enhanced_photos,
            'albums': 0,
            'storage_used': total_size_mb,
            'subscription_plan': subscription_plan,
            'recent_photo': recent_photo,
            'all_photos': all_photos,  # ALL photos for gallery
            'debug_photos_count': len(photos)
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
    """Get photos for mobile app gallery - USES SAME PATTERN AS DASHBOARD"""
    try:
        # Parse parameters
        page = max(1, request.args.get('page', 1, type=int))
        per_page = max(1, min(100, request.args.get('limit', 20, type=int)))
        filter_type = request.args.get('filter', 'all')
        
        # Get all photos for this user - SAME AS DASHBOARD
        all_photos = Photo.query.filter_by(user_id=current_user.id).all()
        
        # Apply filter if needed
        if filter_type == 'enhanced':
            filtered_photos = [p for p in all_photos if p.edited_filename is not None]
        elif filter_type == 'originals':
            filtered_photos = [p for p in all_photos if p.edited_filename is None]
        else:
            filtered_photos = all_photos
        
        # Sort by creation date (newest first) - SAME AS DASHBOARD
        filtered_photos.sort(key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
        
        # Manual pagination
        total = len(filtered_photos)
        offset = (page - 1) * per_page
        paginated_photos = filtered_photos[offset:offset + per_page]
        has_more = (offset + len(paginated_photos)) < total
        
        # Build photo list - EXACT SAME URL PATTERN AS DASHBOARD
        photos_list = []
        for photo in paginated_photos:
            photo_data = {
                'id': photo.id,
                'filename': photo.filename,
                'url': f'/uploads/{current_user.id}/{photo.filename}' if photo.filename else None,
                'thumbnail_url': f'/uploads/{current_user.id}/{photo.filename}' if photo.filename else None,
                'created_at': photo.created_at.isoformat() if photo.created_at else None,
                'file_size': photo.file_size,
                'has_edited': photo.edited_filename is not None
            }
            
            if photo.edited_filename:
                photo_data['edited_url'] = f'/uploads/{current_user.id}/{photo.edited_filename}'
            
            photos_list.append(photo_data)
        
        return jsonify({
            'success': True,
            'photos': photos_list,
            'page': page,
            'per_page': per_page,
            'total': total,
            'has_more': has_more
        })
        
    except Exception as e:
        logger.error(f"Gallery error: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500

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
        from photovault.utils.file_handler import validate_image_file, generate_unique_filename
        
        logger.info(f"🎯 Photo detection request from user: {current_user.id}")
        
        # Check if file was uploaded
        if 'image' not in request.files:
            logger.error("❌ No image file in request")
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if not file or not file.filename:
            logger.error("❌ Empty file")
            return jsonify({'error': 'No file selected'}), 400
        
        logger.info(f"📁 Processing uploaded file: {file.filename}")
        
        # Validate file
        is_valid, validation_msg = validate_image_file(file)
        if not is_valid:
            logger.error(f"❌ Invalid file: {validation_msg}")
            return jsonify({'error': f'Invalid file: {validation_msg}'}), 400
        
        # Generate unique filename
        unique_filename = generate_unique_filename(
            file.filename,
            prefix='digitizer',
            username=current_user.username
        )
        
        # Save uploaded file
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        source_path = os.path.join(user_folder, unique_filename)
        file.save(source_path)
        
        logger.info(f"💾 Saved source image to: {source_path}")
        
        # Initialize detector
        detector = PhotoDetector()
        
        # Detect photos in the image
        detected = detector.detect_photos(source_path)
        
        if not detected or len(detected) == 0:
            logger.info("ℹ️ No photos detected in image")
            # Still save the original image
            file_size = os.path.getsize(source_path)
            
            # Create thumbnail
            thumbnail_filename = f"thumb_{unique_filename}"
            thumbnail_path = os.path.join(user_folder, thumbnail_filename)
            try:
                img = Image.open(source_path)
                img.thumbnail((300, 300))
                img.save(thumbnail_path)
            except Exception as e:
                logger.error(f"Thumbnail creation failed: {e}")
                thumbnail_path = source_path
            
            # Save as regular photo
            photo = Photo()
            photo.user_id = current_user.id
            photo.filename = unique_filename
            photo.original_name = file.filename
            photo.file_path = source_path
            photo.thumbnail_path = thumbnail_path
            photo.file_size = file_size
            photo.upload_source = 'digitizer'
            
            db.session.add(photo)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'No photos detected - saved as single image',
                'photos_extracted': 0,
                'photo': {
                    'id': photo.id,
                    'filename': photo.filename
                }
            }), 200
        
        logger.info(f"✅ Detected {len(detected)} photos in image")
        
        # Extract detected photos
        extracted_files = detector.extract_photos(source_path, user_folder, detected)
        
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
                
                # Create new photo record
                extracted_photo = Photo()
                extracted_photo.user_id = current_user.id
                extracted_photo.filename = os.path.basename(extracted_path)
                extracted_photo.original_name = f"extracted_{i+1}_from_{file.filename}"
                extracted_photo.file_path = extracted_path
                extracted_photo.thumbnail_path = thumbnail_path
                extracted_photo.file_size = extracted_size
                extracted_photo.upload_source = 'digitizer'
                
                db.session.add(extracted_photo)
                db.session.commit()
                
                extracted_photos.append({
                    'id': extracted_photo.id,
                    'filename': extracted_photo.filename,
                    'confidence': extracted_file.get('confidence', 0)
                })
                
                logger.info(f"✅ Extracted photo {i+1}: {extracted_photo.filename}")
                
            except Exception as extract_error:
                logger.error(f"❌ Error processing extracted photo {i}: {extract_error}")
                continue
        
        # Clean up source file after successful extraction
        try:
            if os.path.exists(source_path):
                os.remove(source_path)
                logger.info(f"🗑️ Cleaned up source file: {source_path}")
        except Exception as e:
            logger.error(f"Failed to clean up source file: {e}")
        
        logger.info(f"🎉 Successfully extracted {len(extracted_photos)} photos")
        
        return jsonify({
            'success': True,
            'message': f'Successfully extracted {len(extracted_photos)} photos',
            'photos_extracted': len(extracted_photos),
            'total_detected': len(detected),
            'extracted_photos': extracted_photos
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Photo detection error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Photo detection failed: {str(e)}'}), 500

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
        logger.info(f"📋 Fetching vault details for vault_id={vault_id}, user={current_user.id}")
        
        # Get vault
        vault = FamilyVault.query.get(vault_id)
        if not vault:
            logger.error(f"❌ Vault {vault_id} not found")
            return jsonify({'error': 'Vault not found'}), 404
        
        # Check if user has access (creator or active member)
        is_creator = vault.created_by == current_user.id
        is_member = FamilyMember.query.filter_by(
            vault_id=vault_id,
            user_id=current_user.id,
            status='active'
        ).first() is not None
        
        has_access = is_creator or is_member
        
        if not has_access:
            logger.error(f"❌ User {current_user.id} has no access to vault {vault_id}")
            return jsonify({'error': 'Access denied'}), 403
        
        logger.info(f"✅ User has access to vault (creator={is_creator}, member={is_member})")
        
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

@mobile_api_bp.route('/photos/<int:photo_id>/enhance', methods=['POST'])
@csrf.exempt
@token_required
def enhance_photo_mobile(current_user, photo_id):
    """
    Mobile API endpoint to apply image enhancement with JWT authentication
    """
    try:
        from photovault.utils.image_enhancement import enhancer
        import random
        from datetime import datetime
        
        # Get the photo and verify ownership
        photo = Photo.query.filter_by(id=photo_id, user_id=current_user.id).first()
        if not photo:
            return jsonify({'success': False, 'error': 'Photo not found or access denied'}), 404
        
        # Construct full file path
        user_upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(current_user.id))
        if os.path.isabs(photo.file_path):
            full_file_path = photo.file_path
        else:
            full_file_path = os.path.join(user_upload_dir, photo.file_path)
        
        # Check if file exists
        if not os.path.exists(full_file_path):
            return jsonify({'success': False, 'error': 'Photo file not found'}), 404
        
        # Check image size
        file_size = os.path.getsize(full_file_path)
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            return jsonify({
                'success': False, 
                'error': 'Image too large for enhancement. Please use smaller images (under 10MB).'
            }), 400
        
        # Get enhancement settings from request
        data = request.get_json() or {}
        enhancement_settings = data.get('settings', {})
        
        # Generate filename for enhanced version
        from werkzeug.utils import secure_filename as sanitize_name
        date = datetime.now().strftime('%Y%m%d')
        random_number = random.randint(100000, 999999)
        safe_username = sanitize_name(current_user.username)
        enhanced_filename = f"{safe_username}.enhanced.{date}.{random_number}.jpg"
        
        # Create user upload directory
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Enhanced image path
        enhanced_filepath = os.path.join(user_upload_dir, enhanced_filename)
        
        # Apply enhancements
        output_path, applied_settings = enhancer.auto_enhance_photo(
            full_file_path, 
            enhanced_filepath, 
            enhancement_settings
        )
        
        # Update photo record with enhanced version
        photo.edited_filename = enhanced_filename
        photo.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Photo {photo_id} enhanced successfully for user {current_user.id}")
        
        return jsonify({
            'success': True,
            'message': 'Photo enhanced successfully',
            'photo': {
                'id': photo.id,
                'filename': photo.filename,
                'enhanced_filename': enhanced_filename,
                'enhanced_url': f'/uploads/{current_user.id}/{enhanced_filename}',
                'settings_applied': applied_settings
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Mobile enhance error for photo {photo_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Enhancement failed'}), 500

@mobile_api_bp.route('/photos/<int:photo_id>/colorize', methods=['POST'])
@csrf.exempt
@token_required
def colorize_photo_mobile(current_user, photo_id):
    """
    Mobile API endpoint to colorize a black and white photo with JWT authentication
    """
    try:
        from photovault.utils.colorization import get_colorizer
        
        # Get the photo and verify ownership
        photo = Photo.query.filter_by(id=photo_id, user_id=current_user.id).first()
        if not photo:
            return jsonify({'success': False, 'error': 'Photo not found or access denied'}), 404
        
        # Get colorization method from request
        data = request.get_json() or {}
        method = data.get('method', 'auto')
        
        if method not in ['auto', 'dnn', 'basic']:
            return jsonify({
                'success': False,
                'error': 'Invalid colorization method. Use auto, dnn, or basic'
            }), 400
        
        # Initialize colorizer
        colorizer = get_colorizer()
        
        # Check if file exists
        if not os.path.exists(photo.file_path):
            return jsonify({'success': False, 'error': 'Photo file not found'}), 404
        
        # Check if photo is grayscale
        try:
            is_grayscale = colorizer.is_grayscale(photo.file_path)
        except Exception as e:
            logger.error(f"Error checking grayscale: {str(e)}")
            return jsonify({'success': False, 'error': 'Error processing photo'}), 500
        
        if not is_grayscale:
            return jsonify({
                'success': False,
                'error': 'Photo is already in color',
                'is_grayscale': False
            }), 400
        
        # Generate unique filename for colorized version
        unique_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(photo.filename)[1] or '.jpg'
        colorized_filename = f"{current_user.id}_{unique_id}_colorized_{timestamp}{file_extension}"
        
        # Create user folder
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'photovault/uploads')
        user_folder = os.path.join(upload_folder, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        colorized_path = os.path.join(user_folder, colorized_filename)
        
        logger.info(f"Colorizing photo {photo_id} for user {current_user.id} using method: {method}")
        
        # Perform colorization
        try:
            colorized_path, actual_method = colorizer.colorize_image(photo.file_path, colorized_path, method=method)
        except RuntimeError as e:
            if 'DNN model not available' in str(e):
                return jsonify({
                    'success': False,
                    'error': 'DNN colorization model not available. Using basic method instead.'
                }), 400
            else:
                raise
        
        # Update photo record with colorized version
        photo.edited_filename = colorized_filename
        photo.updated_at = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Photo {photo_id} colorized successfully using {actual_method}")
        
        return jsonify({
            'success': True,
            'message': 'Photo colorized successfully',
            'photo': {
                'id': photo.id,
                'filename': photo.filename,
                'colorized_filename': colorized_filename,
                'colorized_url': f'/uploads/{current_user.id}/{colorized_filename}',
                'method_used': actual_method
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Mobile colorize error for photo {photo_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Colorization failed'}), 500
