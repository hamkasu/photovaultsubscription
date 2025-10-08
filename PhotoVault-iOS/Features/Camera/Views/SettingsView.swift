//
//  SettingsView.swift
//  PhotoVault iOS
//
//  Camera and app settings
//

import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("edgeDetectionEnabled") private var edgeDetectionEnabled = true
    @AppStorage("autoEnhance") private var autoEnhance = true
    @AppStorage("saveOriginals") private var saveOriginals = false
    
    var body: some View {
        NavigationView {
            List {
                Section("Camera") {
                    Toggle("Edge Detection", isOn: $edgeDetectionEnabled)
                    Toggle("Auto Enhance", isOn: $autoEnhance)
                    Toggle("Save Originals", isOn: $saveOriginals)
                }
                
                Section("Quality") {
                    HStack {
                        Text("Image Quality")
                        Spacer()
                        Text("High")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Enhancement Level")
                        Spacer()
                        Text("Medium")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Storage") {
                    HStack {
                        Text("Local Photos")
                        Spacer()
                        Text("0")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Pending Upload")
                        Spacer()
                        Text("0")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    SettingsView()
}
