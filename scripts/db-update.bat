@echo off
echo Initializing database for SolarTrade CRM...

echo Generating Prisma client...
cd ../
call npx prisma generate

echo Applying migrations to database...
call npx prisma migrate deploy

echo Seeding database with test data...
call npx ts-node prisma/seed.ts

echo Database update completed successfully!
pause
