import SwiftUI

struct RootView: View {
    @Environment(AppViewModel.self) private var appViewModel
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        ZStack {
            // Main navigation content
            if horizontalSizeClass == .regular {
                iPadNavigationView
            } else {
                iPhoneNavigationView
            }

            // Training overlay
            if appViewModel.isTrainingActive, let briefing = appViewModel.activeBriefing {
                RadioSimulatorView(
                    scenario: briefing.scenario,
                    briefing: briefing
                ) {
                    appViewModel.endTrainingSession()
                }
                .transition(.opacity)
                .zIndex(1)
            }
        }
        .animation(.easeInOut(duration: 0.25), value: appViewModel.isTrainingActive)
        .sheet(isPresented: Binding(
            get: { appViewModel.showSettings },
            set: { appViewModel.showSettings = $0 }
        )) {
            SettingsView()
        }
    }

    // MARK: - iPhone Layout

    private var iPhoneNavigationView: some View {
        NavigationStack {
            CategoriesGridView()
                .navigationTitle("Wilco")
                .navigationBarTitleDisplayMode(.inline)
        }
    }

    // MARK: - iPad Layout

    @MainActor
    private var iPadNavigationView: some View {
        @Bindable var viewModel = appViewModel

        return NavigationSplitView {
            CategoriesListView()
                .navigationTitle("Wilco")
                .navigationBarTitleDisplayMode(.inline)
        } content: {
            if let category = appViewModel.selectedCategory {
                ScenariosListViewiPad(category: category)
            } else {
                ContentUnavailableView(
                    "Select a Category",
                    systemImage: "airplane",
                    description: Text("Choose a training category from the sidebar")
                )
            }
        } detail: {
            if let scenario = appViewModel.selectedScenario {
                ScenarioBriefingView(scenario: scenario) { briefing in
                    appViewModel.startTrainingSession(with: briefing)
                } onCancel: {
                    appViewModel.selectedScenario = nil
                }
            } else {
                ContentUnavailableView(
                    "Select a Scenario",
                    systemImage: "radio",
                    description: Text("Choose a scenario to begin training")
                )
            }
        }
    }
}

// MARK: - Categories Grid View (iPhone - uses NavigationLink destination)

struct CategoriesGridView: View {
    @Environment(AppViewModel.self) private var appViewModel
    @State private var viewModel = CategoriesViewModel()

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(viewModel.categories) { category in
                        NavigationLink {
                            ScenariosListView(category: category)
                        } label: {
                            CategoryCardView(
                                category: category,
                                scenarioCount: viewModel.scenarioCount(for: category)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
        .background(Color.appBackground.ignoresSafeArea())
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    appViewModel.showSettings = true
                } label: {
                    Image(systemName: "gear")
                        .foregroundStyle(.white)
                }
            }
        }
        .overlay(alignment: .top) {
            if !NetworkMonitor.shared.isConnected {
                offlineBanner
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Text("ATC Radio Training")
                .font(.title2)
                .fontWeight(.bold)

            Text("Select a training category to begin")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var offlineBanner: some View {
        Text("Offline Mode - Demo responses only")
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(.orange)
            .foregroundStyle(.white)
            .clipShape(Capsule())
            .padding(.top, 8)
    }
}

// MARK: - Scenarios List (iPhone - uses NavigationLink destination)

struct ScenariosListView: View {
    @Environment(AppViewModel.self) private var appViewModel
    @State private var viewModel = ScenariosViewModel()
    let category: Category

    var body: some View {
        List {
            Section {
                categoryHeader
            }
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())

            Section("Scenarios") {
                ForEach(viewModel.allScenarios) { scenario in
                    NavigationLink {
                        ScenarioBriefingView(scenario: scenario) { briefing in
                            appViewModel.startTrainingSession(with: briefing)
                        } onCancel: {
                            // Back button handles it
                        }
                    } label: {
                        ScenarioRowView(scenario: scenario)
                    }
                    .listRowBackground(Color.appSurface)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Color.appBackground.ignoresSafeArea())
        .navigationTitle(category.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadScenarios(for: category)
        }
    }

    private var categoryHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: category.iconName)
                    .font(.title)
                    .foregroundStyle(category.accentColor)

                Spacer()

                HStack(spacing: 4) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.caption)
                    Text(category.frequency)
                        .font(.subheadline)
                        .fontDesign(.monospaced)
                        .fontWeight(.semibold)
                }
                .foregroundStyle(category.accentColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(category.accentColor.opacity(0.15))
                .clipShape(Capsule())
            }

            Text(category.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

// MARK: - Scenarios List for iPad (uses selection binding)

struct ScenariosListViewiPad: View {
    @Environment(AppViewModel.self) private var appViewModel
    @State private var viewModel = ScenariosViewModel()
    let category: Category

    var body: some View {
        @Bindable var vm = appViewModel

        List(selection: $vm.selectedScenario) {
            Section {
                categoryHeader
            }
            .listRowBackground(Color.clear)
            .listRowInsets(EdgeInsets())

            Section("Scenarios") {
                ForEach(viewModel.allScenarios) { scenario in
                    ScenarioRowView(scenario: scenario)
                        .tag(scenario)
                        .listRowBackground(Color.appSurface)
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Color.appBackground.ignoresSafeArea())
        .navigationTitle(category.displayName)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadScenarios(for: category)
        }
    }

    private var categoryHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: category.iconName)
                    .font(.title)
                    .foregroundStyle(category.accentColor)

                Spacer()

                HStack(spacing: 4) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.caption)
                    Text(category.frequency)
                        .font(.subheadline)
                        .fontDesign(.monospaced)
                        .fontWeight(.semibold)
                }
                .foregroundStyle(category.accentColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(category.accentColor.opacity(0.15))
                .clipShape(Capsule())
            }

            Text(category.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

// MARK: - iPad Categories List (Sidebar)

struct CategoriesListView: View {
    @Environment(AppViewModel.self) private var appViewModel
    @State private var viewModel = CategoriesViewModel()

    var body: some View {
        @Bindable var vm = appViewModel

        List(viewModel.categories, selection: $vm.selectedCategory) { category in
            Label {
                VStack(alignment: .leading, spacing: 4) {
                    Text(category.displayName)
                        .font(.headline)
                    Text("\(viewModel.scenarioCount(for: category)) scenarios")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: category.iconName)
                    .foregroundStyle(category.accentColor)
            }
            .tag(category)
        }
        .onChange(of: appViewModel.selectedCategory) { _, _ in
            appViewModel.selectedScenario = nil
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    appViewModel.showSettings = true
                } label: {
                    Image(systemName: "gear")
                }
            }
        }
    }
}

#Preview {
    RootView()
        .environment(AppViewModel())
}
