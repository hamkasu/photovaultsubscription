//
//  CameraView.swift
//  PhotoVault iOS
//
//  Main camera view with live preview and controls
//

import SwiftUI

struct CameraView: View {
    @StateObject private var viewModel = CameraViewModel()
    @State private var showingSettings = false
    
    var body: some View {
        ZStack {
            // Camera Preview
            CameraPreviewView(session: viewModel.session)
                .ignoresSafeArea()
            
            // Edge Detection Overlay
            if let edges = viewModel.detectedEdges {
                EdgeOverlayView(corners: edges)
            }
            
            // Controls Overlay
            VStack {
                // Top Controls
                HStack {
                    Spacer()
                    
                    Button(action: { viewModel.toggleEdgeDetection() }) {
                        Image(systemName: viewModel.edgeDetectionEnabled ? "viewfinder" : "viewfinder.slash")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                    .padding()
                }
                
                Spacer()
                
                // Bottom Controls
                HStack(spacing: 40) {
                    // Gallery Button
                    Button(action: {
                        // TODO: Open gallery
                    }) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 50, height: 50)
                    }
                    
                    // Capture Button
                    CaptureButton {
                        viewModel.capturePhoto()
                    }
                    .disabled(viewModel.isProcessing)
                    
                    // Settings Button
                    Button(action: {
                        showingSettings = true
                    }) {
                        Image(systemName: "gearshape")
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 50, height: 50)
                    }
                }
                .padding(.bottom, 40)
            }
            
            // Processing Indicator
            if viewModel.isProcessing {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(1.5)
                        .tint(.white)
                    
                    Text("Enhancing...")
                        .foregroundColor(.white)
                        .font(.headline)
                }
            }
        }
        .onAppear {
            viewModel.startCamera()
        }
        .onDisappear {
            viewModel.stopCamera()
        }
        .sheet(isPresented: $viewModel.showingPreview) {
            PhotoPreviewView(
                image: viewModel.enhancedImage ?? viewModel.capturedImage,
                onSave: {
                    viewModel.savePhoto()
                },
                onRetake: {
                    viewModel.retakePhoto()
                }
            )
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
        }
        .alert("Camera Access Required", isPresented: $viewModel.showPermissionDenied) {
            Button("Open Settings") {
                if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(settingsURL)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("PhotoVault needs camera access to capture photos. Please enable it in Settings.")
        }
    }
}

// MARK: - Camera Preview

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession
    
    func makeUIView(context: Context) -> CameraPreviewUIView {
        let view = CameraPreviewUIView()
        view.session = session
        return view
    }
    
    func updateUIView(_ uiView: CameraPreviewUIView, context: Context) {
        // No updates needed
    }
}

class CameraPreviewUIView: UIView {
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    var session: AVCaptureSession? {
        didSet {
            guard let session = session else { return }
            
            let newPreviewLayer = AVCaptureVideoPreviewLayer(session: session)
            newPreviewLayer.videoGravity = .resizeAspectFill
            newPreviewLayer.frame = bounds
            layer.addSublayer(newPreviewLayer)
            
            previewLayer = newPreviewLayer
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        previewLayer?.frame = bounds
    }
    
    func convertFromCamera(_ point: CGPoint) -> CGPoint {
        guard let previewLayer = previewLayer else { return point }
        return previewLayer.layerPointConverted(fromCaptureDevicePoint: point)
    }
}

// MARK: - Edge Overlay

struct EdgeOverlayView: View {
    let corners: [CGPoint]
    
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                guard corners.count == 4 else { return }
                
                path.move(to: corners[0])
                path.addLine(to: corners[1])
                path.addLine(to: corners[2])
                path.addLine(to: corners[3])
                path.closeSubpath()
            }
            .stroke(Color.green, lineWidth: 3)
            .shadow(color: .black, radius: 2)
            
            // Corner dots
            ForEach(corners.indices, id: \.self) { index in
                Circle()
                    .fill(Color.green)
                    .frame(width: 12, height: 12)
                    .position(corners[index])
                    .shadow(color: .black, radius: 2)
            }
        }
    }
}

// MARK: - Capture Button

struct CaptureButton: View {
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .strokeBorder(Color.white, lineWidth: 4)
                    .frame(width: 70, height: 70)
                
                Circle()
                    .fill(Color.white)
                    .frame(width: 60, height: 60)
            }
        }
    }
}

// MARK: - Preview Provider

#Preview {
    CameraView()
}
