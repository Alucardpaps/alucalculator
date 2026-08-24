$path = 'c:\Users\apo_q\.gemini\antigravity\scratch\alucalculator\src\data\mechanical\driveTypes.ts'
$content = Get-Content -LiteralPath $path -Raw -Encoding Unicode
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
$bytes = [System.IO.File]::ReadAllBytes($path)
Write-Output ("Converted. Length={0}, hasNull={1}, head={2}" -f $bytes.Length, ($bytes -contains 0), (($bytes[0..15] | ForEach-Object { $_.ToString() }) -join ','))
