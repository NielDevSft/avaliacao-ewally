import BoletosController from "@controllers/BoletosController";
import { Router } from "express";



const routes = Router();
routes.get('/boleto/:linhadigitavel', BoletosController.handle);

export default routes;