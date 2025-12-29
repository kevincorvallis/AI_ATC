import SwiftUI

struct DemoListView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedDemo: ATCExamples.DemoConversation?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection

                    // Demo Cards
                    ForEach(ATCExamples.allDemos) { demo in
                        DemoCard(demo: demo) {
                            selectedDemo = demo
                        }
                    }
                }
                .padding()
            }
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Watch Demos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .fullScreenCover(item: $selectedDemo) { demo in
                DemoPlayerView(demo: demo) {
                    selectedDemo = nil
                }
            }
        }
    }

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "play.rectangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.blue)

            Text("Learn by Watching")
                .font(.headline)

            Text("Watch realistic ATC conversations to learn proper phraseology and procedures before practicing yourself.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct DemoCard: View {
    let demo: ATCExamples.DemoConversation
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                // Play Icon
                ZStack {
                    Circle()
                        .fill(demo.category.accentColor.opacity(0.15))
                        .frame(width: 56, height: 56)

                    Image(systemName: "play.fill")
                        .font(.title2)
                        .foregroundStyle(demo.category.accentColor)
                }

                // Content
                VStack(alignment: .leading, spacing: 6) {
                    Text(demo.title)
                        .font(.headline)
                        .foregroundStyle(.white)

                    Text(demo.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)

                    // Metadata
                    HStack(spacing: 12) {
                        Label(demo.category.displayName, systemImage: demo.category.iconName)
                        Label("\(demo.exchanges.count) exchanges", systemImage: "bubble.left.and.bubble.right")
                    }
                    .font(.caption2)
                    .foregroundStyle(demo.category.accentColor)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color.appSurface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    DemoListView()
        .preferredColorScheme(.dark)
}
