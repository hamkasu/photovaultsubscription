//
//  PhotoPreviewView.swift
//  PhotoVault iOS
//
//  Preview captured/enhanced photo before saving
//

import SwiftUI

struct PhotoPreviewView: View {
    let image: UIImage?
    let onSave: () -> Void
    let onRetake: () -> Void
    
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            
            VStack {
                // Close Button
                HStack {
                    Button(action: {
                        onRetake()
                        dismiss()
                    }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                    }
                    
                    Spacer()
                }
                
                // Photo Preview
                if let image = image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding()
                }
                
                // Action Buttons
                HStack(spacing: 60) {
                    // Retake
                    Button(action: {
                        onRetake()
                        dismiss()
                    }) {
                        VStack(spacing: 8) {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.title)
                            Text("Retake")
                                .font(.caption)
                        }
                        .foregroundColor(.white)
                    }
                    
                    // Save
                    Button(action: {
                        onSave()
                        dismiss()
                    }) {
                        VStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 44))
                            Text("Save")
                                .font(.caption)
                        }
                        .foregroundColor(.green)
                    }
                    
                    // Share
                    Button(action: {
                        sharePhoto()
                    }) {
                        VStack(spacing: 8) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.title)
                            Text("Share")
                                .font(.caption)
                        }
                        .foregroundColor(.white)
                    }
                }
                .padding(.bottom, 40)
            }
        }
    }
    
    private func sharePhoto() {
        guard let image = image else { return }
        
        let activityVC = UIActivityViewController(
            activityItems: [image],
            applicationActivities: nil
        )
        
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootVC = windowScene.windows.first?.rootViewController {
            rootVC.present(activityVC, animated: true)
        }
    }
}

#Preview {
    PhotoPreviewView(
        image: UIImage(systemName: "photo"),
        onSave: {},
        onRetake: {}
    )
}
