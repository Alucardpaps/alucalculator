$recent = @(
  'src\components\calculators\DriveCalcWorkbench.tsx',
  'src\calculators\schemas-v2\belt-drive.tsx',
  'src\calculators\schemas-v2\chain-drive.tsx',
  'src\data\mechanical\driveTypes.ts',
  'src\components\visualizers\BeltDriveBlueprint.tsx',
  'src\components\visualizers\ChainDriveBlueprint.tsx',
  'src\hooks\useDriveTrainCalculator.ts'
) | ForEach-Object { Join-Path 'c:\Users\apo_q\.gemini\antigravity\scratch\alucalculator' $_ }

foreach ($path in $recent) {
  if (-not (Test-Path $path)) { Write-Output "MISSING $path"; continue }
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $hasNull = $bytes -contains 0
  $enc = 'unknown'
  if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) { $enc = 'UTF-16 LE BOM' }
  elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) { $enc = 'UTF-16 BE BOM' }
  elseif ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { $enc = 'UTF-8 BOM' }
  elseif ($hasNull -and $bytes[0] -lt 128 -and $bytes[1] -eq 0) { $enc = 'UTF-16 LE no BOM' }
  elseif (-not $hasNull) { $enc = 'UTF-8/ASCII' }
  Write-Output ("{0} | null={1} | {2}" -f $path, $hasNull, $enc)
}
