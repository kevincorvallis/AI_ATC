import SwiftUI

struct PhraseologyGuideView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedCategory: Category = .patternWork

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category Picker
                Picker("Category", selection: $selectedCategory) {
                    ForEach(Category.allCases) { category in
                        Text(category.displayName).tag(category)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Tips List
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(ATCExamples.phraseologyTips[selectedCategory] ?? []) { tip in
                            PhraseologyCard(tip: tip, category: selectedCategory)
                        }
                    }
                    .padding()
                }
            }
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Phraseology Guide")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct PhraseologyCard: View {
    let tip: ATCExamples.PhraseologyTip
    let category: Category

    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            Button {
                withAnimation(.spring(response: 0.3)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(tip.situation)
                            .font(.headline)
                            .foregroundStyle(.white)

                        if !isExpanded {
                            Text("Tap to see example")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up.circle.fill" : "chevron.down.circle.fill")
                        .foregroundStyle(category.accentColor)
                        .font(.title2)
                }
            }
            .buttonStyle(.plain)

            if isExpanded {
                Divider()
                    .background(Color.appSurfaceLight)

                // Pilot Says
                VStack(alignment: .leading, spacing: 6) {
                    Label("You Say", systemImage: "person.wave.2.fill")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.blue)

                    Text(tip.pilotSays)
                        .font(.callout)
                        .fontDesign(.monospaced)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.blue.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // ATC Replies
                VStack(alignment: .leading, spacing: 6) {
                    Label("ATC Replies", systemImage: "antenna.radiowaves.left.and.right")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.green)

                    Text(tip.atcReplies)
                        .font(.callout)
                        .fontDesign(.monospaced)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Notes
                if !tip.notes.isEmpty {
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(.yellow)

                        Text(tip.notes)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(10)
                    .background(Color.yellow.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding()
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(category.accentColor.opacity(isExpanded ? 0.3 : 0), lineWidth: 1)
        )
    }
}

#Preview {
    PhraseologyGuideView()
        .preferredColorScheme(.dark)
}
