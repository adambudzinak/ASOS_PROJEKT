import app from './server'
import * as dotenv from 'dotenv'
import config from './config'
import swaggerUi from "swagger-ui-express"
import { swaggerSpec } from './swagger'

//aby sme mohli pouzit env variables v kode, pouzijeme dotenv.config()
//spravime to v entry point nasej aplikacie, teda index.ts, aby sa nacitali hned a mohli pouzivat
dotenv.config() 

app.listen(config.port, () => {
    console.log(`server running on http://localhost:${config.port}`)
})
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))