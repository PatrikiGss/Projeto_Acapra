$cfExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$envFile = "$PSScriptRoot\backend\.env"
$cfLog = "$env:TEMP\cf_tunnel.log"

if (Test-Path $cfLog) { Remove-Item $cfLog }

Write-Host "Iniciando tunel Cloudflare..." -ForegroundColor Cyan
$proc = Start-Process -FilePath $cfExe `
  -ArgumentList "tunnel --url http://localhost:5173" `
  -RedirectStandardError $cfLog `
  -NoNewWindow -PassThru

$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $cfLog) {
        $content = Get-Content $cfLog -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
            $url = $Matches[0]
            break
        }
    }
}

if (-not $url) {
    Write-Host "Erro: URL nao encontrada." -ForegroundColor Red
    exit 1
}

Write-Host "URL publica: $url" -ForegroundColor Green

# Atualiza SITE_URL no .env
$envContent = Get-Content $envFile -Raw
$envContent = $envContent -replace 'SITE_URL=.*', "SITE_URL=$url"
[System.IO.File]::WriteAllText($envFile, $envContent, [System.Text.UTF8Encoding]::new($false))

Write-Host ".env atualizado com SITE_URL=$url" -ForegroundColor Green
Write-Host ""
Write-Host "Tunel rodando (PID $($proc.Id)). Pressione Ctrl+C para encerrar." -ForegroundColor Yellow
Write-Host "Lembre-se de iniciar o servidor Django em outro terminal." -ForegroundColor Yellow

Wait-Process -Id $proc.Id
