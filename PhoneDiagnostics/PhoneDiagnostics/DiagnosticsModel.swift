import Foundation
import UIKit

// MARK: - Data types

enum Severity: Int, Comparable {
    case good = 0
    case warning = 1
    case critical = 2

    static func < (lhs: Severity, rhs: Severity) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    var color: UIColor {
        switch self {
        case .good: return .systemGreen
        case .warning: return .systemOrange
        case .critical: return .systemRed
        }
    }
}

struct Recommendation: Identifiable {
    let id = UUID()
    let severity: Severity
    let title: String
    let detail: String
    let symbolName: String
}

// MARK: - Model

@MainActor
final class DiagnosticsModel: ObservableObject {

    // Battery
    @Published var batteryLevel: Float = -1            // 0...1, -1 = unknown
    @Published var batteryState: UIDevice.BatteryState = .unknown
    @Published var lowPowerMode = false

    // Thermal
    @Published var thermalState: ProcessInfo.ThermalState = .nominal

    // Storage (bytes)
    @Published var storageTotal: Int64 = 0
    @Published var storageFree: Int64 = 0

    // Memory (bytes)
    @Published var memoryTotal: UInt64 = 0
    @Published var memoryFree: UInt64 = 0
    @Published var memoryActive: UInt64 = 0
    @Published var memoryWired: UInt64 = 0

    // CPU (0...1, nil until two samples exist)
    @Published var cpuUsage: Double?

    // System
    @Published var uptime: TimeInterval = 0
    @Published var modelName = ""
    @Published var systemVersion = ""

    @Published var recommendations: [Recommendation] = []
    @Published var overallSeverity: Severity = .good
    @Published var lastRefreshed: Date?

    private var previousCPUTicks: (idle: UInt64, total: UInt64)?

    init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        modelName = Self.deviceModelName()
        systemVersion = "\(UIDevice.current.systemName) \(UIDevice.current.systemVersion)"
        refresh()
    }

    func refresh() {
        let device = UIDevice.current
        let process = ProcessInfo.processInfo

        batteryLevel = device.batteryLevel
        batteryState = device.batteryState
        lowPowerMode = process.isLowPowerModeEnabled
        thermalState = process.thermalState
        uptime = process.systemUptime
        memoryTotal = process.physicalMemory

        refreshStorage()
        refreshMemory()
        refreshCPU()
        rebuildRecommendations()

        lastRefreshed = Date()
    }

    // MARK: Storage

    private func refreshStorage() {
        let homeURL = URL(fileURLWithPath: NSHomeDirectory())
        let keys: Set<URLResourceKey> = [
            .volumeAvailableCapacityForImportantUsageKey,
            .volumeTotalCapacityKey,
        ]
        guard let values = try? homeURL.resourceValues(forKeys: keys) else { return }
        if let free = values.volumeAvailableCapacityForImportantUsage {
            storageFree = free
        }
        if let total = values.volumeTotalCapacity {
            storageTotal = Int64(total)
        }
    }

    // MARK: Memory (Mach host statistics)

    private func refreshMemory() {
        var stats = vm_statistics64_data_t()
        var count = mach_msg_type_number_t(
            MemoryLayout<vm_statistics64_data_t>.stride / MemoryLayout<integer_t>.stride
        )
        let result = withUnsafeMutablePointer(to: &stats) { statsPtr in
            statsPtr.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { intPtr in
                host_statistics64(mach_host_self(), HOST_VM_INFO64, intPtr, &count)
            }
        }
        guard result == KERN_SUCCESS else { return }

        let pageSize = UInt64(vm_kernel_page_size)
        memoryFree = (UInt64(stats.free_count) + UInt64(stats.inactive_count)) * pageSize
        memoryActive = UInt64(stats.active_count) * pageSize
        memoryWired = UInt64(stats.wire_count) * pageSize
    }

    // MARK: CPU (delta between two tick samples)

    private func refreshCPU() {
        guard let current = Self.cpuTicks() else { return }
        defer { previousCPUTicks = current }

        guard let previous = previousCPUTicks else { return }
        let totalDelta = current.total &- previous.total
        let idleDelta = current.idle &- previous.idle
        guard totalDelta > 0 else { return }
        cpuUsage = 1.0 - Double(idleDelta) / Double(totalDelta)
    }

    private static func cpuTicks() -> (idle: UInt64, total: UInt64)? {
        var info = host_cpu_load_info_data_t()
        var count = mach_msg_type_number_t(
            MemoryLayout<host_cpu_load_info_data_t>.stride / MemoryLayout<integer_t>.stride
        )
        let result = withUnsafeMutablePointer(to: &info) { infoPtr in
            infoPtr.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { intPtr in
                host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, intPtr, &count)
            }
        }
        guard result == KERN_SUCCESS else { return nil }

        let user = UInt64(info.cpu_ticks.0)
        let system = UInt64(info.cpu_ticks.1)
        let idle = UInt64(info.cpu_ticks.2)
        let nice = UInt64(info.cpu_ticks.3)
        return (idle: idle, total: user + system + idle + nice)
    }

    // MARK: Device model

    private static func deviceModelName() -> String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let identifier = withUnsafeBytes(of: &systemInfo.machine) { buffer in
            String(decoding: buffer.prefix(while: { $0 != 0 }), as: UTF8.self)
        }

        let knownModels: [String: String] = [
            "iPhone13,1": "iPhone 12 mini",
            "iPhone13,2": "iPhone 12",
            "iPhone13,3": "iPhone 12 Pro",
            "iPhone13,4": "iPhone 12 Pro Max",
            "iPhone14,4": "iPhone 13 mini",
            "iPhone14,5": "iPhone 13",
            "iPhone14,2": "iPhone 13 Pro",
            "iPhone14,3": "iPhone 13 Pro Max",
            "iPhone14,7": "iPhone 14",
            "iPhone14,8": "iPhone 14 Plus",
            "iPhone15,2": "iPhone 14 Pro",
            "iPhone15,3": "iPhone 14 Pro Max",
            "iPhone15,4": "iPhone 15",
            "iPhone15,5": "iPhone 15 Plus",
            "iPhone16,1": "iPhone 15 Pro",
            "iPhone16,2": "iPhone 15 Pro Max",
            "iPhone17,3": "iPhone 16",
            "iPhone17,4": "iPhone 16 Plus",
            "iPhone17,1": "iPhone 16 Pro",
            "iPhone17,2": "iPhone 16 Pro Max",
        ]
        return knownModels[identifier] ?? identifier
    }

    // MARK: Recommendations

    private func rebuildRecommendations() {
        var items: [Recommendation] = []

        // Uptime: iOS benefits from an occasional reboot.
        let days = uptime / 86_400
        if days >= 7 {
            items.append(Recommendation(
                severity: days >= 21 ? .critical : .warning,
                title: "Restart your phone",
                detail: String(format: "It has been running for %.0f days without a reboot. A restart clears memory leaks and stuck processes, and is the single best fix for freezing.", days),
                symbolName: "arrow.clockwise.circle"
            ))
        }

        // Storage pressure: iOS misbehaves when the disk is nearly full.
        if storageTotal > 0 {
            let freeGB = Double(storageFree) / 1_000_000_000
            if freeGB < 5 {
                items.append(Recommendation(
                    severity: .critical,
                    title: "Storage critically low",
                    detail: String(format: "Only %.1f GB free. Below ~5 GB, iOS slows down and apps can freeze or crash. Delete old videos or offload unused apps in Settings > General > iPhone Storage.", freeGB),
                    symbolName: "externaldrive.badge.exclamationmark"
                ))
            } else if freeGB < 10 {
                items.append(Recommendation(
                    severity: .warning,
                    title: "Storage getting low",
                    detail: String(format: "%.1f GB free. Try to keep at least 10 GB free so iOS has room to work.", freeGB),
                    symbolName: "externaldrive.badge.exclamationmark"
                ))
            }
        }

        // Thermal throttling directly causes lag.
        switch thermalState {
        case .serious:
            items.append(Recommendation(
                severity: .warning,
                title: "Phone is running hot",
                detail: "iOS is throttling performance to cool down. Close camera/GPS-heavy apps, take the case off, and keep it out of the sun.",
                symbolName: "thermometer.high"
            ))
        case .critical:
            items.append(Recommendation(
                severity: .critical,
                title: "Phone is overheating",
                detail: "Performance is heavily throttled and the phone may shut down. Stop charging and let it cool before using it.",
                symbolName: "thermometer.high"
            ))
        default:
            break
        }

        if lowPowerMode {
            items.append(Recommendation(
                severity: .warning,
                title: "Low Power Mode is on",
                detail: "The CPU is deliberately slowed and background work is paused. If the phone feels sluggish while charged, turn it off in Settings > Battery.",
                symbolName: "battery.25"
            ))
        }

        if batteryLevel >= 0, batteryLevel < 0.2, batteryState == .unplugged {
            items.append(Recommendation(
                severity: .warning,
                title: "Battery is low",
                detail: "iPhones can slow down or shut off at low charge, especially with an aging battery. Plug in soon.",
                symbolName: "battery.0"
            ))
        }

        // Memory pressure.
        if memoryTotal > 0 {
            let freeFraction = Double(memoryFree) / Double(memoryTotal)
            if freeFraction < 0.08 {
                items.append(Recommendation(
                    severity: .warning,
                    title: "Memory pressure is high",
                    detail: "Very little RAM is free right now. If apps are freezing, a restart is the most reliable way to reclaim memory on iOS.",
                    symbolName: "memorychip"
                ))
            }
        }

        if let cpu = cpuUsage, cpu > 0.85 {
            items.append(Recommendation(
                severity: .warning,
                title: "CPU is under heavy load",
                detail: "Something is working the processor hard. If this stays high while the phone is idle, a background task may be stuck — restart the phone.",
                symbolName: "cpu"
            ))
        }

        items.sort { $0.severity > $1.severity }
        recommendations = items
        overallSeverity = items.map(\.severity).max() ?? .good
    }
}

// MARK: - Formatting helpers

extension DiagnosticsModel {

    var batteryLevelText: String {
        batteryLevel < 0 ? "Unknown" : "\(Int(batteryLevel * 100))%"
    }

    var batteryStateText: String {
        switch batteryState {
        case .charging: return "Charging"
        case .full: return "Full"
        case .unplugged: return "On battery"
        default: return "Unknown"
        }
    }

    var thermalStateText: String {
        switch thermalState {
        case .nominal: return "Normal"
        case .fair: return "Slightly warm"
        case .serious: return "Hot — throttling"
        case .critical: return "Overheating"
        @unknown default: return "Unknown"
        }
    }

    var thermalSeverity: Severity {
        switch thermalState {
        case .nominal, .fair: return .good
        case .serious: return .warning
        default: return .critical
        }
    }

    var storageSeverity: Severity {
        let freeGB = Double(storageFree) / 1_000_000_000
        if freeGB < 5 { return .critical }
        if freeGB < 10 { return .warning }
        return .good
    }

    var uptimeText: String {
        let totalMinutes = Int(uptime) / 60
        let days = totalMinutes / 1_440
        let hours = (totalMinutes % 1_440) / 60
        let minutes = totalMinutes % 60
        if days > 0 { return "\(days)d \(hours)h" }
        if hours > 0 { return "\(hours)h \(minutes)m" }
        return "\(minutes)m"
    }

    static func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }

    static func formatBytes(_ bytes: UInt64) -> String {
        formatBytes(Int64(clamping: bytes))
    }
}
