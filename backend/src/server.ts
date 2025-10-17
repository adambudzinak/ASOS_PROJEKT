import express from 'express'
import userRouter from './user/router'
import { logger } from './index/middleware/logger'
import { protectRoute } from './index/middleware/protect-route'
import { signUp, signIn } from './index/controller/guest'
import { errorHandler } from './index/middleware/error-handling'
import { validateInput, signUpValidations } from "./index/middleware/validation";
const cors = require("cors");

const app = express()
app.use(cors({ origin: "http://localhost:5173" }))
/*
app.use() is a method used to mount middleware or routers in an Express application
Nesprávne poradie app.use() môže spôsobiť, že middleware nebude fungovať správne alebo sa vôbec nespustí.
*/

//custom middleware - na poradi zalezi! keby mame app.use('/api', router) pred middlewareom, tak nikdy sa nespusti!
app.use(logger) //Logger middleware sa spustí pred všetkým ostatným, aby zaznamenával každú požiadavku, ktorá príde na server.

//dovolime klientom posielat jsony na nas server
app.use(express.json()) //Ak by tieto middleware prišli po route handleroch, Express by nevedel rozpoznať JSON v requeste

//umoznime klientom vramci URL poslat parametre (napr localhost:8080/api/example?param1=asd)
app.use(express.urlencoded({extended: true}))

//nastavime prefix /api pre vsetky routes, kt. su specifikovane v ./router a pouzijeme middleware protectRoute
app.use('/api', protectRoute, userRouter) //Router sa vykoná iba, ak protectRoute zavolá next()

//tieto routes nemaju protectRoute middleware, lebo chceme, aby sa kazdy dokazal zaregistrovat a prihlasit
app.post('/sign-up', signUpValidations, validateInput, signUp)
app.post('/sign-in', signIn)

//endpoint na vyhodenie synchronnej chyby -> sposobi zavolanie errorHandler-u
//synchronna chyba je automaticky posunuta do error handleru Expressom
app.get("/sync-error", () => {throw new Error("error from /sync-error")})
//endpoint na vyhodenie asynchronnej chyby -> sposobi zavolanie errorHandler-u (vdaka next)
//asynchronna chyba nie je automaticky posunuta do error handleru Expressom, Express to nevie - musime to spravit my manualne cez next()
/*
vzdy, ked uvidis ze handler ma next() tak pamataj ze: Anything we pass to next is considered an error.
handlery su tie funkcie co mas napr v user.ts v controllers priecinku
*/
app.get("/async-error", (req, res, next) => {
    setTimeout(() => {
        next(new Error("error from /async-error"))
    }, 1)
})
//globalny error handler - musi byt nakonci tohto suboru
app.use(errorHandler) //Error handling middleware v Express funguje len ak je definované po všetkých route a middleware

export default app