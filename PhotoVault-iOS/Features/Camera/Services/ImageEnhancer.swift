//
//  ImageEnhancer.swift
//  PhotoVault iOS
//
//  Enhances photos using Core Image filters
//

import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

class ImageEnhancer {
    private let context = CIContext()
    
    // MARK: - Full Enhancement Pipeline
    
    func enhance(_ image: UIImage, with corners: [CGPoint]?) async -> UIImage? {
        guard var ciImage = CIImage(image: image) else { return nil }
        
        // 1. Perspective correction if corners provided
        if let corners = corners, corners.count == 4 {
            ciImage = applyPerspectiveCorrection(ciImage, corners: corners)
        }
        
        // 2. Auto color enhancement
        ciImage = applyAutoEnhancement(ciImage)
        
        // 3. Denoise
        ciImage = applyDenoise(ciImage)
        
        // 4. Sharpen
        ciImage = applySharpen(ciImage)
        
        // Convert back to UIImage
        return ciImage.toUIImage(context: context)
    }
    
    // MARK: - Individual Enhancements
    
    func applyPerspectiveCorrection(_ image: CIImage, corners: [CGPoint]) -> CIImage {
        guard corners.count == 4 else { return image }
        
        let perspectiveFilter = CIFilter.perspectiveCorrection()
        perspectiveFilter.inputImage = image
        
        // Map corners to CIVector
        perspectiveFilter.topLeft = CIVector(cgPoint: corners[0])
        perspectiveFilter.topRight = CIVector(cgPoint: corners[1])
        perspectiveFilter.bottomRight = CIVector(cgPoint: corners[2])
        perspectiveFilter.bottomLeft = CIVector(cgPoint: corners[3])
        
        return perspectiveFilter.outputImage ?? image
    }
    
    func applyAutoEnhancement(_ image: CIImage) -> CIImage {
        // Auto color adjustment
        let colorFilter = CIFilter.colorControls()
        colorFilter.inputImage = image
        colorFilter.saturation = 1.1
        colorFilter.brightness = 0.05
        colorFilter.contrast = 1.15
        
        guard let output = colorFilter.outputImage else { return image }
        
        // Exposure adjustment
        let exposureFilter = CIFilter.exposureAdjust()
        exposureFilter.inputImage = output
        exposureFilter.ev = 0.2
        
        return exposureFilter.outputImage ?? output
    }
    
    func applyDenoise(_ image: CIImage) -> CIImage {
        let noiseFilter = CIFilter.noiseReduction()
        noiseFilter.inputImage = image
        noiseFilter.noiseLevel = 0.02
        noiseFilter.sharpness = 0.4
        
        return noiseFilter.outputImage ?? image
    }
    
    func applySharpen(_ image: CIImage) -> CIImage {
        let sharpenFilter = CIFilter.sharpenLuminance()
        sharpenFilter.inputImage = image
        sharpenFilter.sharpness = 0.6
        
        return sharpenFilter.outputImage ?? image
    }
    
    // MARK: - Color Restoration (for faded photos)
    
    func restoreColors(_ image: CIImage) -> CIImage {
        let vibranceFilter = CIFilter.vibrance()
        vibranceFilter.inputImage = image
        vibranceFilter.amount = 0.5
        
        guard let output = vibranceFilter.outputImage else { return image }
        
        // Enhance highlights and shadows
        let highlightFilter = CIFilter.highlightShadowAdjust()
        highlightFilter.inputImage = output
        highlightFilter.highlightAmount = 0.3
        highlightFilter.shadowAmount = 0.3
        
        return highlightFilter.outputImage ?? output
    }
}

// MARK: - CIImage Extension

extension CIImage {
    func toUIImage(context: CIContext) -> UIImage? {
        guard let cgImage = context.createCGImage(self, from: self.extent) else {
            return nil
        }
        return UIImage(cgImage: cgImage)
    }
}
