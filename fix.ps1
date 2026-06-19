(Get-Content src/app/dashboard/student/timetable/page.tsx) | ForEach-Object { $_ -replace "^import React", "`"use client`";`nimport React" } | Set-Content src/app/dashboard/student/timetable/page.tsx
