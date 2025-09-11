import type { Question } from './types';

export const QUESTIONS: Question[] = [
  // Gestão Ambiental e Estratégia
  { id: 'GA1', category: 'Gestão Ambiental', text: 'A empresa possui uma política ambiental formalizada? Se sim, anexe o documento.' },
  { id: 'GA2', category: 'Gestão Ambiental', text: 'Descreva os principais objetivos e metas ambientais para o próximo ano.' },
  { id: 'GA3', category: 'Gestão Ambiental', text: 'Existem responsáveis ou uma equipe dedicada à gestão ambiental? Quem são?' },

  // Consumo de Recursos
  { id: 'CR1', category: 'Recursos Hídricos', text: 'Qual o consumo total de água nos últimos 12 meses (em m³)? Anexe as faturas.' },
  { id: 'CR2', category: 'Recursos Hídricos', text: 'Existem medidas para a redução do consumo de água ou de reuso? Descreva-as.' },
  { id: 'CR3', category: 'Energia', text: 'Descreva o consumo de energia elétrica da sua unidade nos últimos 12 meses (em kWh).' },
  { id: 'CR4', category: 'Energia', text: 'A empresa utiliza fontes de energia renovável? Se sim, quais e em que proporção?' },
  { id: 'CR5', category: 'Matérias-Primas', text: 'Quais as principais matérias-primas utilizadas no processo produtivo e suas origens?' },

  // Emissões e Resíduos
  { id: 'ER1', category: 'Emissões Atmosféricas', text: 'Quais são as principais fontes de emissões atmosféricas e os poluentes associados?' },
  { id: 'ER2', category: 'Emissões Atmosféricas', text: 'A empresa realiza monitoramento das suas emissões? Anexe os últimos relatórios.' },
  { id: 'ER3', category: 'Gestão de Resíduos', text: 'Qual a quantidade total de resíduos gerados (separados por tipo: perigoso e não perigoso) nos últimos 12 meses?' },
  { id: 'ER4', category: 'Gestão de Resíduos', text: 'Descreva o processo de segregação, armazenamento e destinação final dos resíduos.' },
  { id: 'ER5', category: 'Efluentes', text: 'Descreva o sistema de tratamento de efluentes líquidos da empresa.' },

  // Biodiversidade e Fornecedores
  { id: 'BF1', category: 'Biodiversidade', text: 'A operação da empresa está localizada em ou perto de áreas de alta importância para a biodiversidade? Detalhe.' },
  { id: 'BF2', category: 'Cadeia de Fornecimento', text: 'Existem critérios ambientais para a seleção e avaliação de fornecedores? Quais são?' },

  // Conformidade e Riscos
  { id: 'CRF1', category: 'Conformidade Legal', text: 'Liste as principais licenças ambientais que a empresa possui e suas validades.' },
  { id: 'CRF2', category: 'Riscos e Oportunidades', text: 'Quais são os principais riscos e oportunidades ambientais identificados para o negócio?' },
];
