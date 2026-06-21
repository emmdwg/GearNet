# Run in PowerShell as Administrator so your phone can reach the dev API.
# Right-click PowerShell -> Run as administrator, then:
#   cd path\to\GearNet
#   .\scripts\open-firewall.ps1

$ruleName = "GearNet Dev API"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Firewall rule '$ruleName' already exists."
} else {
  New-NetFirewallRule -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 3000 `
    -Profile Private `
    | Out-Null
  Write-Host "Added firewall rule '$ruleName' — port 3000 allowed on private networks."
}

Write-Host "Make sure npm run dev is running and your phone is on the same Wi-Fi."
