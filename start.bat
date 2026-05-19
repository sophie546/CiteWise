@echo off
setlocal

pushd "%~dp0"

start "CiteWise Backend" cmd /k "cd /d backend && mvnw spring-boot:run"
start "CiteWise Frontend" cmd /k "cd /d frontend && npm run dev"

popd
endlocal
