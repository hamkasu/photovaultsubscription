//
//  Photo.swift
//  PhotoVault iOS
//
//  Photo data model
//

import UIKit
import Foundation

struct Photo: Identifiable, Codable {
    let id: UUID
    let image: UIImage
    let capturedAt: Date
    let isEnhanced: Bool
    var metadata: PhotoMetadata?
    
    var uploadStatus: UploadStatus = .pending
    var uploadedAt: Date?
    var serverPhotoId: Int?
    
    enum CodingKeys: String, CodingKey {
        case id, capturedAt, isEnhanced, metadata
        case uploadStatus, uploadedAt, serverPhotoId
    }
    
    init(id: UUID, image: UIImage, capturedAt: Date, isEnhanced: Bool, metadata: PhotoMetadata? = nil) {
        self.id = id
        self.image = image
        self.capturedAt = capturedAt
        self.isEnhanced = isEnhanced
        self.metadata = metadata
    }
    
    // Custom encoding/decoding for UIImage
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        capturedAt = try container.decode(Date.self, forKey: .capturedAt)
        isEnhanced = try container.decode(Bool.self, forKey: .isEnhanced)
        metadata = try container.decodeIfPresent(PhotoMetadata.self, forKey: .metadata)
        uploadStatus = try container.decode(UploadStatus.self, forKey: .uploadStatus)
        uploadedAt = try container.decodeIfPresent(Date.self, forKey: .uploadedAt)
        serverPhotoId = try container.decodeIfPresent(Int.self, forKey: .serverPhotoId)
        
        // UIImage will be loaded from file system
        image = UIImage()
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(capturedAt, forKey: .capturedAt)
        try container.encode(isEnhanced, forKey: .isEnhanced)
        try container.encodeIfPresent(metadata, forKey: .metadata)
        try container.encode(uploadStatus, forKey: .uploadStatus)
        try container.encodeIfPresent(uploadedAt, forKey: .uploadedAt)
        try container.encodeIfPresent(serverPhotoId, forKey: .serverPhotoId)
    }
}

struct PhotoMetadata: Codable {
    var description: String?
    var tags: [String]
    var people: [String]
    var location: String?
    var detectedFaces: Int
    
    init(description: String? = nil, tags: [String] = [], people: [String] = [], location: String? = nil, detectedFaces: Int = 0) {
        self.description = description
        self.tags = tags
        self.people = people
        self.location = location
        self.detectedFaces = detectedFaces
    }
}

enum UploadStatus: String, Codable {
    case pending
    case uploading
    case uploaded
    case failed
}

struct User: Codable {
    let id: Int
    let username: String
    let email: String
    var isAdmin: Bool
    var subscription: String?
}
