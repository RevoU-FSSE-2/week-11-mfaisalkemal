import express from 'express';
import bodyParser from 'body-parser';
import bloodapiRoutes from './routes/bloodapiRoutes';
import { connectDb } from './models/database';
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";
import fs from "fs";
import openApiValidator = require("express-openapi-validator");
import { Request, Response, NextFunction } from 'express';

const app = express();

app.use(bodyParser.json());

const openApiPath = './doc/openapi.yaml';
const file = fs.readFileSync(openApiPath, 'utf8');
const swaggerDocument = yaml.load(file);
app.use('/swaggeropenapi', swaggerUi.serve, swaggerUi.setup(swaggerDocument!))

    app.use(openApiValidator.middleware({
        apiSpec: openApiPath,
        validateRequests: true
    }));

app.use('/', bloodapiRoutes);

const port = 3000;

(async () => {
    try {
      await connectDb();
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error('Error starting the server:', error);
    }
})();

app.use(( err: Error, req: Request, res: Response, next: NextFunction ) => {
    res.status(err.status || 500).json({
        message: err.message,
        errors: err.errors,
    })
})