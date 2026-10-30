param (
    [string]$Url = "http://localhost:3000/design-studio/?headless=1",
    [string]$OutFile = "c:\Users\apo_q\OneDrive\Documents\alucalculator\screenshot_design_studio.png"
)

$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host "Capturing Design Studio screenshot from $Url to $OutFile..."
Start-Process -FilePath $chrome -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--window-size=1600,900",
    "--virtual-time-budget=6000",
    "--screenshot=$OutFile",
    $Url
) -Wait -NoNewWindow

if (Test-Path $OutFile) {
    $info = Get-Item $OutFile
    Write-Host "Screenshot captured successfully! Size: $($info.Length) bytes, Time: $($info.LastWriteTime)"
} else {
    Write-Error "Screenshot file was not created!"
}
