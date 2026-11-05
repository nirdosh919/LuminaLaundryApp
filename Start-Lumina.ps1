$ErrorActionPreference = "Stop"

$project = "C:\Users\nirdo\Projects\LuminaLaundryApp"
$backend = "C:\Users\nirdo\Projects\LuminaLaundryApp\lumina (2)\lumina"
$php = "C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe"

$ip = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -match '^192\.168\.' -and
        $_.InterfaceAlias -notmatch 'Loopback|Virtual|WSL|vEthernet'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

if (!$ip) {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notmatch '^127\.' -and
            $_.InterfaceAlias -notmatch 'Loopback|Virtual|WSL|vEthernet'
        } |
        Select-Object -First 1 -ExpandProperty IPAddress
}

if (!$ip) {
    Write-Host "LAN IP nahi mila. Wi-Fi connect karke dobara try karein." -ForegroundColor Red
    Read-Host "Enter dabayein"
    exit 1
}

$envFile = Join-Path $project ".env"
$line = "EXPO_PUBLIC_API_URL=http://${ip}:8000"

if (Test-Path $envFile) {
    $content = [System.IO.File]::ReadAllText($envFile)
    if ($content -match '(?m)^EXPO_PUBLIC_API_URL=.*$') {
        $content = [regex]::Replace(
            $content,
            '(?m)^EXPO_PUBLIC_API_URL=.*$',
            [System.Text.RegularExpressions.MatchEvaluator]{
                param($m) $line
            }
        )
    } else {
        $content = $content.TrimEnd() + "`r`n" + $line + "`r`n"
    }
} else {
    $content = $line + "`r`n"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($envFile, $content, $utf8)

Write-Host "API URL: $line" -ForegroundColor Green

$laravelCommand = "Set-Location '$backend'; & '$php' artisan serve --host 0.0.0.0 --port 8000"
$expoCommand = "Set-Location '$project'; npx expo start --clear"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit", "-Command", $laravelCommand
)

Start-Sleep -Seconds 2

Start-Process powershell.exe -ArgumentList @(
    "-NoExit", "-Command", $expoCommand
)

Write-Host ""
Write-Host "Lumina Laundry servers start kar diye gaye hain." -ForegroundColor Green
Write-Host "Laravel: http://localhost:8000"
Write-Host "Expo API: http://${ip}:8000"
Write-Host "Expo terminal mein QR code aane ka intezar karein."