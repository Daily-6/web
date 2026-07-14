$ErrorActionPreference = "Stop"
Set-Location -LiteralPath "D:\课程材料\大一暑校\web开发\大作业\webdev-template"

Remove-Item -LiteralPath "backend\data\course-demo.sqlite" -Force -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev --workspace backend" -PassThru -NoNewWindow

Start-Sleep -Seconds 10

try {
  cmd /c "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test backend/test/api-contract.test.mts"
  $testResult = $LASTEXITCODE
} finally {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

exit $testResult