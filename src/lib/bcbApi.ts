export const fetchDolarPtax = async (): Promise<number> => {
  try {
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
    
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar cotação do BCB');
    }
    
    const data = await response.json();
    
    if (data.value && data.value.length > 0) {
      return data.value[0].cotacaoVenda;
    }
    
    return 5.50; // Valor padrão caso não consiga buscar
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    return 5.50; // Valor padrão em caso de erro
  }
};
