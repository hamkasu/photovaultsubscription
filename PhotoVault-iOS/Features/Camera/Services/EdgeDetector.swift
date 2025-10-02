//
//  EdgeDetector.swift
//  PhotoVault iOS
//
//  Detects photo edges using Vision framework
//

import Vision
import CoreImage
import UIKit

class EdgeDetector {
    
    struct DetectedPhoto {
        let corners: [CGPoint]
        let confidence: Float
        let normalizedCorners: [CGPoint]
    }
    
    // MARK: - Real-time Detection
    
    func detectEdgesInFrame(_ pixelBuffer: CVPixelBuffer, orientation: CGImagePropertyOrientation = .up) async -> DetectedPhoto? {
        let request = VNDetectRectanglesRequest()
        request.maximumObservations = 1
        request.minimumConfidence = 0.6
        request.minimumAspectRatio = 0.3
        request.maximumAspectRatio = 1.0
        
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: orientation)
        
        do {
            try handler.perform([request])
            
            guard let observation = request.results?.first else {
                return nil
            }
            
            // Convert normalized coordinates to pixel coordinates
            let imageSize = CGSize(
                width: CVPixelBufferGetWidth(pixelBuffer),
                height: CVPixelBufferGetHeight(pixelBuffer)
            )
            
            let corners = [
                observation.topLeft,
                observation.topRight,
                observation.bottomRight,
                observation.bottomLeft
            ].map { normalizedPoint in
                CGPoint(
                    x: normalizedPoint.x * imageSize.width,
                    y: (1 - normalizedPoint.y) * imageSize.height
                )
            }
            
            let normalizedCorners = [
                observation.topLeft,
                observation.topRight,
                observation.bottomRight,
                observation.bottomLeft
            ]
            
            return DetectedPhoto(
                corners: corners,
                confidence: observation.confidence,
                normalizedCorners: normalizedCorners
            )
        } catch {
            print("Edge detection failed: \(error)")
            return nil
        }
    }
    
    // MARK: - Static Image Detection
    
    func detectEdges(in image: UIImage) async -> DetectedPhoto? {
        guard let cgImage = image.cgImage else { return nil }
        
        let request = VNDetectRectanglesRequest()
        request.maximumObservations = 1
        request.minimumConfidence = 0.7
        request.minimumAspectRatio = 0.3
        request.maximumAspectRatio = 1.0
        
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        
        do {
            try handler.perform([request])
            
            guard let observation = request.results?.first else {
                return nil
            }
            
            let imageSize = image.size
            let corners = [
                observation.topLeft,
                observation.topRight,
                observation.bottomRight,
                observation.bottomLeft
            ].map { normalizedPoint in
                CGPoint(
                    x: normalizedPoint.x * imageSize.width,
                    y: (1 - normalizedPoint.y) * imageSize.height
                )
            }
            
            return DetectedPhoto(
                corners: corners,
                confidence: observation.confidence,
                normalizedCorners: [
                    observation.topLeft,
                    observation.topRight,
                    observation.bottomRight,
                    observation.bottomLeft
                ]
            )
        } catch {
            print("Edge detection failed: \(error)")
            return nil
        }
    }
}
