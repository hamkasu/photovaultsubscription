"""
Mobile API Routes for StoryKeep iOS/Android App
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from photovault.models import Photo, UserSubscription
from photovault.extensions import db

mobile_api_bp = Blueprint('mobile_api', __name__, url_prefix='/api')

@mobile_api_bp.route('/dashboard', methods=['GET'])
@login_required
def get_dashboard():
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
        print(f"Dashboard error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@mobile_api_bp.route('/auth/profile', methods=['GET'])
@login_required
def get_profile():
    """Get user profile for mobile app"""
    try:
        user_subscription = UserSubscription.query.filter_by(user_id=current_user.id).first()
        
        return jsonify({
            'username': current_user.username,
            'email': current_user.email,
            'subscription_plan': user_subscription.plan.name if user_subscription and user_subscription.plan else 'Free'
        })
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({'error': str(e)}), 500
