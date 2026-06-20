$root = 'c:\Users\apo_q\.gemini\antigravity\scratch\alucalculator'
$ext = @('*.ts','*.tsx','*.js','*.jsx','*.json','*.css','*.mjs')
$paths = @(
  (Join-Path $root 'src'),
  (Join-Path $root 'scripts'),
  (Join-Path $root 'plugins'),
  $root
)
$files = foreach ($p in $paths) {
  if (Test-Path $p) {
    Get-ChildItem -Path $p -Recurse -Include $ext -File -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.next\\|\\out\\' }
  }
}
$files = $files | Sort-Object FullName -Unique
$bad = @()
foreach ($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  if ($bytes -contains 0) { $bad += $f.FullName }
}
"Checked $($files.Count) files, null-byte files: $($bad.Count)"
$bad
