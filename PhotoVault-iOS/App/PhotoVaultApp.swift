//
//  PhotoVaultApp.swift
//  PhotoVault iOS
//
//  Main app entry point for PhotoVault iOS
//

import SwiftUI

@main
struct PhotoVaultApp: App {
    @StateObject private var appState = AppState()
    
    init() {
        // Configure app on launch
        CameraManager.requestCameraPermission()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

// MARK: - App State
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    init() {
        // Check if user is logged in
        checkAuthStatus()
    }
    
    private func checkAuthStatus() {
        // TODO: Check keychain for auth token
        isAuthenticated = false
    }
}

// MARK: - Content View
struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationView {
            CameraView()
                .navigationTitle("PhotoVault")
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}
