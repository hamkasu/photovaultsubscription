//
//  CameraManager.swift
//  PhotoVault iOS
//
//  Manages AVFoundation camera session and capture
//

import AVFoundation
import UIKit
import Combine

class CameraManager: NSObject, ObservableObject {
    @Published var isSessionRunning = false
    @Published var capturedPhoto: UIImage?
    @Published var currentFrame: CVPixelBuffer?
    @Published var previewSize: CGSize = .zero
    
    let session = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private let videoOutput = AVCaptureVideoDataOutput()
    private let sessionQueue = DispatchQueue(label: "com.photovault.camera")
    private let videoQueue = DispatchQueue(label: "com.photovault.video")
    
    var previewLayer: AVCaptureVideoPreviewLayer?
    private var photoCaptureDelegate: PhotoCaptureDelegate?
    
    // MARK: - Setup
    
    override init() {
        super.init()
        setupSession()
    }
    
    private func setupSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.session.beginConfiguration()
            self.session.sessionPreset = .photo
            
            // Add camera input
            guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                  let input = try? AVCaptureDeviceInput(device: camera),
                  self.session.canAddInput(input) else {
                print("Failed to add camera input")
                return
            }
            self.session.addInput(input)
            
            // Add photo output
            if self.session.canAddOutput(self.photoOutput) {
                self.session.addOutput(self.photoOutput)
                self.photoOutput.maxPhotoQualityPrioritization = .quality
            }
            
            // Add video output for real-time processing
            if self.session.canAddOutput(self.videoOutput) {
                self.session.addOutput(self.videoOutput)
                self.videoOutput.setSampleBufferDelegate(self, queue: self.videoQueue)
                
                if let connection = self.videoOutput.connection(with: .video) {
                    connection.videoOrientation = .portrait
                }
            }
            
            self.session.commitConfiguration()
        }
    }
    
    // MARK: - Session Control
    
    func startSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            if !self.session.isRunning {
                self.session.startRunning()
                DispatchQueue.main.async {
                    self.isSessionRunning = true
                }
            }
        }
    }
    
    func stopSession() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            if self.session.isRunning {
                self.session.stopRunning()
                DispatchQueue.main.async {
                    self.isSessionRunning = false
                }
            }
        }
    }
    
    // MARK: - Photo Capture
    
    func capturePhoto(completion: @escaping (UIImage?) -> Void) {
        let authStatus = AVCaptureDevice.authorizationStatus(for: .video)
        
        switch authStatus {
        case .authorized:
            performCapture(completion: completion)
            
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                if granted {
                    self?.performCapture(completion: completion)
                } else {
                    DispatchQueue.main.async {
                        completion(nil)
                    }
                }
            }
            
        case .denied, .restricted:
            print("Camera access denied or restricted")
            DispatchQueue.main.async {
                completion(nil)
            }
            
        @unknown default:
            print("Unknown camera authorization status")
            DispatchQueue.main.async {
                completion(nil)
            }
        }
    }
    
    private func performCapture(completion: @escaping (UIImage?) -> Void) {
        let settings = AVCapturePhotoSettings()
        settings.photoQualityPrioritization = .quality
        
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            let delegate = PhotoCaptureDelegate { [weak self] image in
                DispatchQueue.main.async {
                    self?.capturedPhoto = image
                    completion(image)
                    self?.photoCaptureDelegate = nil
                }
            }
            
            self.photoCaptureDelegate = delegate
            self.photoOutput.capturePhoto(with: settings, delegate: delegate)
        }
    }
    
    // MARK: - Permissions
    
    static func requestCameraPermission() {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            if granted {
                print("Camera access granted")
            } else {
                print("Camera access denied")
            }
        }
    }
    
    static var isCameraAuthorized: Bool {
        AVCaptureDevice.authorizationStatus(for: .video) == .authorized
    }
}

// MARK: - Video Delegate

extension CameraManager: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        DispatchQueue.main.async { [weak self] in
            self?.currentFrame = pixelBuffer
        }
    }
}

// MARK: - Photo Capture Delegate

private class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (UIImage?) -> Void
    
    init(completion: @escaping (UIImage?) -> Void) {
        self.completion = completion
    }
    
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard error == nil,
              let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            completion(nil)
            return
        }
        
        completion(image)
    }
}
