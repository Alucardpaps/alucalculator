Write-Host "Starting Build Process..." -ForegroundColor Cyan

# Run the build command
npm run build

# Check if the build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Successful. Committing and Pushing to GitHub..." -ForegroundColor Green
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Auto-build update: $timestamp"
    
    # Push to main
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Changes successfully pushed to GitHub." -ForegroundColor Green
    } else {
        Write-Host "Push failed. Please check your network or git configuration." -ForegroundColor Red
    }
} else {
    Write-Host "Build Failed. Aborting Push." -ForegroundColor Red
    exit 1
}
