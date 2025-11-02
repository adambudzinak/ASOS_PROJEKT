## SPUSTENIE
Pred spustenim sa treba uistit, ze mas node (v22.20.0), npm, postgresql <br>
pokial programujete vo vs code, odporucam tiez plugin: Prisma

1. npm install
2. vytvorit .env subor v root priecinku
3. vytvorit priecinok s nazvom uploads na tej istej urovni, kde je aj src a prisma
4. pridat do .env: DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name?schema=public
5. pridat do .env: JWT_SECRET="hocijakysecrettumozebyt"
6. npm i prisma
7. npm i @prisma/client
8. npx prisma migrate dev (treba spustit vzdy ked sa zmeni struktura databazy)
9. npm run dev

## STRUKTURA PROJEKTU
- index - cast aplikacie spolocna pre vsetkych (registrovanych/prihlasenych aj neregistrovanych/neprihlasenych) <br>
- user - cast aplikacie pristupna len pre prihlasenych

## DOKUMENTACIA
projekt obsahuje aj API dokumentaciu, staci po spusteni npm run dev zadat do prehliadaca http://localhost:8080/docs
