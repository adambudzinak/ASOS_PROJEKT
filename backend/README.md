## SPUSTENIE
Pred spustenim sa treba uistit, ze mas node (v22.20.0), npm, postgresql <br>
pokial programujete vo vs code, odporucam tiez plugin: Prisma

1. npm install
2. vytvorit .env subor v root priecinku
3. pridat do .env: DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name?schema=public
4. pridat do .env: JWT_SECRET="hocijakysecrettumozebyt"
5. npm i prisma
6. npm i @prisma/client
7. npx prisma migrate dev (treba spustit vzdy ked sa zmeni struktura databazy)
8. npm run dev

## STRUKTURA PROJEKTU
- index - cast aplikacie spolocna pre vsetkych (registrovanych/prihlasenych aj neregistrovanych/neprihlasenych) <br>
- user - cast aplikacie pristupna len pre prihlasenych

## DOKUMENTACIA
projekt obsahuje aj API dokumentaciu, staci po spusteni npm run dev zadat do prehliadaca http://localhost:8080/docs