import { GetBoletosService } from './GetBoletosService';
let getBoletosService: GetBoletosService;

describe('boleto', () => {
    beforeAll(async () => {
        getBoletosService = new GetBoletosService();
    })
    
    it('should throw error comprimento de linha digitavel invalida', async () => {
        
        const err = () => {
            try{
                getBoletosService.validaTamanhoLinhaDigitavel('xxxxxxxxxx');
            }catch( error){
                throw error
            }
        };
        expect(err).toThrow(Error);
        expect(err).toThrow('comprimento de linha digitavel inválida');
    });
    
    it('should return formated linhaDigitavel', async () => {
        const linhaDCampos1 = {
            linhaDigitavelFormatada: '', 
            campos: []}

        expect(getBoletosService.formataLinhaDigitavel('xxxxxxxxxx')).toEqual(linhaDCampos1);

        const linhaDCampos2 = {
            linhaDigitavelFormatada: '00190500954014481606906809350314337370000000100', 
            campos: [ '0019050095', '40144816069', '06809350314', '3', '37370000000100' ]}
            expect(getBoletosService.formataLinhaDigitavel('001 9 05009 ( 5 ) 401448 1606 ( 9 ) 0680935031 ( 4 ) 337370000000100'))
            .toEqual(linhaDCampos2);
    });
        
    it('should verify DVs', async () => {
        //linha com valor valido
        const linhaDigitavel = '00190500954014481606906809350314337370000000100';
        expect(getBoletosService.verificaDVs(linhaDigitavel)).toBe(true);

        //linha com valor invalido
        const linhaDigitavelInvalida = '00190500954014481606306809350314337370000000100';
        expect(getBoletosService.verificaDVs(linhaDigitavelInvalida)).toBe(false);
    })

    it('should retrun codigo barras', async () => {
        //linha digitável válida
        const linhaDigitavel = '00190500954014481606306809350314337370000000100';
        expect(getBoletosService.getCodigoBarras(linhaDigitavel))
        .toEqual('00193373700000001000500940144816060680935031')
    });

    it('should return expirationDate of boleto', async () => {
        //linha digitável válida
        const linhaDigitavel = '00190500954014481606306809350314337370000000100';

        expect(getBoletosService.getDataLinhaDig(linhaDigitavel))
        .toEqual(new Date('2007-12-31T20:54:59.000Z'))
    });

    it('should return amount of boleto', async () => {
        //linha digitável válida
        const linhaDigitavel = '00190500954014481606306809350314337370000000100';

        expect(getBoletosService.getValorBoleto(linhaDigitavel))
        .toEqual(1)
    });
})