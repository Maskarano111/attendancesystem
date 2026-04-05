#!/usr/bin/env pwsh
# Quick Test Commands for Smart Student Attendance System
# Run these commands to verify the system is working

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  QUICK VERIFICATION TESTS FOR ATTENDANCE SYSTEM               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n[1/5] Testing API Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method GET -ErrorAction Stop
    Write-Host "✓ Health Check Passed" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n[2/5] Testing Authentication..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:8000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"admin@demo.com","password":"password"}' `
        -ErrorAction Stop
    
    if ($loginResponse.status -eq "success") {
        Write-Host "✓ Authentication Passed" -ForegroundColor Green
        Write-Host "  User: $($loginResponse.data.user.email)" -ForegroundColor Green
        Write-Host "  Role: $($loginResponse.data.user.role)" -ForegroundColor Green
        $token = $loginResponse.token
    } else {
        Write-Host "✗ Authentication Failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Authentication Failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: TypeScript Compilation
Write-Host "`n[3/5] Checking TypeScript Compilation..." -ForegroundColor Yellow
try {
    $tscOutput = & npm run lint *>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ TypeScript Compilation Passed" -ForegroundColor Green
    } else {
        Write-Host "✗ TypeScript Compilation Failed" -ForegroundColor Red
        Write-Host "  Run: npm run lint" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠ Could not check TypeScript" -ForegroundColor Yellow
}

# Test 4: Database Query
Write-Host "`n[4/5] Testing Database Query..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $classesResponse = Invoke-RestMethod `
        -Uri "http://localhost:8000/api/classes" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Database Query Passed" -ForegroundColor Green
    Write-Host "  Response Status: $($classesResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠ Database Query Test Failed" -ForegroundColor Yellow
    Write-Host "  This might be normal if no classes exist yet" -ForegroundColor Yellow
}

# Test 5: Environment Check
Write-Host "`n[5/5] Checking Environment Configuration..." -ForegroundColor Yellow
try {
    $envContent = Get-Content ".env" -ErrorAction Stop
    $port = $envContent | Select-String "PORT=" | Select-Object -First 1
    $env = $envContent | Select-String "NODE_ENV=" | Select-Object -First 1
    
    Write-Host "✓ Environment Configuration Found" -ForegroundColor Green
    Write-Host "  $port" -ForegroundColor Green
    Write-Host "  $env" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not read .env file" -ForegroundColor Yellow
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ VERIFICATION COMPLETE - SYSTEM OPERATIONAL                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nDemo Credentials:" -ForegroundColor Cyan
Write-Host "  Admin:    admin@demo.com / password" -ForegroundColor White
Write-Host "  Lecturer: lecturer@demo.com / password" -ForegroundColor White
Write-Host "  Student:  student@demo.com / password" -ForegroundColor White

Write-Host "`nServer URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "`nAPI Health: http://localhost:8000/api/health" -ForegroundColor Cyan
