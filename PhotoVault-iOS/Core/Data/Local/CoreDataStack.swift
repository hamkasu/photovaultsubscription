//
//  CoreDataStack.swift
//  PhotoVault iOS
//
//  Core Data stack for local persistence
//

import CoreData
import Foundation

class CoreDataStack {
    static let shared = CoreDataStack()
    
    private init() {}
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "PhotoVault")
        
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Failed to load Core Data: \(error)")
            }
            print("Core Data loaded successfully")
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        return container
    }()
    
    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }
    
    func newBackgroundContext() -> NSManagedObjectContext {
        persistentContainer.newBackgroundContext()
    }
    
    func saveContext() {
        let context = viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Failed to save context: \(error)")
            }
        }
    }
}

// MARK: - Photo Storage Helper

extension CoreDataStack {
    func savePhoto(_ photo: Photo) async throws {
        let context = newBackgroundContext()
        
        try await context.perform {
            // Save image to file system
            let imageURL = self.imageURL(for: photo.id)
            if let imageData = photo.image.jpegData(compressionQuality: 0.9) {
                try imageData.write(to: imageURL)
            }
            
            // Save metadata to Core Data
            let photoEntity = PhotoEntity(context: context)
            photoEntity.id = photo.id
            photoEntity.capturedAt = photo.capturedAt
            photoEntity.isEnhanced = photo.isEnhanced
            photoEntity.uploadStatus = photo.uploadStatus.rawValue
            photoEntity.uploadedAt = photo.uploadedAt
            photoEntity.serverPhotoId = photo.serverPhotoId.map { Int64($0) } ?? 0
            
            if let metadata = photo.metadata {
                photoEntity.metadataDescription = metadata.description
                photoEntity.tags = metadata.tags.joined(separator: ",")
                photoEntity.people = metadata.people.joined(separator: ",")
                photoEntity.location = metadata.location
                photoEntity.detectedFaces = Int16(metadata.detectedFaces)
            }
            
            try context.save()
        }
    }
    
    func fetchPhotos() async throws -> [Photo] {
        let context = newBackgroundContext()
        
        return try await context.perform {
            let request = PhotoEntity.fetchRequest()
            request.sortDescriptors = [NSSortDescriptor(keyPath: \PhotoEntity.capturedAt, ascending: false)]
            
            let entities = try context.fetch(request)
            
            return entities.compactMap { entity -> Photo? in
                guard let id = entity.id else { return nil }
                
                let imageURL = self.imageURL(for: id)
                guard let imageData = try? Data(contentsOf: imageURL),
                      let image = UIImage(data: imageData) else {
                    return nil
                }
                
                let metadata = PhotoMetadata(
                    description: entity.metadataDescription,
                    tags: entity.tags?.components(separatedBy: ",") ?? [],
                    people: entity.people?.components(separatedBy: ",") ?? [],
                    location: entity.location,
                    detectedFaces: Int(entity.detectedFaces)
                )
                
                var photo = Photo(
                    id: id,
                    image: image,
                    capturedAt: entity.capturedAt ?? Date(),
                    isEnhanced: entity.isEnhanced,
                    metadata: metadata
                )
                
                photo.uploadStatus = UploadStatus(rawValue: entity.uploadStatus ?? "pending") ?? .pending
                photo.uploadedAt = entity.uploadedAt
                photo.serverPhotoId = entity.serverPhotoId > 0 ? Int(entity.serverPhotoId) : nil
                
                return photo
            }
        }
    }
    
    private func imageURL(for id: UUID) -> URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent("\(id.uuidString).jpg")
    }
}
