# StoryKeep - Save Your Family Stories

## Overview
StoryKeep (formerly PhotoVault) is a comprehensive photo management and enhancement platform designed to provide a professional-grade experience. It offers features such as a professional camera interface, automatic photo upload and organization, secure storage, face detection and recognition, advanced photo enhancement and restoration, AI-powered smart tagging, family vault sharing, and social media integration. The platform operates on a subscription-based billing model, catering to a broad market seeking advanced photo management solutions.

## Recent Changes (October 2025)

### Latest (October 12, 2025)
- **Voice Memo Badge Feature**: Added microphone badges to iOS gallery for photos with voice memos
  - **Backend**: Enhanced `/api/dashboard` endpoint to include `voice_memo_count` field for each photo
  - **Efficient Query**: Single SQL GROUP BY query with dictionary lookup (O(1) access, no N+1 queries)
  - **Safety Check**: Added validation to handle users with zero photos gracefully
  - **Frontend**: iOS app already had badge UI - just needed backend data
  - **Visual Indicator**: Microphone icon 🎤 with count badge shows how many voice memos exist per photo
  - **Documentation**: Complete Railway deployment guide in VOICE_MEMO_BADGE_DEPLOYMENT.md

### Previous Updates (October 11, 2025)
- **Voice Memo Upload Fix**: Fixed voice memo upload failures on Railway deployment with comprehensive solution
  - **Root Cause**: Expo SDK 54 deprecated FileSystem methods, causing runtime errors during file validation
  - **SDK 54 Fix**: Changed to `import * as FileSystem from 'expo-file-system/legacy'` for compatibility
  - **Railway Optimization**: Implemented custom 32kbps AAC compression (~0.24MB/min) to stay under 10MB proxy limit
  - **File Size Validation**: Added 8MB pre-upload check with user-friendly error messages
  - **Recording Quality**: Supports 30+ minute recordings with excellent voice clarity
  - **Backend Auth**: All voice memo endpoints use `@hybrid_auth` for JWT support
  - **Documentation**: Complete deployment guide in VOICE_MEMO_SIZE_FIX.md
  - **IMPORTANT**: Must deploy to Railway for iOS app to work
- **Environment Recovery**: Successfully recovered from system restart
  - Reinstalled all Python dependencies (Flask, SQLAlchemy, Pillow, OpenCV, etc.)
  - Installed Expo and 772 packages in StoryKeep-iOS directory
  - Both workflows running successfully:
    - PhotoVault Server: Running on port 5000 with database initialized
    - Expo Server: Running with tunnel at exp://w9bfmv0-anonymous-8081.exp.direct and QR code displayed
  - All systems operational and ready for development

### Previous Updates
- **iOS Digitizer App (REBUILT)**: Complete professional photo digitalization app with React Native/Expo
  - Smart Camera with real-time edge detection, visual guides, and auto-capture
  - Batch capture mode for multiple photos in one session
  - Flash control (off/on/auto) for different lighting conditions
  - Automatic photo extraction with perspective correction and auto-crop
  - One-tap auto-enhancement pipeline (brightness, contrast, sharpness, denoise)
  - Offline queue with AsyncStorage for capturing without internet
  - Upload service with progress tracking and batch upload support
  - JWT authentication with secure token management
  - React Navigation for seamless user experience
- **Voice Memo Feature**: Complete voice memo recording and playback for photos
  - Record voice notes using expo-av with .m4a format
  - Secure playback with download-then-play pattern (no JWT exposure in URLs)
  - List all voice memos with play/pause controls
  - Delete voice memos with confirmation
  - Automatic temp file cleanup to prevent cache buildup
  - Mobile API endpoints: POST /api/photos/<photo_id>/voice-memos, DELETE /api/voice-memos/<memo_id>, GET /api/voice-memos/<memo_id>/audio
- **Image Display Fix**: Updated gallery and photo detail screens to use resizeMode="contain" to show full images without cropping
- **Colorized Filename Format**: Changed to `<username>.<date>.col.<random>` format for colorized images
- **Cache-Busting Implementation**: Added timestamp-based cache busting to side-by-side comparison view to prevent browser caching issues
- **Image Format Preservation**: Fixed Railway upload issue - images now preserve original format (PNG, JPG, GIF) instead of forcing JPEG conversion
- **Filename Safety Checks**: Added validation to ensure edited_filename never matches original filename

## User Preferences
None configured yet (will be added as needed)

## System Architecture

### UI/UX Decisions
The platform utilizes HTML5, CSS3, JavaScript (vanilla + jQuery patterns) with Jinja2 templating for the frontend. Responsive design is achieved using Bootstrap patterns. A unified photo card component system ensures consistent display of photos across all gallery pages, with a responsive CSS Grid layout (4-column desktop, 3-column tablet, 2-column mobile). Action buttons (View, Download, Edit, Delete) and filename/timestamp overlays are standardized across photo cards.

### Technical Implementations
The backend is built with Flask 3.0.3, using PostgreSQL (via Neon on Replit) as the database and SQLAlchemy 2.0.25 for ORM. Alembic via Flask-Migrate handles database migrations. Flask-Login manages authentication, and Flask-WTF + WTForms are used for forms. Gunicorn 21.2.0 serves the application in production.

Image processing leverages Pillow 11.0.0 and OpenCV 4.12.0.88 (headless), with NumPy and scikit-image for scientific computing. AI integration uses Google Gemini API (gemini-2.0-flash-exp) for intelligent photo colorization and analysis. Replit Object Storage is used for persistent image storage, with a smart fallback to local storage.

Mobile applications: **iOS Digitizer App** is a professional photo digitalization tool built with React Native/Expo, featuring:
- Smart camera with real-time edge detection and visual guides for framing physical photos
- Auto-capture when photo is properly aligned
- Batch capture mode with session management for multiple photos
- Flash control (off/on/auto) for various lighting conditions
- Client-side photo enhancement (brightness, contrast, sharpness, denoise)
- Server-side AI photo detection and extraction via `/api/detect-and-extract` endpoint
- Offline queue using AsyncStorage - capture photos without internet, upload later
- Upload service with progress tracking, retry logic, and batch processing
- JWT authentication with secure token storage
- React Navigation with Login, Register, Home, and Camera screens
- Integration with backend API endpoints for seamless synchronization

### Feature Specifications
-   **Authentication & Authorization**: User registration, login, password reset, session management, admin/superuser roles, subscription-based access.
-   **Photo Management**: Upload with metadata extraction, automatic face detection and tagging, enhancement, restoration, colorization, AI smart tagging, gallery organization, search, and filtering.
-   **Family Vaults**: Shared collections, member invitations, stories, and collaborative management.
-   **Subscription System**: Multiple pricing tiers (Free, Basic, Standard, Pro, Premium) with feature-based access, Stripe payment integration, and Malaysian pricing (MYR) with SST.
-   **Admin Features**: CSV/Excel export of user data, batch user operations (delete, grant/revoke admin status).

### System Design Choices
-   **Database**: PostgreSQL for all environments, SQLAlchemy ORM with relationship mappings, connection pooling, SSL for production.
-   **Security**: CSRF protection, password hashing, secure session cookies, file upload validation, SQL injection prevention.
-   **Image Processing**: Utilizes OpenCV, Pillow, and NumPy for robust image manipulation and analysis, including EXIF metadata extraction.
-   **Persistence**: Replit Object Storage for persistent image storage, organized by user.
-   **Deployment**: Configured for Replit Autoscale with Gunicorn.

## External Dependencies
-   **Database**: PostgreSQL (Neon on Replit)
-   **AI**: OpenAI API (GPT models)
-   **Object Storage**: Replit Object Storage
-   **Email**: SendGrid
-   **Payments**: Stripe
-   **Frontend Libraries**: jQuery patterns, Bootstrap patterns