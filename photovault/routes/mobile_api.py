"""
Mobile API Routes for StoryKeep iOS/Android App
"""
from flask import Blueprint, jsonify, request, current_app, url_for
from photovault.models import Photo, UserSubscription, FamilyVault, FamilyMember, User, VaultPhoto, VaultInvitation
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

@mobile_api_bp.route('/family/vaults', methods=['GET', 'POST'])
@csrf.exempt
@token_required
def family_vaults(current_user):
    """Get user's family vaults or create new vault for mobile app"""
    if request.method == 'GET':
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
    
    elif request.method == 'POST':
        try:
            from photovault.routes.family import validate_vault_name, validate_vault_description, generate_vault_code
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            name = data.get('name', '').strip()
            description = data.get('description', '').strip()
            is_public = data.get('is_public', False)
            
            # Validate inputs
            valid_name, name_msg = validate_vault_name(name)
            valid_desc, desc_msg = validate_vault_description(description)
            
            if not valid_name:
                return jsonify({'error': name_msg}), 400
            
            if not valid_desc:
                return jsonify({'error': desc_msg}), 400
            
            # Generate unique vault code
            vault_code = generate_vault_code()
            while FamilyVault.query.filter_by(vault_code=vault_code).first():
                vault_code = generate_vault_code()
            
            # Create vault
            vault = FamilyVault()
            vault.name = name
            vault.description = description
            vault.created_by = current_user.id
            vault.vault_code = vault_code
            vault.is_public = is_public
            
            db.session.add(vault)
            db.session.flush()
            
            # Add creator as admin member
            creator_member = FamilyMember()
            creator_member.vault_id = vault.id
            creator_member.user_id = current_user.id
            creator_member.role = 'admin'
            creator_member.status = 'active'
            db.session.add(creator_member)
            
            db.session.commit()
            
            logger.info(f"✅ Vault created successfully: {vault.id} by user {current_user.username}")
            
            return jsonify({
                'success': True,
                'vault': {
                    'id': vault.id,
                    'name': vault.name,
                    'description': vault.description,
                    'vault_code': vault_code,
                    'is_public': vault.is_public,
                    'created_at': vault.created_at.isoformat() if vault.created_at else None
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Error creating vault: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({'error': 'Failed to create vault'}), 500

@mobile_api_bp.route('/family/vault/<int:vault_id>', methods=['GET'])
@token_required
def get_vault_detail(current_user, vault_id):
    """Get vault details for mobile app - REWRITTEN for better error handling"""
    try:
        logger.info(f"🔍 VAULT DETAIL REQUEST: vault_id={vault_id}, user_id={current_user.id}, username={current_user.username}")
        
        # Step 1: Get vault with null check
        vault = FamilyVault.query.get(vault_id)
        if not vault:
            logger.error(f"❌ VAULT NOT FOUND: vault_id={vault_id}")
            return jsonify({
                'success': False,
                'error': 'Vault not found',
                'vault_id': vault_id
            }), 404
        
        logger.info(f"✅ VAULT FOUND: id={vault.id}, name={vault.name}, created_by={vault.created_by}")
        
        # Step 2: Check access permissions
        is_creator = (vault.created_by == current_user.id)
        
        # Check membership
        membership = FamilyMember.query.filter_by(
            vault_id=vault_id,
            user_id=current_user.id,
            status='active'
        ).first()
        is_member = membership is not None
        
        has_access = is_creator or is_member
        
        logger.info(f"🔐 ACCESS CHECK: is_creator={is_creator}, is_member={is_member}, has_access={has_access}")
        
        if not has_access:
            logger.error(f"❌ ACCESS DENIED: user_id={current_user.id} has no access to vault_id={vault_id}")
            return jsonify({
                'success': False,
                'error': 'You do not have permission to view this vault',
                'vault_id': vault_id
            }), 403
        
        # Step 3: Get vault photos with safe handling
        photos_list = []
        try:
            # Try to use VaultPhoto model
            vault_photos = VaultPhoto.query.filter_by(vault_id=vault_id).order_by(VaultPhoto.shared_at.desc()).all()
            logger.info(f"📸 FOUND {len(vault_photos)} vault photos using VaultPhoto model")
            
            for vp in vault_photos:
                try:
                    photo = Photo.query.get(vp.photo_id)
                    if photo:
                        photo_url = f"/uploads/{photo.user_id}/{photo.filename}" if photo.filename else None
                        thumbnail_url = f"/uploads/{photo.user_id}/{photo.thumbnail_filename}" if photo.thumbnail_filename else None
                        
                        photos_list.append({
                            'id': photo.id,
                            'filename': photo.filename,
                            'url': photo_url,
                            'thumbnail_url': thumbnail_url,
                            'shared_at': vp.shared_at.isoformat() if vp.shared_at else None,
                            'user_id': photo.user_id
                        })
                except Exception as photo_error:
                    logger.warning(f"⚠️ Error processing vault photo {vp.id}: {str(photo_error)}")
                    continue
                    
        except Exception as vault_photo_error:
            logger.error(f"❌ VaultPhoto query failed: {str(vault_photo_error)}")
            logger.info("📋 Using fallback: returning empty photos list")
            photos_list = []
        
        # Step 4: Get vault members with safe handling
        members_list = []
        try:
            members = FamilyMember.query.filter_by(vault_id=vault_id, status='active').all()
            logger.info(f"👥 FOUND {len(members)} vault members")
            
            for member in members:
                try:
                    user = User.query.get(member.user_id)
                    if user:
                        members_list.append({
                            'id': user.id,
                            'username': user.username,
                            'email': user.email,
                            'role': member.role if hasattr(member, 'role') else 'member',
                            'joined_at': member.joined_at.isoformat() if member.joined_at else None
                        })
                except Exception as member_error:
                    logger.warning(f"⚠️ Error processing member {member.id}: {str(member_error)}")
                    continue
                    
        except Exception as members_error:
            logger.error(f"❌ Members query failed: {str(members_error)}")
            members_list = []
        
        # Step 5: Determine member role safely
        member_role = 'viewer'
        if is_creator:
            member_role = 'owner'
        elif membership and hasattr(membership, 'role'):
            member_role = membership.role
        
        # Step 6: Build success response
        response_data = {
            'success': True,
            'vault': {
                'id': vault.id,
                'name': vault.name,
                'description': vault.description if hasattr(vault, 'description') else '',
                'vault_code': vault.vault_code if hasattr(vault, 'vault_code') else None,
                'is_public': vault.is_public if hasattr(vault, 'is_public') else False,
                'created_at': vault.created_at.isoformat() if vault.created_at else None,
                'is_creator': is_creator,
                'member_role': member_role,
                'photo_count': len(photos_list),
                'member_count': len(members_list)
            },
            'photos': photos_list,
            'members': members_list
        }
        
        logger.info(f"✅ VAULT DETAIL SUCCESS: {len(photos_list)} photos, {len(members_list)} members")
        return jsonify(response_data), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"💥 VAULT DETAIL FATAL ERROR: {str(e)}")
        logger.error(f"📋 TRACEBACK:\n{error_trace}")
        
        return jsonify({
            'success': False,
            'error': f'Failed to load vault details: {str(e)}',
            'vault_id': vault_id,
            'error_type': type(e).__name__
        }), 500

@mobile_api_bp.route('/family/vault/<int:vault_id>/add-photo', methods=['POST'])
@csrf.exempt
@token_required
def add_photo_to_vault(current_user, vault_id):
    """Add photo to vault - FRESH IMPLEMENTATION using working gallery pattern"""
    logger.info(f"🎯 ADD PHOTO: vault={vault_id}, user={current_user.id}")
    
    try:
        # Get photo_id from request
        data = request.get_json()
        photo_id = data.get('photo_id') if data else None
        caption = data.get('caption', '') if data else ''
        
        logger.info(f"📥 Request data: photo_id={photo_id}, caption={caption}")
        
        if not photo_id:
            logger.error("❌ No photo_id provided")
            return jsonify({'success': False, 'error': 'photo_id required'}), 400
        
        # Get vault - simple query
        vault = FamilyVault.query.filter_by(id=vault_id).first()
        if not vault:
            logger.error(f"❌ Vault {vault_id} not found")
            return jsonify({'success': False, 'error': 'Vault not found'}), 404
        
        # Check vault access - creator OR member
        is_creator = (vault.created_by == current_user.id)
        member = FamilyMember.query.filter_by(
            vault_id=vault_id,
            user_id=current_user.id,
            status='active'
        ).first()
        
        if not is_creator and not member:
            logger.error(f"❌ No access to vault {vault_id}")
            return jsonify({'success': False, 'error': 'No vault access'}), 403
        
        # Get photo - use same pattern as gallery
        photo = Photo.query.filter_by(id=photo_id, user_id=current_user.id).first()
        if not photo:
            logger.error(f"❌ Photo {photo_id} not found for user {current_user.id}")
            return jsonify({'success': False, 'error': 'Photo not found'}), 404
        
        logger.info(f"✅ Photo found: {photo.filename}")
        
        # Check if already added
        existing = VaultPhoto.query.filter_by(vault_id=vault_id, photo_id=photo_id).first()
        if existing:
            logger.info(f"⚠️ Already added, returning success")
            return jsonify({
                'success': True,
                'message': 'Photo already in vault',
                'photo': {
                    'id': photo.id,
                    'original_url': f'/uploads/{current_user.id}/{photo.filename}',
                    'caption': existing.caption
                }
            }), 200
        
        # Add to vault - fresh simple code
        vault_photo = VaultPhoto()
        vault_photo.vault_id = vault_id
        vault_photo.photo_id = photo_id
        vault_photo.shared_by = current_user.id
        vault_photo.shared_at = datetime.utcnow()
        vault_photo.caption = caption
        
        db.session.add(vault_photo)
        db.session.commit()
        
        logger.info(f"✅ SUCCESS! Added photo {photo_id} to vault {vault_id}")
        
        # Return photo info using same URL pattern as gallery
        return jsonify({
            'success': True,
            'message': 'Photo added to vault',
            'photo': {
                'id': photo.id,
                'original_url': f'/uploads/{current_user.id}/{photo.filename}',
                'edited_url': f'/uploads/{current_user.id}/{photo.edited_filename}' if photo.edited_filename else None,
                'caption': caption
            }
        }), 201
        
    except Exception as e:
        logger.error(f"💥 ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@mobile_api_bp.route('/family/vault/<int:vault_id>/invite', methods=['POST'])
@csrf.exempt
@token_required
def invite_member_to_vault(current_user, vault_id):
    """Invite a member to family vault - Mobile API"""
    try:
        from photovault.forms import (
            validate_email_for_invitation, validate_invitation_role,
            generate_invitation_token, get_invitation_expiry
        )
        
        logger.info(f"👥 INVITE MEMBER REQUEST: vault_id={vault_id}, user_id={current_user.id}")
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        email = data.get('email', '').strip().lower()
        role = data.get('role', 'member')
        
        logger.info(f"📋 Data: email={email}, role={role}")
        
        # Step 1: Verify vault exists
        vault = FamilyVault.query.get(vault_id)
        if not vault:
            logger.error(f"❌ VAULT NOT FOUND: vault_id={vault_id}")
            return jsonify({
                'success': False,
                'error': 'Vault not found'
            }), 404
        
        # Step 2: Check if user can manage vault (admin or creator)
        user_role = vault.get_member_role(current_user.id)
        is_creator = vault.created_by == current_user.id
        
        if user_role not in ['admin'] and not is_creator:
            logger.error(f"❌ PERMISSION DENIED: user {current_user.id} cannot invite to vault {vault_id}")
            return jsonify({
                'success': False,
                'error': 'You do not have permission to invite members'
            }), 403
        
        logger.info(f"✅ PERMISSION GRANTED: is_creator={is_creator}, user_role={user_role}")
        
        # Step 3: Validate inputs
        valid_email, email_msg = validate_email_for_invitation(email)
        valid_role, role_msg = validate_invitation_role(role)
        
        if not valid_email:
            logger.error(f"❌ INVALID EMAIL: {email_msg}")
            return jsonify({
                'success': False,
                'error': email_msg
            }), 400
        
        if not valid_role:
            logger.error(f"❌ INVALID ROLE: {role_msg}")
            return jsonify({
                'success': False,
                'error': role_msg
            }), 400
        
        # Step 4: Check if user is already a member
        existing_member = FamilyMember.query.filter_by(
            vault_id=vault_id,
            status='active'
        ).join(User, FamilyMember.user_id == User.id).filter(
            User.email == email
        ).first()
        
        if existing_member:
            logger.warning(f"⚠️ USER ALREADY MEMBER: email={email}, vault_id={vault_id}")
            return jsonify({
                'success': False,
                'error': 'This user is already a member of the vault'
            }), 400
        
        # Step 5: Check if invitation already exists
        existing_invitation = VaultInvitation.query.filter_by(
            vault_id=vault_id,
            email=email,
            status='pending'
        ).first()
        
        if existing_invitation:
            logger.warning(f"⚠️ INVITATION ALREADY EXISTS: email={email}, vault_id={vault_id}")
            return jsonify({
                'success': False,
                'error': 'An invitation has already been sent to this email'
            }), 400
        
        # Step 6: Create invitation
        invitation = VaultInvitation()
        invitation.vault_id = vault_id
        invitation.email = email
        invitation.invited_by = current_user.id
        invitation.role = role
        invitation.invitation_token = generate_invitation_token()
        invitation.expires_at = get_invitation_expiry()
        
        db.session.add(invitation)
        db.session.commit()
        
        logger.info(f"✅ INVITATION CREATED: invitation_id={invitation.id}")
        
        # Step 7: Send invitation email
        try:
            from photovault.services.sendgrid_service import send_family_invitation_email
            
            email_sent = send_family_invitation_email(
                email=email,
                invitation_token=invitation.invitation_token,
                vault_name=vault.name,
                inviter_name=current_user.username
            )
            
            if email_sent:
                invitation.mark_as_sent()
                db.session.commit()
                logger.info(f"📧 INVITATION EMAIL SENT: email={email}")
            else:
                logger.warning(f"⚠️ EMAIL FAILED: email={email}")
                
        except Exception as e:
            logger.error(f"❌ EMAIL ERROR: {str(e)}")
        
        # Return success even if email fails (invitation is created)
        invitation_url = url_for('family.accept_invitation', token=invitation.invitation_token, _external=True)
        
        return jsonify({
            'success': True,
            'message': f'Invitation sent to {email}',
            'invitation': {
                'id': invitation.id,
                'email': email,
                'role': role,
                'invitation_url': invitation_url,
                'expires_at': invitation.expires_at.isoformat() if invitation.expires_at else None
            }
        }), 201
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"💥 INVITE MEMBER ERROR: {str(e)}")
        logger.error(f"📋 TRACEBACK:\n{error_trace}")
        db.session.rollback()
        
        return jsonify({
            'success': False,
            'error': f'Failed to send invitation: {str(e)}',
            'error_type': type(e).__name__
        }), 500

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
