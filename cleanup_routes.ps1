$folders = @(
    "src/app/[lang]/aluminum",
    "src/app/[lang]/bearings",
    "src/app/[lang]/converter",
    "src/app/[lang]/fasteners",
    "src/app/[lang]/fits",
    "src/app/[lang]/gears",
    "src/app/[lang]/handbook",
    "src/app/[lang]/materials",
    "src/app/[lang]/nesting",
    "src/app/[lang]/nesting2d",
    "src/app/[lang]/news",
    "src/app/[lang]/pumps",
    "src/app/[lang]/sheet-metal",
    "src/app/[lang]/strength",
    "src/app/[lang]/welding"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "Removing $folder..."
        Remove-Item -Recurse -Force $folder -ErrorAction SilentlyContinue
    }
}
Write-Host "Cleanup complete."
