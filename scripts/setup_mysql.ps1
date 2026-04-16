# Setup MySQL 8.4: data dir, config, service, root password
# Run elevated (admin)
$ErrorActionPreference = 'Stop'
Start-Transcript -Path "C:\proyectos\ranger sistemas\scripts\setup_mysql.log" -Force

$mysqlBase = "C:\Program Files\MySQL\MySQL Server 8.4"
$dataRoot  = "C:\ProgramData\MySQL\MySQL Server 8.4"
$dataDir   = Join-Path $dataRoot "Data"
$iniPath   = Join-Path $dataRoot "my.ini"
$rootPwd   = "RHoss.1234"
$serviceName = "MySQL84"

Write-Host "== Creating data directories =="
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $dataRoot "Uploads") | Out-Null

Write-Host "== Writing my.ini =="
$iniContent = @"
[mysqld]
port=3306
basedir="$($mysqlBase -replace '\\','/')"
datadir="$($dataDir -replace '\\','/')"
max_allowed_packet=64M
sql_mode="STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION"

[client]
port=3306
"@
Set-Content -Path $iniPath -Value $iniContent -Encoding ASCII

Write-Host "== Initializing data directory (insecure - no root password yet) =="
if (Test-Path $dataDir) { Remove-Item -Recurse -Force $dataDir }
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
& "$mysqlBase\bin\mysqld.exe" --defaults-file="$iniPath" --initialize-insecure --console
if ($LASTEXITCODE -ne 0) { throw "mysqld --initialize-insecure failed (exit $LASTEXITCODE)" }

Write-Host "== Installing Windows service =="
# Remove prior service if exists
sc.exe query $serviceName 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
  sc.exe stop $serviceName 2>&1 | Out-Null
  sc.exe delete $serviceName 2>&1 | Out-Null
  Start-Sleep -Seconds 2
}
& "$mysqlBase\bin\mysqld.exe" --install $serviceName --defaults-file="$iniPath"
if ($LASTEXITCODE -ne 0) { throw "mysqld --install failed (exit $LASTEXITCODE)" }

Write-Host "== Starting service =="
Start-Service $serviceName
Start-Sleep -Seconds 3

Write-Host "== Setting root password to '$rootPwd' =="
$alterSql = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$rootPwd'; FLUSH PRIVILEGES;"
& "$mysqlBase\bin\mysql.exe" --user=root --skip-password -e $alterSql
if ($LASTEXITCODE -ne 0) { throw "Failed to set root password (exit $LASTEXITCODE)" }

Write-Host ""
Write-Host "== DONE =="
Write-Host "Service: $serviceName (Running)"
Write-Host "Host: localhost:3306"
Write-Host "User: root  Password: $rootPwd"
Stop-Transcript
