import { GetBoletosService } from '@services/boletos/GetBoletosService';
import { Request, Response, NextFunction } from 'express'


class BoletosController {

    public async handle(request: Request, response: Response, next: NextFunction) {
        const { linhadigitavel } = request.params

        const getBoletosService = new GetBoletosService();
        try{
            const resp = await getBoletosService.run(linhadigitavel);
            return response.status(200).json(resp);
        }catch(err){
            response.status(400)
            next(err)
        }

    }
}
export default new BoletosController();