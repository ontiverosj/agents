import SwiftUI

struct ContentView: View {
    @StateObject private var model = DiagnosticsModel()
    @Environment(\.scenePhase) private var scenePhase

    private let refreshTimer = Timer.publish(every: 3, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            List {
                healthSection
                if !model.recommendations.isEmpty {
                    recommendationsSection
                }
                batterySection
                thermalSection
                storageSection
                memorySection
                cpuSection
                systemSection
            }
            .navigationTitle("Phone Health")
            .onReceive(refreshTimer) { _ in
                model.refresh()
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { model.refresh() }
            }
            .refreshable {
                model.refresh()
            }
        }
    }

    // MARK: Sections

    private var healthSection: some View {
        Section {
            HStack(spacing: 14) {
                Image(systemName: overallSymbol)
                    .font(.system(size: 40))
                    .foregroundStyle(Color(model.overallSeverity.color))
                VStack(alignment: .leading, spacing: 2) {
                    Text(overallTitle)
                        .font(.headline)
                    Text(overallSubtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 6)
        }
    }

    private var recommendationsSection: some View {
        Section("What to do") {
            ForEach(model.recommendations) { item in
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: item.symbolName)
                        .font(.title3)
                        .foregroundStyle(Color(item.severity.color))
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.title)
                            .font(.subheadline.weight(.semibold))
                        Text(item.detail)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }

    private var batterySection: some View {
        Section("Battery") {
            MetricRow(label: "Charge", value: model.batteryLevelText,
                      severity: batterySeverity)
            MetricRow(label: "State", value: model.batteryStateText)
            MetricRow(label: "Low Power Mode", value: model.lowPowerMode ? "On" : "Off",
                      severity: model.lowPowerMode ? .warning : .good)
        }
    }

    private var thermalSection: some View {
        Section("Temperature") {
            MetricRow(label: "Thermal state", value: model.thermalStateText,
                      severity: model.thermalSeverity)
        }
    }

    private var storageSection: some View {
        Section("Storage") {
            MetricRow(label: "Free space", value: DiagnosticsModel.formatBytes(model.storageFree),
                      severity: model.storageSeverity)
            MetricRow(label: "Total", value: DiagnosticsModel.formatBytes(model.storageTotal))
            if model.storageTotal > 0 {
                usageBar(fraction: 1 - Double(model.storageFree) / Double(model.storageTotal),
                         severity: model.storageSeverity)
            }
        }
    }

    private var memorySection: some View {
        Section("Memory (RAM)") {
            MetricRow(label: "Available", value: DiagnosticsModel.formatBytes(model.memoryFree))
            MetricRow(label: "In use (active)", value: DiagnosticsModel.formatBytes(model.memoryActive))
            MetricRow(label: "Reserved by iOS", value: DiagnosticsModel.formatBytes(model.memoryWired))
            MetricRow(label: "Total", value: DiagnosticsModel.formatBytes(model.memoryTotal))
        }
    }

    private var cpuSection: some View {
        Section("Processor") {
            MetricRow(label: "CPU load",
                      value: model.cpuUsage.map { "\(Int($0 * 100))%" } ?? "Measuring…",
                      severity: (model.cpuUsage ?? 0) > 0.85 ? .warning : .good)
        }
    }

    private var systemSection: some View {
        Section("System") {
            MetricRow(label: "Model", value: model.modelName)
            MetricRow(label: "Software", value: model.systemVersion)
            MetricRow(label: "Time since restart", value: model.uptimeText,
                      severity: model.uptime > 7 * 86_400 ? .warning : .good)
        } footer: {
            if let refreshed = model.lastRefreshed {
                Text("Updated \(refreshed.formatted(date: .omitted, time: .standard)) — refreshes every 3 seconds")
            }
        }
    }

    // MARK: Helpers

    private var batterySeverity: Severity {
        guard model.batteryLevel >= 0 else { return .good }
        if model.batteryLevel < 0.1 { return .critical }
        if model.batteryLevel < 0.2 { return .warning }
        return .good
    }

    private var overallSymbol: String {
        switch model.overallSeverity {
        case .good: return "checkmark.circle.fill"
        case .warning: return "exclamationmark.triangle.fill"
        case .critical: return "xmark.octagon.fill"
        }
    }

    private var overallTitle: String {
        switch model.overallSeverity {
        case .good: return "Looking healthy"
        case .warning: return "Needs attention"
        case .critical: return "Problems found"
        }
    }

    private var overallSubtitle: String {
        model.recommendations.isEmpty
            ? "No issues detected in what iOS lets apps measure."
            : "\(model.recommendations.count) item\(model.recommendations.count == 1 ? "" : "s") to review below."
    }

    private func usageBar(fraction: Double, severity: Severity) -> some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color(.systemGray5))
                Capsule()
                    .fill(Color(severity.color))
                    .frame(width: proxy.size.width * min(max(fraction, 0), 1))
            }
        }
        .frame(height: 8)
        .padding(.vertical, 6)
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    var severity: Severity = .good

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            if severity != .good {
                Circle()
                    .fill(Color(severity.color))
                    .frame(width: 8, height: 8)
            }
            Text(value)
                .foregroundStyle(.secondary)
                .monospacedDigit()
        }
    }
}

#Preview {
    ContentView()
}
