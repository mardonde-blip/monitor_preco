// Templates predefinidos para mensagens do Telegram

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: 'alert' | 'summary' | 'notification';
}

export const TELEGRAM_TEMPLATES: MessageTemplate[] = [
  {
    id: 'default-alert',
    name: 'Alerta Padrão',
    description: 'Template padrão com todas as informações essenciais',
    category: 'alert',
    template: '🚨 <b>ALERTA DE PREÇO!</b>\n\n📦 <b>{product_name}</b>\n\n🎯 Preço alvo: R$ {target_price}\n🔥 <b>Preço atual: R$ {current_price}</b>\n📉 Desconto: <b>{discount}%</b>\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n⏰ {timestamp}'
  },
  {
    id: 'minimal-alert',
    name: 'Alerta Minimalista',
    description: 'Template simples e direto ao ponto',
    category: 'alert',
    template: '💰 <b>{product_name}</b>\n\nR$ {current_price} (era R$ {target_price})\n\n🛒 <a href="{product_url}">Comprar agora</a>'
  },
  {
    id: 'detailed-alert',
    name: 'Alerta Detalhado',
    description: 'Template com informações completas e formatação rica',
    category: 'alert',
    template: '🎯 <b>META ATINGIDA!</b>\n\n━━━━━━━━━━━━━━━━━━━━\n📦 <b>{product_name}</b>\n🏪 Loja: {store}\n\n💰 <b>PREÇOS:</b>\n• Meta: R$ {target_price}\n• Atual: <b>R$ {current_price}</b>\n• Economia: <b>R$ {savings}</b> ({discount}%)\n\n🛒 <a href="{product_url}">🔥 COMPRAR AGORA 🔥</a>\n\n📅 {timestamp}\n━━━━━━━━━━━━━━━━━━━━'
  },
  {
    id: 'emoji-rich',
    name: 'Rico em Emojis',
    description: 'Template divertido com muitos emojis',
    category: 'alert',
    template: '🚨🔥 OFERTA IMPERDÍVEL! 🔥🚨\n\n🎁 {product_name} 🎁\n\n💸 Era: R$ {target_price}\n💰 Agora: R$ {current_price}\n🎉 Desconto: {discount}%\n\n🏃‍♂️💨 Corre que está acabando!\n🛒👆 <a href="{product_url}">CLIQUE AQUI</a>\n\n⏰ {timestamp}'
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Template formal e profissional',
    category: 'alert',
    template: '<b>Notificação de Preço</b>\n\nProduto: {product_name}\nPreço alvo: R$ {target_price}\nPreço atual: R$ {current_price}\nDesconto: {discount}%\n\nLink: <a href="{product_url}">{product_name}</a>\n\nData/Hora: {timestamp}'
  },
  {
    id: 'urgent-alert',
    name: 'Alerta Urgente',
    description: 'Template para alertas de alta prioridade',
    category: 'alert',
    template: '⚡ <b>ALERTA URGENTE!</b> ⚡\n\n🔴 {product_name}\n\n💥 PREÇO HISTÓRICO: R$ {current_price}\n🎯 Sua meta: R$ {target_price}\n📊 Desconto: <b>{discount}%</b>\n\n⏰ OFERTA POR TEMPO LIMITADO!\n🛒 <a href="{product_url}">COMPRAR AGORA</a>\n\n{timestamp}'
  },
  {
    id: 'daily-summary',
    name: 'Resumo Diário Padrão',
    description: 'Template para resumo diário dos produtos',
    category: 'summary',
    template: '📊 <b>RESUMO DIÁRIO</b>\n\n📦 Produtos monitorados: {total_products}\n🎯 Metas atingidas: {targets_reached}\n📉 Quedas de preço: {price_drops}\n\n{opportunities}\n⏰ {timestamp}'
  },
  {
    id: 'weekly-summary',
    name: 'Resumo Semanal',
    description: 'Template para resumo semanal',
    category: 'summary',
    template: '📈 <b>RESUMO SEMANAL</b>\n\n🗓️ Período: {week_period}\n📦 Produtos: {total_products}\n🎯 Metas atingidas: {targets_reached}\n💰 Economia total: R$ {total_savings}\n\n<b>🔥 MELHORES OPORTUNIDADES:</b>\n{top_opportunities}\n\n⏰ {timestamp}'
  },
  {
    id: 'price-drop-only',
    name: 'Apenas Queda de Preço',
    description: 'Template específico para quedas de preço',
    category: 'notification',
    template: '📉 <b>PREÇO CAIU!</b>\n\n{product_name}\n\n💰 De R$ {old_price} para R$ {current_price}\n📊 Queda de {discount}%\n\n🛒 <a href="{product_url}">Ver produto</a>\n\n{timestamp}'
  },
  {
    id: 'target-reached',
    name: 'Meta Atingida',
    description: 'Template específico para quando a meta é atingida',
    category: 'notification',
    template: '🎯 <b>META ATINGIDA!</b>\n\n✅ {product_name}\n\n🎉 Preço desejado: R$ {target_price}\n💰 Preço atual: R$ {current_price}\n\n🛒 <a href="{product_url}">Finalizar compra</a>\n\n{timestamp}'
  }
];

// Função para obter template por ID
export function getTemplateById(id: string): MessageTemplate | undefined {
  return TELEGRAM_TEMPLATES.find(template => template.id === id);
}

// Função para obter templates por categoria
export function getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
  return TELEGRAM_TEMPLATES.filter(template => template.category === category);
}

// Função para substituir variáveis no template
export function replaceTemplateVariables(
  template: string, 
  variables: Record<string, string | number>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  });
  
  return result;
}

// Variáveis disponíveis para templates
export const AVAILABLE_VARIABLES = {
  // Produto
  product_name: 'Nome do produto',
  product_url: 'URL do produto',
  store: 'Nome da loja',
  
  // Preços
  target_price: 'Preço alvo definido',
  current_price: 'Preço atual do produto',
  old_price: 'Preço anterior',
  savings: 'Valor economizado',
  discount: 'Percentual de desconto',
  
  // Data/Hora
  timestamp: 'Data e hora atual',
  date: 'Data atual',
  time: 'Hora atual',
  
  // Resumos
  total_products: 'Total de produtos monitorados',
  targets_reached: 'Número de metas atingidas',
  price_drops: 'Número de quedas de preço',
  opportunities: 'Lista de oportunidades',
  top_opportunities: 'Melhores oportunidades',
  total_savings: 'Economia total',
  week_period: 'Período da semana'
};

// Função para validar template
export function validateTemplate(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verificar se o template não está vazio
  if (!template.trim()) {
    errors.push('Template não pode estar vazio');
  }
  
  // Verificar se há variáveis não fechadas
  const openBraces = (template.match(/{/g) || []).length;
  const closeBraces = (template.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Variáveis mal formatadas - verifique as chaves { }');
  }
  
  // Verificar se há variáveis inválidas
  const variablePattern = /{([^}]+)}/g;
  const matches = template.match(variablePattern);
  
  if (matches) {
    matches.forEach(match => {
      const variable = match.slice(1, -1); // Remove { }
      if (!AVAILABLE_VARIABLES.hasOwnProperty(variable)) {
        errors.push(`Variável desconhecida: ${match}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}