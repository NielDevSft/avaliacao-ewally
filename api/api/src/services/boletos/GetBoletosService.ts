import { Boleto } from "@dtos/Boleto";

interface LinhaDCampos {
    linhaDigitavelFormatada: string;
    campos: string[];
}
interface IdentificadorReferencia {
    mod: number;
    efetivo: boolean;
}

export class GetBoletosService {

    public async run(linhaDigitavel: string): Promise<Boleto> {
        try{
            let codigo = this.validaTamanhoLinhaDigitavel(linhaDigitavel)
            let boleto: Boleto = {barCode: '', amount: 0, expirationDate: new Date()};
            const {linhaDigitavelFormatada} = this.formataLinhaDigitavel(codigo);
            if(this.verificaDVs(linhaDigitavelFormatada)){
                boleto.amount = this.getValorBoleto(linhaDigitavelFormatada);
                boleto.expirationDate = this.getDataLinhaDig(linhaDigitavelFormatada);
                boleto.barCode = this.getCodigoBarras(linhaDigitavelFormatada);
            }else{
                throw new TypeError('Linha digitavel inválida');
            }
            return boleto
        }catch(err){
            console.log(err)
            throw err;
        }
    }

    public validaTamanhoLinhaDigitavel(linhaDigitavel: string): string{
        let codigo = linhaDigitavel.replace(/[^0-9]/g, '');

        if (typeof codigo !== 'string') throw new TypeError('Insira uma string válida!');
        
        if (codigo.length == 46 || codigo.length == 47 || codigo.length == 48) {
            return codigo;
        } else {
            throw TypeError('comprimento de linha digitavel inválida');
        }
    }

    

    public getDigitosVerificadores (codigo: string, mod: number) {
        codigo = codigo.replace(/[^0-9]/g, '');
        switch (mod) {
            case 10:
                return (codigo + this.calculaMod10(codigo));
                break;
            case 11:
                return (codigo + this.calculaMod11(codigo));
                break;
            default:
                break;
        }
    }

    public verificaDVs(linhaVerificavel: string): boolean{
        const {campos, linhaDigitavelFormatada}  =  this.formataLinhaDigitavel(linhaVerificavel);

        //verifica o módulo 10
        for (let i = 0; i < campos.length; i++) {
            const campo = campos[i];
            
            if(campo.split('')[campo.length - 1] !== this.calculaMod10(campo).toString())
                return false
            if(i === 2){
                i = 10
            }
        }
        const codigoBarras = this.getCodigoBarras(linhaDigitavelFormatada);
        const DVsBoleto = this.calculaMod11(codigoBarras);
        
        if(codigoBarras.charAt(4) !== DVsBoleto.toString()){
            throw TypeError('digito verificador inválido')
        }
        
        return true;
    }


    private calculaMod10(numero: string) {
        numero = numero.replace(/\D/g, '');
        let i;
        let mult = 2;
        let soma = 0;
        let s = '';

        for (i = numero.length - 2; i >= 0; i--) {
            s = (mult * parseInt(numero.charAt(i))) + s;
            if (--mult < 1) {
                mult = 2;
            }
        }
        for (i = 0; i < s.length; i++) {
            soma = soma + parseInt(s.charAt(i));
        }
        soma = soma % 10;
        if (soma != 0) {
            soma = 10 - soma;
        }

        return soma;
    }

    private calculaMod11teste(x: string) {
        let sequencia = [4, 3, 2, 9, 8, 7, 6, 5];
        let digit = 0;
        let j = 0;
        let DAC = 0;

        //FEBRABAN https://cmsportal.febraban.org.br/Arquivos/documentos/PDF/Layout%20-%20C%C3%B3digo%20de%20Barras%20-%20Vers%C3%A3o%205%20-%2001_08_2016.pdf
        for (let i = 0; i < x.length; i++) {
            let mult = sequencia[j];
            j++;
            j %= sequencia.length;
            digit += mult * parseInt(x.charAt(i));
        }

        DAC = digit % 11;

        if (DAC == 0 || DAC == 1)
            return 0;
        if (DAC == 10)
            return 1;

        return (11 - DAC);
    }
    private calculaMod11(x: string) {
        let sequencia = [4, 3, 2, 9, 8, 7, 6, 5];
        let digit = 0;
        let j = 0;
        let DAC = 0;

        let teste = 0;
        //FEBRABAN https://cmsportal.febraban.org.br/Arquivos/documentos/PDF/Layout%20-%20C%C3%B3digo%20de%20Barras%20-%20Vers%C3%A3o%205%20-%2001_08_2016.pdf
        for (let i = 0; i < x.length; i++) {
            if(i !== 4){
                let mult = sequencia[j];
                j++;
                j %= sequencia.length;
                digit += mult * parseInt(x.charAt(i));
            }
        }
        
        DAC = digit % 11;
        
        if (DAC == 0 || DAC == 10 || DAC == 11)
            return 1;
        if (DAC == 11)
            return 1;
        
        return (11 - DAC);
    }
    
    public formataLinhaDigitavel(linhaDigitavel: string): LinhaDCampos{
        let campos = [];
        let linhaDigitavelFormatada: string;


        if(linhaDigitavel.length === 54 || linhaDigitavel.length === 47 || linhaDigitavel.length === 48){
            linhaDigitavelFormatada = linhaDigitavel.replace(/[^0-9]/g, '');
            campos = this.splitCampos(linhaDigitavelFormatada);
            return {linhaDigitavelFormatada, campos};
        } else {
            this.splitCampos(linhaDigitavel)
            linhaDigitavelFormatada = linhaDigitavel.trim().split('').filter(this.numbersOnly).toString().replace(/[^0-9]/g, '');
            
            campos = this.splitCampos(linhaDigitavelFormatada);
            linhaDigitavelFormatada = linhaDigitavelFormatada.replace(/[^0-9]/g, '');
            
            if(!linhaDigitavelFormatada){
                const valVoid:  LinhaDCampos = {campos: [], linhaDigitavelFormatada: ''};
                return valVoid;
            }
            return { linhaDigitavelFormatada, campos}
        }
    }

    public getValorBoleto(codigo: string){
        const tipoBoleto = this.identificarTipoBoleto(codigo);
        let valorBoleto = '';
        let valorFinal;
       
        if (tipoBoleto == 'BANCO' || tipoBoleto == 'CARTAO_DE_CREDITO') {
            valorBoleto = codigo.substr(37);
            valorFinal = valorBoleto.substr(0, 8) + '.' + valorBoleto.substr(8, 2);

            let char = valorFinal.substr(1, 1);
            while (char === '0') {
                valorFinal = this.substringReplace(valorFinal, '', 0, 1);
                char = valorFinal.substr(1, 1);
            }
        } else {
            valorFinal = this.identificarValorCodBarrasArrecadacao(codigo);
        }
    
        return parseFloat(valorFinal.toString());
    }

    private identificarValorCodBarrasArrecadacao = (codigo: string) => {
        codigo = codigo.replace(/[^0-9]/g, '');
        const isValorEfetivo = this.identificarReferencia(codigo).efetivo;
    
        let valorBoleto = '';
        let valorFinal;
    
        if (isValorEfetivo) {
                valorBoleto = codigo.substr(4, 14);
                let valorBoletoChars = codigo.split('');
                valorBoletoChars.splice(11, 1);
                valorBoleto = valorBoletoChars.join('');
                valorBoleto = valorBoleto.substr(4, 11);
 
            valorFinal = valorBoleto.substr(0, 9) + '.' + valorBoleto.substr(9, 2);
    
            let char = valorFinal.substr(1, 1);
            while (char === '0') {
                valorFinal = this.substringReplace(valorFinal, '', 0, 1);
                char = valorFinal.substr(1, 1);
            }
    
        } else {
            valorFinal = 0;
        }
    
        return valorFinal;
    }

    private identificarReferencia(codigo: string): IdentificadorReferencia{
        codigo = codigo.replace(/[^0-9]/g, '');
    
        const referencia = codigo.substr(2, 1);
    
        if (typeof codigo !== 'string') throw new TypeError('Insira uma string válida!');
    
        switch (referencia) {
            case '6':
                return {
                    mod: 10,
                    efetivo: true
                };
                break;
            case '7':
                return {
                    mod: 10,
                    efetivo: false
                };
                break;
            case '8':
                return {
                    mod: 11,
                    efetivo: true
                };
                break;
            case '9':
                return {
                    mod: 11,
                    efetivo: false
                };
                break;
            default: return {
                    mod: 0,
                    efetivo: false
                };
                break;
        }
    }

    public getDataLinhaDig(codigo: string){
        
        codigo = codigo.replace(/[^0-9]/g, '');
        const tipoBoleto = this.identificarTipoBoleto(codigo);
    
        let fatorData = '';
        let dataBoleto = new Date("1997-10-07 20:54:59.000Z");
        // let dataBoleto = moment.tz("1997-10-07 20:54:59.000Z", "UTC");
    
        
        if (tipoBoleto == 'BANCO' || tipoBoleto == 'CARTAO_DE_CREDITO') {
            fatorData = codigo.substr(33, 4)
        } else {
            fatorData = '0';
        }
        
        dataBoleto.setDate(dataBoleto.getDate() + Number(fatorData));
    
        return dataBoleto;
    }
    
    public getCodigoBarras(linhaDigitavel: string): string{
        let codigo = linhaDigitavel.replace(/[^0-9]/g, '');

        const tipoBoleto = this.identificarTipoBoleto(codigo);

        let resultado = '';

        if (tipoBoleto == 'BANCO' || tipoBoleto == 'CARTAO_DE_CREDITO') {
            resultado = codigo.substr(0, 4) +
                codigo.substr(32, 1) +
                codigo.substr(33, 14) +
                codigo.substr(4, 5) +
                codigo.substr(10, 10) +
                codigo.substr(21, 10);
        } else {

            const codigoChars = codigo.split('');
            codigoChars.splice(11, 1);
            codigoChars.splice(22, 1);
            codigoChars.splice(33, 1);
            codigoChars.splice(44, 1);
            codigo = codigoChars.join('');

            resultado = codigo;
        }

        return resultado;
    }

    identificarTipoBoleto(codigo: string) {
        codigo = codigo.replace(/[^0-9]/g, '');

        if (typeof codigo !== 'string') throw new TypeError('Insira uma string válida!');
    
        if (codigo.substr(-14) == '00000000000000' || codigo.substr(5, 14) == '00000000000000') {
            return 'CARTAO_DE_CREDITO';
        } else if (codigo.substr(0, 1) == '8') {
            if (codigo.substr(1, 1) == '1') {
                return 'ARRECADACAO_PREFEITURA';
            } else if (codigo.substr(1, 1) == '2') {
                return 'CONVENIO_SANEAMENTO';
            } else if (codigo.substr(1, 1) == '3') {
                return 'CONVENIO_ENERGIA_ELETRICA_E_GAS';
            } else if (codigo.substr(1, 1) == '4') {
                return 'CONVENIO_TELECOMUNICACOES';
            } else if (codigo.substr(1, 1) == '5') {
                return 'ARRECADACAO_ORGAOS_GOVERNAMENTAIS';
            } else if (codigo.substr(1, 1) == '6' || codigo.substr(1, 1) == '9') {
                return 'OUTROS';
            } else if (codigo.substr(1, 1) == '7') {
                return 'ARRECADACAO_TAXAS_DE_TRANSITO';
            }
        } else {
            return 'BANCO';
        }
    }


    private splitCampos(linhaDigitavel: string){
        let campos = [];
        campos.push(linhaDigitavel.substr(0, 10))
        campos.push(linhaDigitavel.substr(10, 11))
        campos.push(linhaDigitavel.substr(21, 11))
        campos.push(linhaDigitavel.substr(32, 1))
        campos.push(linhaDigitavel.substr(33, 47))
        return campos;
    }

    private numbersOnly(value: any) {
        if (parseInt(value) || value === '0') {
            return value;
        }
    }
    
    private substringReplace(str:string , repl:string , inicio:number , tamanho:number ) {
        if (inicio < 0) {
            inicio = inicio + str.length;
        }
    
        tamanho = tamanho !== undefined ? tamanho : str.length;
        if (tamanho < 0) {
            tamanho = tamanho + str.length - inicio;
        }
    
        return [
            str.slice(0, inicio),
            repl.substr(0, tamanho),
            repl.slice(tamanho),
            str.slice(inicio + tamanho)
        ].join('');
    }

    private dataFormatada(data: Date){
        let dia  = data.getDate().toString();
        let mes  = (data.getMonth()).toString();    
        let ano = data.getFullYear();
        return `${ano}-${mes}-${dia}`
    }
}