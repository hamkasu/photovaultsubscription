//
//  PhotoEntity.swift
//  PhotoVault iOS
//
//  Core Data entity for Photo
//

import CoreData

@objc(PhotoEntity)
public class PhotoEntity: NSManagedObject {
    @NSManaged public var id: UUID?
    @NSManaged public var capturedAt: Date?
    @NSManaged public var isEnhanced: Bool
    @NSManaged public var uploadStatus: String?
    @NSManaged public var uploadedAt: Date?
    @NSManaged public var serverPhotoId: Int64
    @NSManaged public var metadataDescription: String?
    @NSManaged public var tags: String?
    @NSManaged public var people: String?
    @NSManaged public var location: String?
    @NSManaged public var detectedFaces: Int16
}

extension PhotoEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<PhotoEntity> {
        return NSFetchRequest<PhotoEntity>(entityName: "PhotoEntity")
    }
}
