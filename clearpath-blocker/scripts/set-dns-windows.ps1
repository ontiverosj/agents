# Sets CleanBrowsing Adult Filter DNS on every active network adapter.
# Run in an elevated PowerShell (right-click -> Run as administrator).
# Undo with: Get-NetAdapter | Set-DnsClientServerAddress -ResetServerAddresses

$dns = @('185.228.168.10', '185.228.169.11')
Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
    Write-Host "Setting filtered DNS on adapter: $($_.Name)"
    Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses $dns
}
Clear-DnsClientCache
Write-Host "Done. Adult content is now filtered at the DNS level on this computer."
Write-Host "Test it: https://cleanbrowsing.org/filters/ should confirm the Adult Filter is active."
