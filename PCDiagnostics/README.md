# PC Diagnostics

A one-file PowerShell health check for Windows 10/11. Unlike the iPhone
(where Apple blocks most diagnostics), Windows exposes everything — so this
script reads real hardware and system data and tells you exactly what to fix,
ranked by severity.

**It is read-only**: it changes nothing on your PC.

## What it checks

| Check | What it catches |
| --- | --- |
| Uptime since last real restart | Weeks without a reboot (Fast Startup hides this — "Shut down" doesn't count) |
| CPU load | A stuck process pegging the processor |
| RAM installed / in use + top 5 memory hogs | Memory pressure and too little installed RAM |
| Free space on every drive | Full system drive (major cause of slowness) |
| Physical disk type + SMART health | Failing drives, and spinning HDDs — the #1 reason old PCs feel slow |
| Startup programs | Bloat that slows boot and eats RAM constantly |
| Battery wear (laptops) | Real battery health % from Windows' own battery report |
| Windows Update recency | Stale or stuck updates |

At the end it prints a ranked fix-it list: criticals first, in the order you
should tackle them.

## How to run it

1. Get `Check-PCHealth.ps1` onto the PC (clone this repo, or download the file
   from GitHub via **Code > Download ZIP**).
2. Open PowerShell: press **Win**, type `powershell`, press Enter.
3. Run:

   ```powershell
   cd path\to\PCDiagnostics
   powershell -ExecutionPolicy Bypass -File .\Check-PCHealth.ps1
   ```

That's it — results appear in the window in ~10 seconds.

Optional: run PowerShell **as Administrator** (right-click > Run as
administrator) to also get physical-disk SMART health; everything else works
without it.

`-ExecutionPolicy Bypass` is needed because Windows blocks downloaded scripts
by default; it applies only to this one run.
