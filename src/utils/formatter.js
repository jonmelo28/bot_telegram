function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

module.exports = {
  formatCurrency,
  formatInteger,
  formatDate
};