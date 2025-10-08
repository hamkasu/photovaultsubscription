//
//  CameraViewModel.swift
//  PhotoVault iOS
//
//  ViewModel for camera functionality
//

import SwiftUI
import AVFoundation
import Combine

@MainActor
class CameraViewModel: ObservableObject {
    @Published var detectedEdges: [CGPoint]?
    @Published var capturedImage: UIImage?
    @Published var enhancedImage: UIImage?
    @Published var isProcessing = false
    @Published var showingPreview = false
    @Published var edgeDetectionEnabled = true
    @Published var showPermissionDenied = false
    
    private let cameraManager = CameraManager()
    private let edgeDetector = EdgeDetector()
    private let imageEnhancer = ImageEnhancer()
    
    private var cancellables = Set<AnyCancellable>()
    private var edgeDetectionTask: Task<Void, Never>?
    
    var session: AVCaptureSession {
        cameraManager.session
    }
    
    // MARK: - Initialization
    
    init() {
        setupBindings()
    }
    
    private func setupBindings() {
        // Listen to frame updates for edge detection
        cameraManager.$currentFrame
            .compactMap { $0 }
            .sink { [weak self] pixelBuffer in
                guard let self = self, self.edgeDetectionEnabled else { return }
                self.detectEdges(in: pixelBuffer)
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Camera Control
    
    func startCamera() {
        let authStatus = AVCaptureDevice.authorizationStatus(for: .video)
        
        switch authStatus {
        case .authorized:
            cameraManager.startSession()
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    if granted {
                        self?.cameraManager.startSession()
                    } else {
                        print("Camera permission denied")
                        self?.showPermissionDenied = true
                    }
                }
            }
            
        case .denied, .restricted:
            print("Camera access denied or restricted - show settings prompt")
            showPermissionDenied = true
            
        @unknown default:
            print("Unknown camera authorization status")
            showPermissionDenied = true
        }
    }
    
    func stopCamera() {
        cameraManager.stopSession()
        edgeDetectionTask?.cancel()
    }
    
    // MARK: - Edge Detection
    
    private func detectEdges(in pixelBuffer: CVPixelBuffer) {
        edgeDetectionTask?.cancel()
        
        edgeDetectionTask = Task { [weak self] in
            guard let self = self else { return }
            
            if let detected = await self.edgeDetector.detectEdgesInFrame(pixelBuffer) {
                await MainActor.run {
                    self.detectedEdges = detected.corners
                }
            } else {
                await MainActor.run {
                    self.detectedEdges = nil
                }
            }
        }
    }
    
    // MARK: - Photo Capture
    
    func capturePhoto() {
        isProcessing = true
        
        cameraManager.capturePhoto { [weak self] image in
            guard let self = self, let image = image else {
                self?.isProcessing = false
                return
            }
            
            self.capturedImage = image
            self.enhancePhoto(image)
        }
    }
    
    private func enhancePhoto(_ image: UIImage) {
        Task {
            let enhanced = await imageEnhancer.enhance(image, with: detectedEdges)
            
            await MainActor.run {
                self.enhancedImage = enhanced ?? image
                self.isProcessing = false
                self.showingPreview = true
            }
        }
    }
    
    // MARK: - Actions
    
    func savePhoto() {
        guard let image = enhancedImage else { return }
        
        // Save to Core Data
        Task {
            let photo = Photo(
                id: UUID(),
                image: image,
                capturedAt: Date(),
                isEnhanced: true
            )
            
            do {
                try await CoreDataStack.shared.savePhoto(photo)
                print("Photo saved successfully: \(photo.id)")
                
                // Reset state
                await MainActor.run {
                    self.resetCapture()
                }
            } catch {
                print("Failed to save photo: \(error)")
                await MainActor.run {
                    // TODO: Show error alert to user
                    self.resetCapture()
                }
            }
        }
    }
    
    func retakePhoto() {
        resetCapture()
    }
    
    private func resetCapture() {
        capturedImage = nil
        enhancedImage = nil
        detectedEdges = nil
        showingPreview = false
    }
    
    func toggleEdgeDetection() {
        edgeDetectionEnabled.toggle()
        if !edgeDetectionEnabled {
            detectedEdges = nil
        }
    }
}
