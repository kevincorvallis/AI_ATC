import SwiftUI

/// Simplified airport diagram showing runways, taxiways, and current position
struct AirportDiagramView: View {
    let airport: AirportInfo
    let taxiRoute: TaxiRoute?
    let showRouteHighlight: Bool

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Background
                Color(white: 0.15)

                // Grid pattern (like real charts)
                gridPattern(in: geo.size)

                // Runways
                runwaysView(in: geo.size)

                // Taxiways
                taxiwaysView(in: geo.size)

                // Labels
                labelsView(in: geo.size)

                // Route highlight (if showing)
                if showRouteHighlight, let route = taxiRoute {
                    routeHighlight(route: route, in: geo.size)
                }

                // Position marker
                if let route = taxiRoute {
                    positionMarker(at: route.from, in: geo.size)
                }

                // Legend
                legendView
            }
        }
    }

    // MARK: - Grid Pattern

    private func gridPattern(in size: CGSize) -> some View {
        Canvas { context, size in
            let spacing: CGFloat = 30

            // Vertical lines
            for x in stride(from: 0, through: size.width, by: spacing) {
                var path = Path()
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                context.stroke(path, with: .color(.white.opacity(0.05)), lineWidth: 0.5)
            }

            // Horizontal lines
            for y in stride(from: 0, through: size.height, by: spacing) {
                var path = Path()
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                context.stroke(path, with: .color(.white.opacity(0.05)), lineWidth: 0.5)
            }
        }
    }

    // MARK: - Runways

    private func runwaysView(in size: CGSize) -> some View {
        let centerX = size.width / 2
        let centerY = size.height / 2

        return ZStack {
            // Main runway 27L/9R (horizontal, main)
            Rectangle()
                .fill(Color.gray.opacity(0.4))
                .frame(width: size.width * 0.85, height: 18)
                .position(x: centerX, y: centerY)

            // Runway markings
            ForEach(0..<8) { i in
                Rectangle()
                    .fill(Color.white.opacity(0.6))
                    .frame(width: 15, height: 2)
                    .position(
                        x: centerX - size.width * 0.35 + CGFloat(i) * (size.width * 0.7 / 7),
                        y: centerY
                    )
            }

            // Secondary runway 36/18 (vertical)
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 12, height: size.height * 0.7)
                .position(x: centerX - size.width * 0.15, y: centerY)

            // Runway 27R/9L (parallel, shorter)
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: size.width * 0.6, height: 12)
                .position(x: centerX + size.width * 0.05, y: centerY + 50)
        }
    }

    // MARK: - Taxiways

    private func taxiwaysView(in size: CGSize) -> some View {
        let centerX = size.width / 2
        let centerY = size.height / 2

        return ZStack {
            // Taxiway A (main parallel)
            Rectangle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: size.width * 0.75, height: 8)
                .position(x: centerX, y: centerY - 40)

            // Taxiway B (connector)
            Rectangle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: 8, height: 60)
                .position(x: centerX - size.width * 0.25, y: centerY - 40)

            // Taxiway C (connector)
            Rectangle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: 8, height: 80)
                .position(x: centerX - size.width * 0.35, y: centerY - 20)

            // Taxiway D (to ramp)
            Rectangle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: 60, height: 8)
                .position(x: centerX - size.width * 0.35 + 30, y: centerY - 70)

            // FBO/Ramp area
            RoundedRectangle(cornerRadius: 4)
                .fill(Color.blue.opacity(0.2))
                .frame(width: 50, height: 40)
                .position(x: centerX - size.width * 0.35, y: centerY - 90)
        }
    }

    // MARK: - Labels

    private func labelsView(in size: CGSize) -> some View {
        let centerX = size.width / 2
        let centerY = size.height / 2

        return ZStack {
            // Runway labels
            Text("27L")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .position(x: 25, y: centerY)

            Text("9R")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .position(x: size.width - 25, y: centerY)

            Text("36")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white)
                .position(x: centerX - size.width * 0.15, y: 20)

            Text("18")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.white)
                .position(x: centerX - size.width * 0.15, y: size.height - 20)

            // Taxiway labels
            Text("A")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.yellow)
                .padding(3)
                .background(Circle().fill(Color.black.opacity(0.5)))
                .position(x: centerX + size.width * 0.2, y: centerY - 40)

            Text("B")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.yellow)
                .padding(3)
                .background(Circle().fill(Color.black.opacity(0.5)))
                .position(x: centerX - size.width * 0.25, y: centerY - 55)

            Text("C")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.yellow)
                .padding(3)
                .background(Circle().fill(Color.black.opacity(0.5)))
                .position(x: centerX - size.width * 0.35 + 10, y: centerY - 45)

            Text("D")
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(.yellow)
                .padding(3)
                .background(Circle().fill(Color.black.opacity(0.5)))
                .position(x: centerX - size.width * 0.35 + 50, y: centerY - 70)

            // FBO label
            Text("FBO")
                .font(.system(size: 8, weight: .semibold))
                .foregroundStyle(.cyan)
                .position(x: centerX - size.width * 0.35, y: centerY - 90)
        }
    }

    // MARK: - Route Highlight

    private func routeHighlight(route: TaxiRoute, in size: CGSize) -> some View {
        let centerX = size.width / 2
        let centerY = size.height / 2

        return Canvas { context, size in
            var path = Path()

            // Start at FBO
            let start = CGPoint(x: centerX - size.width * 0.35, y: centerY - 90)
            path.move(to: start)

            // Through D
            path.addLine(to: CGPoint(x: centerX - size.width * 0.35 + 30, y: centerY - 70))

            // To A
            path.addLine(to: CGPoint(x: centerX - size.width * 0.35 + 30, y: centerY - 40))

            // Along A to runway
            path.addLine(to: CGPoint(x: 30, y: centerY - 40))

            // Down to runway
            path.addLine(to: CGPoint(x: 30, y: centerY))

            context.stroke(
                path,
                with: .color(.green),
                style: StrokeStyle(lineWidth: 4, dash: [6, 4])
            )
        }
    }

    // MARK: - Position Marker

    private func positionMarker(at position: String, in size: CGSize) -> some View {
        let centerX = size.width / 2
        let centerY = size.height / 2

        // Position at FBO for now
        let markerPosition = CGPoint(x: centerX - size.width * 0.35, y: centerY - 90)

        return ZStack {
            // Pulsing circle
            Circle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: 30, height: 30)

            // Aircraft icon
            Image(systemName: "airplane")
                .font(.system(size: 14))
                .foregroundStyle(.blue)
                .rotationEffect(.degrees(-90))
        }
        .position(markerPosition)
    }

    // MARK: - Legend

    private var legendView: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Rectangle().fill(Color.gray.opacity(0.4)).frame(width: 12, height: 3)
                Text("Runway").font(.system(size: 7))
            }
            HStack(spacing: 4) {
                Rectangle().fill(Color.blue.opacity(0.3)).frame(width: 12, height: 3)
                Text("Taxiway").font(.system(size: 7))
            }
            if showRouteHighlight {
                HStack(spacing: 4) {
                    Rectangle().fill(Color.green).frame(width: 12, height: 2)
                    Text("Your Route").font(.system(size: 7))
                }
            }
        }
        .foregroundStyle(.white.opacity(0.7))
        .padding(6)
        .background(Color.black.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 4))
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        .padding(8)
    }
}

#Preview {
    AirportDiagramView(
        airport: .metro,
        taxiRoute: TaxiRoute(
            from: "FBO Ramp",
            to: "Runway 27L",
            via: ["D", "A"],
            holdShort: ["27L"],
            crossings: nil
        ),
        showRouteHighlight: true
    )
    .frame(height: 250)
    .preferredColorScheme(.dark)
}
