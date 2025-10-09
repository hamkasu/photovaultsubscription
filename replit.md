# StoryKeep - Save Your Family Stories

## Overview
StoryKeep (formerly PhotoVault) is a comprehensive photo management and enhancement platform designed to provide a professional-grade experience. It offers features such as a professional camera interface, automatic photo upload and organization, secure storage, face detection and recognition, advanced photo enhancement and restoration, AI-powered smart tagging, family vault sharing, and social media integration. The platform operates on a subscription-based billing model, catering to a broad market seeking advanced photo management solutions.

## Recent Changes (October 2025)
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

Mobile applications are developed with React Native/Expo for iOS and Kotlin with CameraX, Room, Retrofit, Glide for Android.

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