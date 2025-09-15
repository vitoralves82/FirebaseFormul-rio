import type { Question } from './types';

export const QUESTIONS: Question[] = [
  // Parte I - Livro de Registro de Bioincrustação
  { id: 'A.1', category: 'Parte I - Limpeza Proativa (A)', text: 'Data e localização do navio quando a limpeza proativa ocorreu.' },
  { id: 'A.2', category: 'Parte I - Limpeza Proativa (A)', text: 'Observações gerais em relação ao bioincrustação antes da limpeza, se houver (ou seja, extensão do microincrustação e macroincrustação de acordo com as classificações definidas).' },
  { id: 'A.3', category: 'Parte I - Limpeza Proativa (A)', text: 'Registros de permissões necessárias para realizar a limpeza proativa em água, se aplicável.' },
  { id: 'A.4', category: 'Parte I - Limpeza Proativa (A)', text: 'Detalhes do casco e áreas de nicho limpas.' },
  { id: 'A.5', category: 'Parte I - Limpeza Proativa (A)', text: 'Observações gerais em relação à bioincrustação após a limpeza, se houver (ou seja, extensão do microincrustação e macroincrustação de acordo com as classificações definidas).' },
  { id: 'A.6', category: 'Parte I - Limpeza Proativa (A)', text: 'Referência a qualquer evidência/apresentação de relatórios da limpeza (por exemplo, relatório do fornecedor, fotografias/vídeos e/ou recibos), se houver.' },
  { id: 'A.7', category: 'Parte I - Limpeza Proativa (A)', text: 'Método, fabricante e modelo do método de limpeza proativa utilizado, se não fornecido no BFMP.' },
  { id: 'A.8', category: 'Parte I - Limpeza Proativa (A)', text: 'Referência ao padrão de teste para o qual o método foi testado, se não fornecido no BFMP.' },
  { id: 'A.9', category: 'Parte I - Limpeza Proativa (A)', text: 'Nome, cargo e assinatura da pessoa responsável pela atividade.' },
  
  { id: 'B.1', category: 'Parte I - Inspeção (B)', text: 'Data e localização da inspeção.' },
  { id: 'B.2', category: 'Parte I - Inspeção (B)', text: 'Métodos utilizados para a inspeção (incluindo ferramentas/dispositivos).' },
  { id: 'B.3', category: 'Parte I - Inspeção (B)', text: 'Áreas inspecionadas do navio.' },
  { id: 'B.4', category: 'Parte I - Inspeção (B)', text: 'Observações em relação à bioincrustação (extensão da microincrustação e macroincrustação de acordo com as taxas de incrustação definidas).' },
  { id: 'B.5', category: 'Parte I - Inspeção (B)', text: 'Observações em relação ao estado do sistema anti-incrustante (AFS).' },
  { id: 'B.6', category: 'Parte I - Inspeção (B)', text: 'Referência a qualquer evidência/apresentação de relatórios da inspeção.' },
  { id: 'B.7', category: 'Parte I - Inspeção (B)', text: 'Nome, cargo e assinatura da pessoa responsável pela atividade.' },

  { id: 'C.1', category: 'Parte I - Limpeza Reativa (C)', text: 'Data e localização da inspeção.' },
  { id: 'C.2', category: 'Parte I - Limpeza Reativa (C)', text: 'Registros de autorizações necessárias para realizar a limpeza em água, se aplicável.' },
  { id: 'C.3', category: 'Parte I - Limpeza Reativa (C)', text: 'Descrição das áreas do casco e nicho limpas.' },
  { id: 'C.4', category: 'Parte I - Limpeza Reativa (C)', text: 'Métodos de limpeza reativa utilizados.' },
  { id: 'C.5', category: 'Parte I - Limpeza Reativa (C)', text: 'Estimativa geral de bioincrustação após a limpeza, de acordo com as taxas de incrustação definidas.' },
  { id: 'C.6', category: 'Parte I - Limpeza Reativa (C)', text: 'Referência a qualquer evidência/apresentação de relatórios da atividade.' },
  { id: 'C.7', category: 'Parte I - Limpeza Reativa (C)', text: 'Recibo ou outra evidência documental de coleta/entrega dos resíduos.' },
  { id: 'C.8', category: 'Parte I - Limpeza Reativa (C)', text: 'Nome, cargo e assinatura da pessoa responsável pela atividade.' },
  { id: 'C.9', category: 'Parte I - Limpeza Reativa (C)', text: 'Fabricante e modelo do dispositivo de limpeza e coleta, bem como da empresa de limpeza responsável pela execução.' },
  { id: 'C.10', category: 'Parte I - Limpeza Reativa (C)', text: 'Referência ao padrão de teste para o qual o método foi testado, se relevante.' },
  
  { id: 'D.1', category: 'Parte I - Outros (D)', text: 'Procedimentos operacionais adicionais e observações gerais.' },

  // Parte II - Livro de Registro de Bioincrustação
  { id: 'II-A.1', category: 'Parte II - Operação Fora do Perfil (A)', text: 'Duração e datas em que o navio não está operando conforme seu BFMP.' },
  { id: 'II-A.2', category: 'Parte II - Operação Fora do Perfil (A)', text: 'Razão para a partida da operação normal.' },
  { id: 'II-A.3', category: 'Parte II - Operação Fora do Perfil (A)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções mais frequentes) durante o período em que o navio está operando fora do perfil operacional esperado.' },
  { id: 'II-A.4', category: 'Parte II - Operação Fora do Perfil (A)', text: 'Hora e local (nome do porto ou latitude/longitude) quando o navio volta a operar conforme especificado no BFMP.' },

  { id: 'II-B.1', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Data/período e descrição de qualquer redução observada na eficácia, dano ou desvio da manutenção/serviço do revestimento anti-incrustante (AFC) durante sua vida útil.' },
  { id: 'II-B.2', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Data/período e descrição de qualquer operação além da vida útil esperada.' },
  { id: 'II-B.3', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções mais frequentes).' },
  { id: 'II-B.4', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Data/período e local onde foi realizada qualquer manutenção ou reparo no AFC (por exemplo, em dique seco).' },
  { id: 'II-B.5', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Descrição de qualquer AFC, incluindo reparos em remendos, aplicado durante a manutenção. Detalhe o tipo de AFC, a área e os locais em que foi aplicado (incluindo a localização dos blocos de suporte do dique seco, se relevante), uma estimativa percentual de cobertura da reaplicação do AFC, a espessura do revestimento alcançada e qualquer trabalho de preparação de superfície realizado (por exemplo, remoção completa do AFC subjacente ou aplicação de novo AFC sobre o AFC existente).' },
  { id: 'II-B.6', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Referência a quaisquer dados de suporte para a manutenção do AFC (por exemplo, arquivo técnico do AFC).' },
  { id: 'II-B.7', category: 'Parte II - Manutenção/Dano do AFC (B)', text: 'Nome, cargo e assinatura da pessoa responsável pela atividade.' },

  { id: 'II-C.1', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Data/período e descrição de qualquer redução observada na eficácia, tempo de inatividade, mau funcionamento ou desvio da manutenção/serviço do sistema de prevenção de crescimento marinho (MGPS) durante sua vida útil.' },
  { id: 'II-C.2', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Data/período e descrição de operação além da vida útil esperada.' },
  { id: 'II-C.3', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Data e local de quaisquer instâncias em que o sistema não estava operando conforme o BFMP.' },
  { id: 'II-C.4', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Registros de manutenção (incluindo monitoramento regular das funções elétricas e mecânicas dos sistemas, calibração ou ajuste das dosagens de tratamento).' },
  { id: 'II-C.5', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções mais frequentes).' },
  { id: 'II-C.6', category: 'Parte II - Manutenção/Serviço do MGPS (C)', text: 'Nome, cargo e assinatura da pessoa responsável pela atividade.' },

  { id: 'II-D.1', category: 'Parte II - Manutenção de outros AFS (D)', text: 'Data/período e descrição de qualquer redução observada na eficácia, tempo de inatividade, mau funcionamento ou desvio da manutenção/serviço de outros Sistemas de Proteção Antifouling (AFS) durante sua vida útil.' },
  { id: 'II-D.2', category: 'Parte II - Manutenção de outros AFS (D)', text: 'Data/período e descrição de operação além da vida útil esperada.' },
  { id: 'II-D.3', category: 'Parte II - Manutenção de outros AFS (D)', text: 'Data e local de quaisquer instâncias em que o sistema não estava operando conforme o Plano de Gerenciamento de Bioincrustação.' },
  { id: 'II-D.4', category: 'Parte II - Manutenção de outros AFS (D)', text: 'Registros de manutenção.' },
  { id: 'II-D.5', category: 'Parte II - Manutenção de outros AFS (D)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções mais frequentes).' },

  { id: 'II-E.1', category: 'Parte II - Desvio da Limpeza Proativa (E)', text: 'Data e local onde o navio não realizou a limpeza proativa conforme especificado.' },
  { id: 'II-E.2', category: 'Parte II - Desvio da Limpeza Proativa (E)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções de bioincrustação e/ou limpeza reativa antes do retorno à atividade de limpeza proativa).' },
  { id: 'II-E.3', category: 'Parte II - Desvio da Limpeza Proativa (E)', text: 'Registros de manutenção, se houver.' },
  { id: 'II-E.4', category: 'Parte II - Desvio da Limpeza Proativa (E)', text: 'Data em que o navio retornou às atividades normais com a limpeza proativa.' },

  { id: 'II-F.1', category: 'Parte II - Desvio da Limpeza Reativa (F)', text: 'Data e local onde o navio foi inspecionado e a limpeza reativa se mostrou necessária.' },
  { id: 'II-F.2', category: 'Parte II - Desvio da Limpeza Reativa (F)', text: 'Ações de contingência tomadas até a limpeza reativa, incluindo o agendamento da atividade de limpeza reativa.' },
  { id: 'II-F.3', category: 'Parte II - Desvio da Limpeza Reativa (F)', text: 'Data em que o navio concluiu a limpeza reativa e referência ao registro relevante na Parte I.' },

  { id: 'II-G.1', category: 'Parte II - Navio Parado (G)', text: 'Data e local onde o navio ficou parado, incluindo uma descrição geral da pressão de bioincrustação, por exemplo, temperatura e distância da linha costeira.' },
  { id: 'II-G.2', category: 'Parte II - Navio Parado (G)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação (por exemplo, inspeções, fechamento de caixas de mar ou viagens curtas antes e após o período de parada).' },
  { id: 'II-G.3', category: 'Parte II - Navio Parado (G)', text: 'Precauções tomadas para minimizar a acumulação de bioincrustação (por exemplo, viagem curta).' },
  { id: 'II-G.4', category: 'Parte II - Navio Parado (G)', text: 'Data em que o navio retornou às operações normais.' },

  { id: 'II-H.1', category: 'Parte II - Perda de Desempenho (H)', text: 'Data e local onde o navio começou a apresentar perda de desempenho além das expectativas.' },
  { id: 'II-H.2', category: 'Parte II - Perda de Desempenho (H)', text: 'Inspeções ou ações de gestão de bioincrustação realizadas antes e após o período de perda de desempenho.' },
  { id: 'II-H.3', category: 'Parte II - Perda de Desempenho (H)', text: 'Ações de contingência tomadas para minimizar a acumulação de bioincrustação.' },
  { id: 'II-H.4', category: 'Parte II - Perda de Desempenho (H)', text: 'Data em que o navio retornou ao desempenho normal.' },

  { id: 'II-I.1', category: 'Parte II - Outras Variações (I)', text: 'Outras variações.' }
];
