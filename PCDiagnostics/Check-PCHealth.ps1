<#
.SYNOPSIS
    PC health check — scans the things that most commonly make a Windows PC
    slow, freezy, or crash-prone, and prints plain-English recommendations.

.DESCRIPTION
    Read-only: this script changes nothing on your PC. It checks
    uptime, CPU load, memory pressure, disk space, disk health (HDD vs SSD,
    SMART status), startup programs, battery wear (laptops), and Windows
    Update recency, then prints a color-coded summary of what to do.

.NOTES
    Run from PowerShell:
        powershell -ExecutionPolicy Bypass -File .\Check-PCHealth.ps1
    Works on Windows PowerShell 5.1 (built into Windows 10/11).
    Running as Administrator gives fuller disk-health results but is optional.
#>

[CmdletBinding()]
param()

$script:Issues = New-Object System.Collections.ArrayList

function Add-Issue {
    param(
        [ValidateSet('Warning', 'Critical')] [string]$Severity,
        [string]$Title,
        [string]$Detail
    )
    [void]$script:Issues.Add([pscustomobject]@{
        Severity = $Severity
        Title    = $Title
        Detail   = $Detail
    })
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=== {0} " -f $Title).PadRight(60, '=') -ForegroundColor Cyan
}

function Write-Metric {
    param([string]$Label, [string]$Value, [string]$Color = 'Gray')
    Write-Host ("  {0,-32}" -f $Label) -NoNewline
    Write-Host $Value -ForegroundColor $Color
}

Write-Host ""
Write-Host "PC HEALTH CHECK" -ForegroundColor White
Write-Host ("Started {0}  (read-only: nothing on this PC will be changed)" -f (Get-Date)) -ForegroundColor DarkGray

# ---------------------------------------------------------------- System
Write-Section "System"

$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$uptime = (Get-Date) - $os.LastBootUpTime
$uptimeText = "{0}d {1}h {2}m" -f [int]$uptime.Days, $uptime.Hours, $uptime.Minutes

Write-Metric "Computer" ("{0} {1}" -f $cs.Manufacturer, $cs.Model)
Write-Metric "Windows" ("{0} (build {1})" -f $os.Caption.Trim(), $os.BuildNumber)
$uptimeColor = 'Green'
if ($uptime.TotalDays -ge 7) { $uptimeColor = 'Yellow' }
if ($uptime.TotalDays -ge 21) { $uptimeColor = 'Red' }
Write-Metric "Time since last restart" $uptimeText $uptimeColor

if ($uptime.TotalDays -ge 7) {
    $sev = 'Warning'
    if ($uptime.TotalDays -ge 21) { $sev = 'Critical' }
    Add-Issue $sev "Restart your PC" `
        ("It has been up {0:N0} days. Note: with Windows Fast Startup, 'Shut down' does NOT fully restart — use Start > Power > Restart. A real restart clears leaked memory and stuck processes." -f $uptime.TotalDays)
}

# ---------------------------------------------------------------- CPU
Write-Section "Processor"

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Write-Metric "CPU" $cpu.Name.Trim()

$cpuLoad = $null
try {
    $samples = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3 -ErrorAction Stop
    $cpuLoad = [math]::Round(($samples.CounterSamples | Measure-Object CookedValue -Average).Average)
} catch {
    try { $cpuLoad = (Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average } catch {}
}

if ($null -ne $cpuLoad) {
    $loadColor = 'Green'
    if ($cpuLoad -gt 60) { $loadColor = 'Yellow' }
    if ($cpuLoad -gt 85) { $loadColor = 'Red' }
    Write-Metric "Current CPU load" ("{0}%" -f $cpuLoad) $loadColor
    if ($cpuLoad -gt 85) {
        Add-Issue Warning "CPU is under heavy load right now" `
            "If the PC is supposed to be idle, something is hogging the processor. Open Task Manager (Ctrl+Shift+Esc), sort by CPU, and see what's at the top."
    }
}

# ---------------------------------------------------------------- Memory
Write-Section "Memory (RAM)"

$totalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$freeGB  = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
$usedPct = [math]::Round((1 - $os.FreePhysicalMemory / $os.TotalVisibleMemorySize) * 100)

$memColor = 'Green'
if ($usedPct -gt 80) { $memColor = 'Yellow' }
if ($usedPct -gt 92) { $memColor = 'Red' }
Write-Metric "Installed" ("{0} GB" -f $totalGB)
Write-Metric "In use" ("{0}%  ({1} GB free)" -f $usedPct, $freeGB) $memColor

Write-Host "  Top memory users:" -ForegroundColor DarkGray
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host ("    {0,-28} {1,8:N0} MB" -f $_.ProcessName, ($_.WorkingSet64 / 1MB)) -ForegroundColor DarkGray
}

if ($usedPct -gt 92) {
    Add-Issue Critical "Memory is nearly exhausted" `
        "Windows is likely swapping to disk, which causes freezing. Close unused apps and browser tabs. If this is constant, more RAM is the real fix."
} elseif ($usedPct -gt 80) {
    Add-Issue Warning "Memory usage is high" `
        "Check the top memory users listed above — browsers with many tabs are the usual culprit."
}
if ($totalGB -lt 7.5) {
    Add-Issue Warning ("Only {0} GB of RAM installed" -f $totalGB) `
        "8 GB is the practical minimum for smooth Windows 10/11 use; 16 GB is comfortable. A RAM upgrade is often the cheapest big speed boost."
}

# ---------------------------------------------------------------- Disks
Write-Section "Storage"

foreach ($disk in Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3") {
    $dTotalGB = [math]::Round($disk.Size / 1GB, 1)
    $dFreeGB  = [math]::Round($disk.FreeSpace / 1GB, 1)
    $dFreePct = 0
    if ($disk.Size -gt 0) { $dFreePct = [math]::Round($disk.FreeSpace / $disk.Size * 100) }

    $dColor = 'Green'
    if ($dFreePct -lt 15 -or $dFreeGB -lt 30) { $dColor = 'Yellow' }
    if ($dFreePct -lt 8 -or $dFreeGB -lt 15)  { $dColor = 'Red' }
    Write-Metric ("Drive {0}" -f $disk.DeviceID) ("{0} GB free of {1} GB ({2}%)" -f $dFreeGB, $dTotalGB, $dFreePct) $dColor

    $isSystem = ($disk.DeviceID -eq $env:SystemDrive)
    if ($isSystem -and ($dFreePct -lt 8 -or $dFreeGB -lt 15)) {
        Add-Issue Critical ("System drive {0} is critically full" -f $disk.DeviceID) `
            "Windows needs free space to run smoothly and update. Run Storage Sense (Settings > System > Storage), empty the Recycle Bin, and clear the Downloads folder."
    } elseif ($isSystem -and ($dFreePct -lt 15 -or $dFreeGB -lt 30)) {
        Add-Issue Warning ("System drive {0} is getting full" -f $disk.DeviceID) `
            "Try to keep at least 15% free. Settings > System > Storage shows what's using space."
    }
}

try {
    foreach ($pd in Get-PhysicalDisk -ErrorAction Stop) {
        $healthColor = 'Green'
        if ($pd.HealthStatus -ne 'Healthy') { $healthColor = 'Red' }
        Write-Metric ("Disk: {0}" -f $pd.FriendlyName) ("{0}, {1}" -f $pd.MediaType, $pd.HealthStatus) $healthColor

        if ($pd.HealthStatus -ne 'Healthy') {
            Add-Issue Critical ("Drive '{0}' reports {1}" -f $pd.FriendlyName, $pd.HealthStatus) `
                "The drive itself may be failing. BACK UP YOUR FILES NOW, then plan to replace the drive."
        }
        if ($pd.MediaType -eq 'HDD') {
            Add-Issue Warning ("'{0}' is a spinning hard drive (HDD)" -f $pd.FriendlyName) `
                "A mechanical HDD is the #1 cause of a slow PC that freezes on boot and app launches. Swapping it for an SSD makes an old PC feel new (often under `$50 + cloning)."
        }
    }
} catch {
    Write-Metric "Physical disk health" "Unavailable (try running as Administrator)" DarkGray
}

# ---------------------------------------------------------------- Startup programs
Write-Section "Startup programs"

$startup = @(Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue)
$startColor = 'Green'
if ($startup.Count -gt 10) { $startColor = 'Yellow' }
Write-Metric "Programs that launch at boot" $startup.Count $startColor
$startup | Select-Object -First 15 | ForEach-Object {
    Write-Host ("    {0}" -f $_.Name) -ForegroundColor DarkGray
}
if ($startup.Count -gt 10) {
    Add-Issue Warning ("{0} programs launch at startup" -f $startup.Count) `
        "Each one slows boot and eats RAM in the background. Open Task Manager > Startup apps and disable anything you don't need immediately at login."
}

# ---------------------------------------------------------------- Battery (laptops)
Write-Section "Battery"

$battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
if ($battery) {
    Write-Metric "Charge" ("{0}%" -f $battery.EstimatedChargeRemaining)
    $reportPath = Join-Path $env:TEMP "battery-report.xml"
    try {
        & powercfg /batteryreport /xml /output $reportPath 2>&1 | Out-Null
        [xml]$report = Get-Content $reportPath
        $bat = $report.SelectSingleNode("//*[local-name()='Battery']")
        if ($bat) {
            $design = [double]$bat.SelectSingleNode("*[local-name()='DesignCapacity']").InnerText
            $full   = [double]$bat.SelectSingleNode("*[local-name()='FullChargeCapacity']").InnerText
            if ($design -gt 0) {
                $healthPct = [math]::Round($full / $design * 100)
                $bColor = 'Green'
                if ($healthPct -lt 80) { $bColor = 'Yellow' }
                if ($healthPct -lt 60) { $bColor = 'Red' }
                Write-Metric "Battery health" ("{0}% of original capacity" -f $healthPct) $bColor
                if ($healthPct -lt 80) {
                    $sev = 'Warning'
                    if ($healthPct -lt 60) { $sev = 'Critical' }
                    Add-Issue $sev ("Battery holds only {0}% of its original capacity" -f $healthPct) `
                        "A worn battery causes short runtimes and sudden shutdowns. Consider a battery replacement if this laptop needs to run unplugged."
                }
            }
        }
        Remove-Item $reportPath -ErrorAction SilentlyContinue
    } catch {
        Write-Metric "Battery health" "Could not read battery report" DarkGray
    }
} else {
    Write-Metric "Battery" "None detected (desktop PC)" DarkGray
}

# ---------------------------------------------------------------- Windows Update
Write-Section "Windows Update"

try {
    $lastFix = Get-HotFix -ErrorAction Stop | Where-Object InstalledOn | Sort-Object InstalledOn -Descending | Select-Object -First 1
    if ($lastFix) {
        $daysAgo = [int]((Get-Date) - $lastFix.InstalledOn).TotalDays
        $uColor = 'Green'
        if ($daysAgo -gt 45) { $uColor = 'Yellow' }
        Write-Metric "Last update installed" ("{0} ({1} days ago)" -f $lastFix.InstalledOn.ToShortDateString(), $daysAgo) $uColor
        if ($daysAgo -gt 45) {
            Add-Issue Warning "No Windows updates in over 6 weeks" `
                "Updates include stability and performance fixes. Check Settings > Windows Update — a stuck update can itself cause slowness."
        }
    } else {
        Write-Metric "Last update installed" "Unknown" DarkGray
    }
} catch {
    Write-Metric "Last update installed" "Unknown" DarkGray
}

# ---------------------------------------------------------------- Summary
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($script:Issues.Count -eq 0) {
    Write-Host "RESULT: No problems found." -ForegroundColor Green
    Write-Host "Everything this check can measure looks healthy. If the PC still feels slow, the next things to look at are malware (run a full Microsoft Defender scan) and overheating (listen for constant loud fans)." -ForegroundColor Gray
} else {
    $criticals = @($script:Issues | Where-Object Severity -eq 'Critical')
    $warnings  = @($script:Issues | Where-Object Severity -eq 'Warning')
    Write-Host ("RESULT: {0} critical, {1} warning(s)" -f $criticals.Count, $warnings.Count) -ForegroundColor $(if ($criticals.Count) { 'Red' } else { 'Yellow' })
    Write-Host ""
    $rank = 1
    foreach ($issue in ($criticals + $warnings)) {
        $color = 'Yellow'
        if ($issue.Severity -eq 'Critical') { $color = 'Red' }
        Write-Host ("  {0}. [{1}] {2}" -f $rank, $issue.Severity.ToUpper(), $issue.Title) -ForegroundColor $color
        Write-Host ("     {0}" -f $issue.Detail) -ForegroundColor Gray
        Write-Host ""
        $rank++
    }
    Write-Host "Fix these in order — item 1 first." -ForegroundColor White
}
Write-Host ""
