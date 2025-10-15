import swaggerJSDoc from "swagger-jsdoc"

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "InstaLite - ASOS Projekt 2025",
      version: "1.0.0",
      description: "InstaLite API",
    },
    servers: [
      {
        url: "http://localhost:8080",
      },
    ],
  },
  apis: ["./src/docs/*.yaml"], 
}

export const swaggerSpec = swaggerJSDoc(options)
