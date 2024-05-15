const formatoData = new Intl.DateTimeFormat('pt-Br', {
  dateStyle: 'short',
  timeZone: 'UTC',
})
const formatoReal = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const preencherZeroNumeroData = (numero: Number) =>
  numero.toString().padStart(2, '0')

export const gerarDatePorString = (dataString: string) => {
  if (dataString) {
    const [dia, mes, ano] = dataString.split('/')
    return new Date(+ano, +mes - 1, +dia)
  }
  return null
}

export const gerarStringPorDate = (data: Date) =>
  data
    ? `${preencherZeroNumeroData(data.getDate())}
      /${preencherZeroNumeroData(data.getMonth())}
      /${data.getFullYear()}`
  : null


export const gerarStringReal = (valor: number) => formatoReal.format(valor)

export const gerarDoublePorValorMonetario = (valor: string): number =>
  parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'))

export const gerarStringPorcentagemPorNumeroInteiro = (
  valor: number
): string => (valor ? `${valor}%` : '0%')

export const gerarDoublePorValorPorcentagem = (valor: string): number => {
  const valorSemPorcentagem = valor.replace('%', '')
  return parseFloat(valorSemPorcentagem)
}
