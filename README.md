# ASOS_PROJEKT
Tímový projekt z predmetu I-ASOS

## Spustenie projektu cez Docker

1. **Build kontajnerov**
```bash
docker compose build
```

2. **Spustenie kontajnerov**
```bash
docker compose up -d
```

3. **Aplikovanie db migrácií**
```bash
docker compose exec backend npx prisma migrate deploy
```

Po týchto krokoch by mali byť spustené všetky služby:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Databáza PostgreSQL: port 5432