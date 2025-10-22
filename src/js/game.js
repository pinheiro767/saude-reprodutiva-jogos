// Game state variables
let gameStats = {
    knowledge: 50,
    medals: 0,
    currentPhase: 1,
    questionsAnswered: 0,
    questionsPerPhase: 14,
    phaseProgress: 0,
    completedPhases: [],
    joyCoins: 0,
    bombs: 0
};

let isMuted = true; // Inicia mutado para compliance com autoplay
let currentScenario = null;
let usedQuestions = [];

// --- INSTANCIANDO OBJETOS DE ÁUDIO ---
const bgm = document.getElementById('bgm');
const sfxCoin = document.getElementById('sfxCoin');
const sfxError = new Audio('assets/audio/error.mp3'); // Caminho atualizado
const sfxWin = document.getElementById('sfxWin');
const sfxMove = new Audio('assets/audio/move.mp3'); // Caminho atualizado
const sfxDiceRoll = new Audio('assets/audio/dice_roll.ogg'); // Caminho atualizado (se usado)

function playAudio(audioElement, volume = 1.0) {
    if (isMuted) return;
    audioElement.currentTime = 0;
    audioElement.volume = volume;
    audioElement.play().catch(e => console.log("Erro ao tocar áudio:", e));
}

function toggleMute() {
    isMuted = !isMuted;
    document.getElementById('mute-button').textContent = isMuted ? '🔇' : '🔊';
    
    // Mute/Unmute all audio elements
    bgm.muted = isMuted;
    sfxCoin.muted = isMuted;
    sfxError.muted = isMuted;
    sfxWin.muted = isMuted;
    sfxMove.muted = isMuted;
    sfxDiceRoll.muted = isMuted;

    // Garante que o BGM comece a tocar se for desmutado
    if (!isMuted && bgm.paused) {
        bgm.play().catch(e => console.log("Erro ao iniciar BGM:", e));
    }
}

// Mapeamento das imagens de personagem PERSONALIZADAS com o NOVO CAMINHO
const characterImages = {
    // Garoto
    'boy_q': 'assets/img/7.jpg', // Garoto WHAT?! (Pergunta - usando a de erro/confuso)
    'boy_a': 'assets/img/4.jpg', // Garoto YES! (Acerto)
    'boy_e': 'assets/img/7.jpg', // Garoto WHAT?! (Erro)
    
    // Garota
    'girl_q': 'assets/img/2.jpg', // Garota pensativa (Pergunta - usando a de pergunta/confuso)
    'girl_a': 'assets/img/5.jpg', // Garota YES! (Acerto - usando a good job)
    'girl_e': 'assets/img/6.jpg', // Garota NO! (Erro)
    'girl_d': 'assets/img/3.jpg'  // Garota Dica/Ideia (Usada como default girl)
};

// Board game state
let boardState = {
    currentPosition: 0,
    totalMoves: 0,
    boardSquares: [],
    isRolling: false,
    questionsAnswered: 0,
    lastDiceRoll: 0
};

// Phase configuration (mantido)
const phases = {
    1: { name: "🌱 Descoberta Inicial", description: "Conhecimentos básicos sobre puberdade e sexualidade", reward: "🌱 Explorador do Conhecimento", color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", startIndex: 0, endIndex: 14, type: "board" },
    2: { name: "🛡️ Proteção e Segurança", description: "Métodos contraceptivos e prevenção de IST", reward: "🛡️ Guardião da Saúde", color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", startIndex: 14, endIndex: 28, type: "character" },
    3: { name: "💡 Conhecimento Avançado", description: "Temas complexos e situações específicas", reward: "💡 Mestre da Sabedoria", color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", startIndex: 28, endIndex: 42, type: "board" },
    4: { name: "🎯 Perguntas de Risco", description: "Desafios críticos sobre saúde sexual", reward: "🎯 Especialista em Sexualidade", color: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)", startIndex: 42, endIndex: 55, type: "character" }
};

// Educational scenarios (mantido, pois é o conteúdo essencial)
const scenarios = [
    // [14 perguntas da fase 1 - Descoberta Inicial (índices 0 a 13)]
    { tema: "Preservativo", text: "Qual o erro mais comum ao usar um preservativo masculino e como corrigi-lo?", options: [{ text: "Não retirar o ar da ponta antes de desenrolar", points: 50, feedback: "Correto! O erro mais comum é não apertar suavemente a ponta (reservatório) antes de colocar, o que pode criar bolhas de air e fazer o preservativo estourar." }, { text: "Não verificar o prazo de validade", points: 20, feedback: "Importante, mas não é o erro mais comum." }, { text: "Usar o tamanho errado", points: 30, feedback: "Também é importante, mas o erro mais comum é não retirar o ar da ponta." }], tipo: "Informativa", character_type: "boy" },
    { tema: "Preservativo", text: "Por quanto tempo posso guardar um preservativo na carteira antes que se torne inseguro?", options: [{ text: "Devo evitar guardar na carteira por muito tempo", points: 50, feedback: "Correto! O calor e a fricção (esfregar na carteira) podem danificar o látex. Guarde em local fresco, seco e protegido, sempre verificando o prazo de validade." }, { text: "Não há problema, posso guardar por meses", points: -10, feedback: "Errado! O calor e a fricção podem danificar o látex, tornando o preservativo ineficaz." }, { text: "Apenas uma semana é seguro", points: 25, feedback: "Melhor que meses, mas o ideal é evitar carteiras e locais com calor e fricção." }], tipo: "Informativa", character_type: "boy" },
    { tema: "Preservativo", text: "Existem preservativos para tamanhos de pênis que se encontram fora da média?", options: [{ text: "Sim, existem preservativos com diâmetros diferentes", points: 50, feedback: "Correto! Existem preservativos com diâmetros diferentes para garantir conforto a todos os tamanhos. Essa informação está na embalagem." }, { text: "Não, todos os preservativos são iguais", points: -5, feedback: "Incorreto! Existem diferentes tamanhos para garantir conforto e segurança." }, { text: "Só existem dois tamanhos: pequeno e grande", points: 20, feedback: "Há mais variedade que isso! Existem vários diâmetros diferentes disponíveis." }], tipo: "Informativa", character_type: "boy" },
    { tema: "Preservativo", text: "Devo usar camisinha para fazer sexo oral?", options: [{ text: "Sim, para prevenir IST", points: 50, feedback: "Correto! Se o homem tiver uma IST, pode ser transmitida caso haja ferimentos na boca do parceiro(a). Existem até preservativos com sabores!" }, { text: "Não é necessário no sexo oral", points: -15, feedback: "Errado! IST podem ser transmitidas pelo sexo oral se houver ferimentos na boca." }, { text: "Só se houver sintomas visíveis", points: 10, feedback: "Muitas IST são assintomáticas. É melhor sempre usar proteção." }], tipo: "Informativa", character_type: "boy" },
    { tema: "Preservativo Feminino", text: "Para que serve o anel externo do preservativo feminino?", options: [{ text: "Para manter o preservativo no lugar e cobrir a vulva", points: 50, feedback: "Correto! O anel externo mantém o preservativo feminino no lugar fora da vagina, cobrindo a vulva/área externa, e é usado para guiar a inserção e remoção." }, { text: "Apenas para decoração", points: -10, feedback: "Não! Tem função importante na proteção e uso correto." }, { text: "Para facilitar apenas a remoção", points: 20, feedback: "Facilita a remoção, mas sua função principal é manter no lugar e proteger a área externa." }], tipo: "Informativa", character_type: "girl" },
    { tema: "Preservativo Feminino", text: "Qual a principal vantagem do preservativo feminino?", options: [{ text: "Dá à mulher autonomia e controle sobre a proteção", points: 50, feedback: "Correto! A principal vantagem é dar à mulher autonomia e controle sobre a proteção durante o sexo." }, { text: "É mais barato que o masculino", points: 10, feedback: "Não necessariamente. A principal vantagem é outra." }, { text: "É mais eficaz que o masculino", points: 20, feedback: "Ambos são eficazes quando usados corretamente. A vantagem principal é a autonomia feminina." }], tipo: "Informativa", character_type: "girl" },
    { text: "O lubrificante só serve para quem faz sexo anal?", options: [{ text: "Não, aumenta o prazer e facilita a penetração em geral", points: 50, feedback: "Correto! Lubrificação nunca é demais: aumenta o prazer, facilita a penetração, diminui o atrito durante a masturbação masculina e feminina." }, { text: "Sim, apenas para sexo anal", points: -5, feedback: "Não! Lubrificação é benéfica em várias situações." }, { text: "Só para pessoas com problemas de lubrificação natural", points: 20, feedback: "Não apenas! Lubrificação adicional beneficia a todos, aumentando prazer e conforto." }], character_type: "boy" },
    { text: "Quanto tempo antes do sexo a mulher pode colocar a camisinha feminina?", options: [{ text: "Até 8 horas antes da relação", points: 50, feedback: "Correto! A mulher pode inseri-la até 8 horas antes da relação sexual, aumentando a conveniência e espontaneidade." }, { text: "Apenas no momento do sexo", points: 10, feedback: "Pode ser colocada antes! Isso aumenta a conveniência." }, { text: "Até 24 horas antes", points: 20, feedback: "Muito tempo! O recomendado é até 8 horas antes." }], character_type: "girl" },
    { text: "Onde posso encontrar camisinha feminina gratuitamente?", options: [{ text: "Na UPA do meu bairro, gratuitamente", points: 50, feedback: "Correto! Gratuitamente na UPA do seu bairro, mas você também pode comprar em farmácias." }, { text: "Apenas em farmácias, sempre pagando", points: 5, feedback: "Você pode comprar em farmácias, mas há opções gratuitas!" }, { text: "Não existe distribuição gratuita", points: -10, feedback: "Existe sim! O SUS oferece preservativos femininos gratuitamente nas UPAs." }], character_type: "girl" },
    { text: "Como faço para conseguir a camisinha feminina na UPA?", options: [{ text: "Ela deve estar em local visível e de fácil acesso", points: 50, feedback: "Correto! Ela deverá estar em local visível e de fácil acesso, preferencialmente ao lado da cesta de camisinha masculina." }, { text: "Preciso pedir para um funcionário", points: 20, feedback: "Você pode pedir, mas elas devem estar disponíveis em local acessível." }, { text: "Só médicos podem fornecer", points: -5, feedback: "Não! Elas devem estar disponíveis em local de fácil acesso para todos." }], character_type: "girl" },
    { text: "Onde devo descartar a camisinha feminina após o uso?", options: [{ text: "No lixo do banheiro, enrolada em papel higiênico", points: 50, feedback: "Correto! Sempre descarte no lixo do banheiro, de preferência enrolada em papel higiênico." }, { text: "No vaso sanitário", points: -15, feedback: "Nunca! Isso pode entupir o encanamento e causar problemas ambientais." }, { text: "Em qualquer lixo da casa", points: 25, feedback: "Melhor no lixo do banheiro por questões de higiene, enrolada em papel higiênico." }], character_type: "girl" },
    { text: "Além da camisinha feminina e masculina, quais são os outros métodos contraceptivos que funcionam como 'barreira'?", options: [{ text: "O diafragma é exemplo de outro método de barreira", points: 50, feedback: "Correto! O diafragma é exemplo de outro método de barreira. Mas lembre-se: para que seja seguro, precisa ser usado com gel espermicida." }, { text: "Não existem outros métodos de barreira", points: -5, feedback: "Existem sim! Há outros métodos de barreira disponíveis." }, { text: "Apenas pílulas anticoncepcionais", points: -10, feedback: "Pílulas não são métodos de barreira! Elas são métodos hormonais." }], character_type: "boy" },
    { text: "O que é a pílula do dia seguinte?", options: [{ text: "É um contraceptivo de emergência para casos pontuais", points: 50, feedback: "Correto! É um contraceptivo de emergência que deve ser usado apenas em casos pontuais de falha ou ausência de outro método." }, { text: "Um método contraceptivo para uso diário", points: -10, feedback: "Não! Não é para uso diário, é apenas para emergências." }, { text: "Uma vitamina para mulheres", points: -15, feedback: "Não é vitamina! É um medicamento contraceptivo de emergência." }], character_type: "girl" },
    { text: "A pílula do dia seguinte pode ser usada como método contraceptivo regular?", options: [{ text: "Não, pois sua eficácia é menor e a dose hormonal é muito elevada", points: 50, feedback: "Correto! Não, pois a sua eficácia é menor do que a pílula diária e a dose hormonal é muito elevada." }, { text: "Sim, é mais prática que outros métodos", points: -15, feedback: "Não! Não deve ser usada regularmente." }, { text: "Pode ser usada até 3 vezes por mês", points: -10, feedback: "Não! Deve ser usada apenas em emergências, não regularmente." }], character_type: "girl" },
    
    // [14 perguntas da fase 2 - Proteção e Segurança (índices 14 a 27)]
    { text: "Existe chance de engravidar após tomar a pílula do dia seguinte?", options: [{ text: "Sim, as chances são pequenas mas não zero", points: 50, feedback: "Correto! Sim! As chances são pequenas, mas não é zero e diminui quanto mais tempo se passa entre a relação e a ingestão da pílula." }, { text: "Não, ela é 100% eficaz", points: -10, feedback: "Não é 100% eficaz! Sempre há uma pequena chance." }, { text: "Só se for tomada após 24 horas", points: 20, feedback: "Há chance mesmo se tomada antes de 24 horas, mas a eficácia diminui com o tempo." }], character_type: "girl" },
    { text: "Há sangramento após tomar a pílula do dia seguinte?", options: [{ text: "Pode ocorrer sangramento até 15 dias após a ingestão", points: 50, feedback: "Correto! Pode ocorrer um sangramento até 15 dias após a ingestão da pílula, devido à variação hormonal provocada pelo hormônio." }, { text: "Nunca há sangramento", points: -5, feedback: "Pode sim haver sangramento devido à variação hormonal." }, { text: "Só há sangramento se não funcionar", points: 10, feedback: "O sangramento pode ocorrer independentemente da eficácia, é devido à variação hormonal." }], character_type: "girl" },
    { text: "Quando devo tomar a pílula do dia seguinte?", options: [{ text: "Quando o preservativo rasga ou estoura", points: 50, feedback: "Correto! Deve ser utilizada quando o preservativo rasga ou estoura, mas lembre-se: uma visita ao ginecologista é sempre importante." }, { text: "Sempre após qualquer relação sexual", points: -15, feedback: "Não! Apenas em situações de emergência, não após toda relação." }, { text: "Uma vez por mês como prevenção", points: -10, feedback: "Não! É para prevenção regular! Apenas para emergências pontuais." }], character_type: "girl" },
    { text: "Como a pílula do dia seguinte age no meu corpo?", options: [{ text: "Dificulta a movimentação do espermatozoide e inibe/atrasa a ovulação", points: 50, feedback: "Correto! A função desse medicamento é dificultar a movimentação do espermatozoide dentro do útero e inibir ou atrasar a ovulação. Seu funcionamento visa impedir que o espermatozoide e o óvulo se encontrem para que ocorra a fecundação." }, { text: "Mata os espermatozoides imediatamente", points: 10, feedback: "Não mata diretamente, mas dificulta sua movimentação e pode inibir a ovulação." }, { text: "Interrompe uma gravidez já estabelecida", points: -15, feedback: "Não! Ela não interrompe gravidez, apenas previne a fecundação." }], character_type: "girl" },
    { text: "A pílula do dia seguinte tem efeito colateral?", options: [{ text: "Sim, devido à alta carga hormonal pode causar vários efeitos", points: 50, feedback: "Correto! Sim, devido a sua alta carga hormonal. Os mais comuns são: dores nas mamas e na barriga; diarreia; vômito; sangramento vaginal e atrasos na menstruação." }, { text: "Não, é completamente segura sem efeitos colaterais", points: -10, feedback: "Não é verdade! Devido à alta carga hormonal, pode ter efeitos colaterais." }, { text: "Apenas náuseas leves", points: 20, feedback: "Os efeitos podem ser mais variados: dores nas mamas e barriga, diarreia, vômito, sangramento e atrasos menstruais." }], character_type: "girl" },
    { text: "Existe alguma IST que o preservativo não protege totalmente?", options: [{ text: "Sim, HPV e Herpes podem ser transmitidas por áreas não cobertas", points: 50, feedback: "Correto! O preservativo protege as áreas que cobre, mas IST como o HPV (Vírus do Papiloma Humano) e o Herpes Genital podem ser transmitidas pelo contato com áreas da pele infectadas que não estão cobertas pelo preservativo." }, { text: "Não, o preservativo protege 100% contra toda IST", points: -10, feedback: "Não é verdade! Algumas IST podem ser transmitidas por áreas não cobertas." }, { text: "Apenas a AIDS não é totalmente prevenida", points: 10, feedback: "O preservativo é muito eficaz contra HIV/AIDS. HPV e Herpes são as principais exceções por transmitirem por áreas não cobertas." }], character_type: "boy" },
    { text: "Mito ou Verdade: A ducha vaginal após a relação sexual previne gravidez e IST?", options: [{ text: "Mito, pode empurrar bactérias para dentro e desequilibrar a flora", points: 50, feedback: "Correto! Mito. A ducha pode na verdade empurrar bactérias e vírus para dentro do colo do útero, além de desequilibrar a flora vaginal, aumentando o risco de infecções." }, { text: "Verdade, limpa e protege", points: -15, feedback: "Mito! A ducha pode ser prejudicial e não oferece proteção." }, { text: "Verdade, mas só para IST", points: -10, feedback: "Mito! A ducha não protege contra IST e pode até aumentar o risco de infecções." }], character_type: "girl" },
    { text: "Mito ou Verdade: Sexo não pode acontecer durante a menstruação.", options: [{ text: "Mito, é seguro com consentimento e higiene, pode até aliviar cólicas", points: 50, feedback: "Correto! Mito. É seguro ter relações sexuais durante a menstruação, desde que haja consentimento mútuo e que a higiene seja mantida. O sexo pode trazer benefícios, como alívio das cólicas e melhora do humor, devido à liberação de hormônios como endorfinas e ocitocina, mas o uso de preservativos é fundamental." }, { text: "Verdade, é perigoso e insalubre", points: -10, feedback: "Mito! É seguro desde que haja consentimento e higiene adequada." }, { text: "Verdade, pode causar infecções", points: -5, feedback: "Mito! Com higiene adequada e preservativos, é seguro e pode até ter benefícios como alívio de cólicas." }], character_type: "girl" },
    { text: "Mito ou Verdade: Durante a menstruação não tem risco de engravidar.", options: [{ text: "Mito, ainda há risco especialmente com ciclos irregulares", points: 50, feedback: "Correto! Mito. Embora o risco seja menor do que em outros momentos do ciclo, a gravidez ainda é uma possibilidade, especialmente se o ciclo for irregular. Por isso, métodos contraceptivos devem ser usados se a gravidez não for desejada." }, { text: "Verdade, é impossível engravidar menstruada", points: -15, feedback: "Mito! Embora o risco seja menor, ainda existe possibilidade de gravidez." }, { text: "Verdade, o sangue impede a fecundação", points: -10, feedback: "Mito! O sangue menstrual não impede a fecundação. Sempre há algum risco de gravidez." }], character_type: "girl" },
    { text: "Qual é o único método contraceptivo que oferece proteção contra a maioria das IST?", options: [{ text: "O preservativo (feminino ou masculino)", points: 50, feedback: "Correto! O preservativo (feminino ou masculino) é o único método que oferece dupla proteção: contra a gravidez e contra a maioria das IST." }, { text: "Pílula anticoncepcional", points: -10, feedback: "Não! A pílula só previne gravidez, não protege contra IST." }, { text: "DIU (Dispositivo Intrauterino)", points: -5, feedback: "O DIU previne gravidez, mas não oferece proteção contra IST." }], character_type: "boy" },
    { text: "O que significa 'Consentimento Contínuo' e por que é importante?", options: [{ text: "Deve ser confirmado em cada etapa e pode ser retirado a qualquer momento", points: 50, feedback: "Correto! Significa que o consentimento deve ser dado e confirmado em cada etapa da atividade sexual, podendo ser retirado a qualquer momento. É crucial porque o consentimento anterior não garante o atual." }, { text: "Consentimento dado uma vez vale para sempre", points: -15, feedback: "Errado! O consentimento pode ser retirado a qualquer momento." }, { text: "Só é necessário no início da relação", points: -10, feedback: "Não! O consentimento deve ser contínuo e pode ser retirado em qualquer momento." }], character_type: "boy" },
    { text: "Qual é a diferença entre Orientação Sexual e Identidade de Gênero?", options: [{ text: "Orientação Sexual é atração; Identidade de Gênero é como se identifica", points: 50, feedback: "Correto! Orientação Sexual é a atração emocional, romântica e/ou sexual por outras pessoas. Identidade de Gênero é o sentido interno e individual de ser homem, mulher, ambos, nenhum, ou noutro gênero." }, { text: "São a mesma coisa", points: -10, feedback: "Não! São conceitos diferentes e independentes." }, { text: "Identidade de Gênero determina a Orientação Sexual", points: -5, feedback: "Não! São conceitos independentes - identidade de gênero não determina orientação sexual." }], character_type: "boy" },
    { text: "Qual é a diferença entre heterossexual e homossexual?", options: [{ text: "Heterossexual: atração pelo gênero oposto; Homossexual: pelo mesmo gênero", points: 50, feedback: "Correto! Heterossexual: sente atração pelo gênero oposto. Homossexual: sente atração pelo mesmo gênero." }, { text: "Não há diferença real", points: -15, feedback: "Há sim diferença! São orientações sexuais distintas baseadas no gênero da atração." }, { text: "Heterossexual é normal, homossexual não", points: -20, feedback: "Ambas são orientações sexuais naturais e normais! Não há hierarquia entre orientações." }], character_type: "boy" },
    { text: "Qual é a diferença entre bissexual e assexual?", options: [{ text: "Bissexual: atração por mais de um gênero; Assexual: falta de atração sexual", points: 50, feedback: "Correto! Bissexual: sente atração por mais de um gênero. Assexual: falta de atração sexual." }, { text: "São orientações temporárias", points: -10, feedback: "Não! São orientações sexuais válidas e podem ser permanentes." }, { text: "Bissexual é confusão, assexual é doença", points: -20, feedback: "Ambas são orientações sexuais naturais e válidas! Não são confusão nem doença." }], character_type: "boy" },
    
    // [14 perguntas da fase 3 - Conhecimento Avançado (índices 28 a 41)]
    { text: "Se uma pessoa não tem sintomas visíveis de IST, significa que não tem a infecção?", options: [{ text: "Não, muitas ISTs podem ser assintomáticas por muito tempo", points: 50, feedback: "Correto! Não. Muita IST (como Clamídia e HPV) pode ser assintomática durante muito tempo, tornando os testes e o uso de preservativo essenciais mesmo na ausência de sintomas." }, { text: "Sim, sem sintomas significa sem infecção", points: -15, feedback: "Errado! Muitas ISTs podem ser assintomáticas por muito tempo." }, { text: "Só algumas ISTs são assintomáticas", points: 20, feedback: "Na verdade, muitas ISTs importantes podem ser assintomáticas, por isso testes regulares são essenciais." }], character_type: "girl" },
    { text: "Na pressa, qual é o erro mais bobo que pode estragar as camisinhas antes mesmo de serem utilizadas?", options: [{ text: "Rasgar a embalagem com os dentes ou unhas", points: 50, feedback: "Correto! Rasgar a embalagem com os dentes ou as unhas. Parece rápido, mas um microfuro invisível já anula a proteção. Dica: Sempre use os dedos para rasgar o sachê na borda serrilhada. Atenção: Guarde a camisinha em locais frescos, longe do calor (nada de porta-luvas do carro ou carteira apertada) para não danificar o material." }, { text: "Não verificar o prazo de validade", points: 20, feedback: "Importante, mas não é o erro mais bobo na pressa." }, { text: "Usar lubrificante inadequado", points: 25, feedback: "Também é um erro, mas o mais bobo na pressa é rasgar com dentes/unhas, criando microfuros." }], character_type: "boy" },
    { text: "Qual lado é o certo para desenrolar a camisinha masculina e o que fazer se colocar no lado errado?", options: [{ text: "Lado certo: borda para fora como chapéu. Se errar e tocar no pênis, jogue fora!", points: 50, feedback: "Correto! O lado certo é aquele em que a borda está para fora, parecendo um pequeno chapéu. Se você tentar desenrolar e ela não descer facilmente, é porque está do lado errado. Regra de Ouro: Se começou a desenrolar do lado errado e tocou no pênis, jogue fora e pegue outra! Fluidos pré-ejaculatórios (que já podem ter IST e espermatozoides) podem ter entrado em contato com a parte de dentro." }, { text: "Qualquer lado serve, é só virar", points: -15, feedback: "Errado! Se tocou no pênis do lado errado, deve jogar fora e pegar outra." }, { text: "Posso virar do avesso se colocar errado", points: -10, feedback: "Nunca! Se tocou no pênis do lado errado, jogue fora. Fluidos pré-ejaculatórios podem contaminar." }], character_type: "boy" },
    { text: "Por que é crucial apertar a pontinha (o 'bico') antes de desenrolar?", options: [{ text: "Para tirar o ar do reservatório e evitar que estoure na ejaculação", points: 50, feedback: "Correto! Aquela pontinha é o reservatório do esperma. Se não apertar para tirar o ar, o ar fica preso. Na hora da ejaculação, a pressão pode ser tanta que o preservativo estoura. O que fazer: Segure a pontinha (reservatório) com dois dedos para tirar o ar. Mantenha os dedos ali enquanto apoia a camisinha na cabeça do pênis ereto." }, { text: "É apenas uma tradição, não faz diferença", points: -10, feedback: "Faz muita diferença! É essencial para evitar que o preservativo estoure." }, { text: "Para deixar mais confortável", points: 15, feedback: "Não é questão de conforto! É para evitar que o ar preso cause ruptura durante a ejaculação." }], character_type: "boy" },
    { text: "Tenho que desenrolar a camisinha até o final, até a base?", options: [{ text: "Sim, totalmente! Só protege se cobrir da cabeça até a base", points: 50, feedback: "Correto! Sim, totalmente! A camisinha só protege se cobrir o pênis por inteiro, da cabeça até a base. É ali, na base, que a borda forma uma 'barra' que ajuda a prender o esperma. Como fazer: Depois de apertar a ponta, use o dedo que sobrou (ou a outra mão) para desenrolar a camisinha completamente até a raiz do pênis." }, { text: "Não, só até a metade já protege", points: -15, feedback: "Errado! Deve cobrir completamente para proteger e formar a 'barra' que prende o esperma." }, { text: "Depende do tamanho do pênis", points: 10, feedback: "Independente do tamanho, deve sempre cobrir completamente da cabeça até a base." }], character_type: "boy" },
    { text: "Na hora de tirar, como garantir que não vai vazar nada?", options: [{ text: "Ser rápido: segurar a borda, retirar devagar e descartar no lixo", points: 50, feedback: "Correto! Você precisa ser rápido e cuidadoso imediatamente após a ejaculação, antes que o pênis comece a ficar mole. Passo 1: Segure a borda da camisinha na base do pênis. Passo 2: Retire o pênis devagar da vagina ou do ânus. Passo 3: Retire a camisinha e jogue no lixo. (Nunca no vaso sanitário, pois entope)." }, { text: "Posso tirar quando quiser, não tem pressa", points: -15, feedback: "Tem pressa sim! Deve ser imediatamente após a ejaculação, antes do pênis amolecer." }, { text: "Só puxar rapidamente", points: 20, feedback: "Não só puxar! Deve segurar a borda na base primeiro, depois retirar devagar para não vazar." }], character_type: "boy" },
    { text: "Posso colocar a camisinha feminina com antecedência?", options: [{ text: "Sim, horas antes! O anel maior fica fora cobrindo a entrada", points: 50, feedback: "Correto! Sim, e essa é uma das grandes vantagens! Você pode colocar o preservativo feminino horas antes da relação sexual. Isso tira a pressão do momento e garante que a prevenção já está pronta. Como saber que está pronto: O anel maior deve estar para fora da vagina (ou ânus), cobrindo a entrada, e o anel menor deve estar bem fundo, lá dentro." }, { text: "Não, só na hora da relação", points: 10, feedback: "Pode sim! Essa é uma das grandes vantagens do preservativo feminino." }, { text: "Apenas 30 minutos antes", points: 25, feedback: "Pode ser muito mais tempo! Até 8 horas antes da relação sexual." }], character_type: "girl" },
    { text: "O anel menor da camisinha feminina precisa ficar muito fundo? Como coloco?", options: [{ text: "Sim, bem fundo! Aperte como absorvente interno e empurre", points: 50, feedback: "Correto! Sim, o anel menor é quem prende a camisinha lá dentro. Você deve apertá-lo com os dedos, como se fosse um absorvente interno, e empurrá-lo o mais fundo que conseguir. Posição: Escolha a posição mais fácil: agachada, deitada ou com uma perna apoiada em algum lugar. O que é normal: É normal que o preservativo fique frouxo ou meio torcido dentro do canal. Essa folga é normal e permite que ele se ajuste." }, { text: "Não precisa ir fundo, qualquer posição serve", points: -10, feedback: "Precisa sim ir bem fundo! É o que prende a camisinha no lugar." }, { text: "Só até onde for confortável", points: 20, feedback: "Deve ir o mais fundo possível para prender bem. A folga interna é normal e necessária." }], character_type: "girl" },
    { text: "Como garantir que o pênis vai entrar dentro da camisinha feminina e não ao lado?", options: [{ text: "O anel externo funciona como 'guia', pode usar lubrificante", points: 50, feedback: "Correto! O anel externo (o anel maior) é a sua garantia. Ele fica para fora, cobrindo a entrada da vagina ou ânus. Ele funciona como um 'guia' para o pênis. Dica: Você pode usar um pouco de lubrificante (à base de água ou silicone) na parte de fora para que a penetração seja mais suave e não corra o risco do pênis escorregar para o lado." }, { text: "Não há como garantir, é questão de sorte", points: -10, feedback: "Há sim! O anel externo funciona como guia para a penetração." }, { text: "Precisa segurar com a mão durante toda a relação", points: 15, feedback: "Não precisa segurar! O anel externo funciona como guia natural, lubrificante ajuda." }], character_type: "boy" },
    { text: "O que NUNCA posso fazer com o preservativo feminino?", options: [{ text: "NUNCA usar junto com camisinha masculina - o atrito rasga ambas!", points: 50, feedback: "Correto! NUNCA use a camisinha feminina junto com a camisinha masculina! O atrito entre os dois materiais pode rasgar as duas camisinhas. Escolha um ou outro." }, { text: "Usar lubrificante junto", points: -5, feedback: "Pode usar lubrificante sim! O problema é usar junto com preservativo masculino." }, { text: "Reutilizar após lavar", points: 30, feedback: "Também não pode reutilizar, mas o erro mais perigoso é usar junto com preservativo masculino." }], character_type: "girl" },
    { text: "Como tirar a camisinha feminina sem fazer bagunça?", options: [{ text: "Torcer o anel externo para 'fechar' a bolsa, depois puxar com cuidado", points: 50, feedback: "Correto! Você deve torcer o anel externo que está para fora. Isso 'fecha' a bolsa e prende o sêmen lá dentro. Depois, é só puxar com cuidado. Descarte: Sempre jogue no lixo, embrulhado num pedacinho de papel higiênico para descartar de forma discreta." }, { text: "Só puxar pelo anel externo", points: 20, feedback: "Não só puxar! Deve torcer o anel externo primeiro para 'fechar' a bolsa." }, { text: "Deixar escorrer naturalmente", points: -15, feedback: "Não! Deve torcer o anel externo para fechar e prender o sêmen antes de retirar." }], character_type: "girl" },
    { text: "Qual é a importância da comunicação e do consentimento em todas as relações sexuais?", options: [{ text: "São a base de relações saudáveis - consentimento deve ser claro e pode ser retirado", points: 50, feedback: "Correto! A comunicação aberta e o consentimento são a base de qualquer relação sexual saudável e respeitosa. O consentimento deve ser claro, entusiástico e pode ser retirado a qualquer momento. É crucial porque o consentimento anterior não garante o atual." }, { text: "Não é necessário falar sobre isso, é natural", points: -15, feedback: "É muito necessário! Comunicação e consentimento são fundamentais para relações saudáveis." }, { text: "Só é importante na primeira vez", points: -10, feedback: "É importante sempre! Consentimento deve ser contínuo e comunicação sempre aberta." }], character_type: "boy" },
    { text: "Qual é a diferença entre libido e desejo sexual?", options: [{ text: "Libido é o 'motor' (impulso geral), desejo é a 'vontade de dirigir' (específica)", points: 50, feedback: "Correto! Libido é o termo geral para o impulso sexual ou energia sexual de uma pessoa. O desejo sexual, por outro lado, é a vontade específica de ter atividade sexual. A libido é mais como o 'motor', enquanto o desejo é a 'vontade de dirigir'." }, { text: "São a mesma coisa", points: -10, feedback: "Não! São conceitos relacionados mas distintos." }, { text: "Libido é só para homens, desejo para mulheres", points: -15, feedback: "Errado! Ambos os conceitos se aplicam a todas as pessoas, independente do gênero." }], character_type: "girl" },
    { text: "O que é 'sexting' e quais os riscos associados se não for feito com consentimento e segurança?", options: [{ text: "Envio de conteúdo sexual explícito - riscos: exposição não consensual e pornografia de vingança", points: 50, feedback: "Correto! Sexting é o ato de enviar mensagens, fotos ou vídeos de natureza sexual explícita. Os riscos incluem a exposição e a distribuição não consensual do conteúdo (pornografia de vingança), que é ilegal e pode ter graves consequências emocionais e legais." }, { text: "É apenas conversa por mensagem, sem riscos", points: -15, feedback: "Não! Sexting envolve conteúdo sexual explícito e tem riscos sérios se mal usado." }, { text: "É crime em qualquer situação", points: -10, feedback: "Não é crime quando feito entre adultos com consentimento. O crime é a distribuição não consensual." }], character_type: "boy" },
    
    // [13 perguntas da fase 4 - Perguntas de Risco (índices 42 a 54)]
    { tema: "Risco/Uso", text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: Esquecer a pílula anticoncepcional num dia, mas tomá-la no dia seguinte, anula completamente o risco de gravidez.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ❌ A eficácia da pílula depende da tomada correta e diária. Se você falhar um dia, a proteção pode ser reduzida, e métodos de proteção adicionais (como o preservativo) devem ser usados nos dias seguintes, conforme as indicações médicas. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ A eficácia da pílula depende da tomada correta e diária. Se você falhar um dia, a proteção pode ser reduzida, e métodos de proteção adicionais (como o preservativo) devem ser usados nos dias seguintes, conforme as indicações médicas. PENALIDADE: -50 pontos!" }, { text: "Depende do tipo de pílula", points: 10, feedback: "Embora diferentes pílulas tenham instruções específicas, o princípio geral é que esquecer reduz a eficácia e requer proteção adicional." }], tipo: "Risco V/F", resposta_correta_bool: "FALSO", character_type: "boy" },
    { tema: "Risco/Uso", text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: É seguro usar dois preservativos ao mesmo tempo para maior proteção.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ Usar dois preservativos aumenta o atrito entre eles, fazendo com que ambos se rasguem mais facilmente. Use sempre apenas um preservativo de cada vez. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ Usar dois preservativos aumenta o atrito entre eles, fazendo com que ambos se rasguem mais facilmente. Use sempre apenas um preservativo de cada vez. PENALIDADE: -50 pontos!" }, { text: "Depende do tipo de preservativo", points: 10, feedback: "Não depende! Qualquer combinação de dois preservativos cria atrito perigoso que pode rasgar ambos." }], tipo: "Risco V/F", resposta_correta_bool: "FALSO", character_type: "boy" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: A pílula do dia seguinte pode ser usada como método contraceptivo regular.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ A pílula do dia seguinte é apenas para emergências. Usar regularmente pode causar desequilíbrios hormonais e é menos eficaz que métodos contraceptivos regulares. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ A pílula do dia seguinte é apenas para emergências. Usar regularmente pode causar desequilíbrios hormonais e é menos eficaz que métodos contraceptivos regulares. PENALIDADE: -50 pontos!" }, { text: "Pode ser usada até 3 vezes por mês", points: 10, feedback: "Não! É apenas para emergências pontuais, não para uso regular ou frequente." }], character_type: "girl" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: É possível engravidar mesmo usando preservativo corretamente.", options: [{ text: "VERDADEIRO", points: 75, feedback: "CORRETO! ✅ Nenhum método contraceptivo é 100% eficaz. O preservativo tem cerca de 98% de eficácia quando usado corretamente, mas ainda existe uma pequena possibilidade de falha. BÔNUS: +75 pontos!" }, { text: "FALSO", points: -50, feedback: "VERDADEIRO! ❌ Nenhum método contraceptivo é 100% eficaz. O preservativo tem cerca de 98% de eficácia quando usado corretamente, mas ainda existe uma pequena possibilidade de falha. PENALIDADE: -50 pontos!" }, { text: "Só se usar incorretamente", points: 10, feedback: "Mesmo com uso correto há uma pequena chance de falha. Nenhum método é 100% eficaz." }], character_type: "girl" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: Toda IST apresenta sintomas visíveis.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ Muita IST (como Clamídia, HPV e HIV) pode ser assintomática por longos períodos. Por isso é importante fazer testes regulares e usar sempre preservativo. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ Muita IST (como Clamídia, HPV e HIV) pode ser assintomática por longos períodos. Por isso é importante fazer testes regulares e usar sempre preservativo. PENALIDADE: -50 pontos!" }, { text: "Apenas algumas são assintomáticas", points: 10, feedback: "Na verdade, muitas ISTs importantes podem ser assintomáticas por longos períodos." }], character_type: "girl" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: O preservativo protege contra toda IST.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ O preservativo protege contra a maioria das IST, mas algumas como HPV e Herpes podem ser transmitidas pelo contato com áreas da pele não cobertas pelo preservativo. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ O preservativo protege contra a maioria das IST, mas algumas como HPV e Herpes podem ser transmitidas pelo contato com áreas da pele não cobertas pelo preservativo. PENALIDADE: -50 pontos!" }, { text: "Protege contra 90% das ISTs", points: 10, feedback: "Protege contra a maioria, mas HPV e Herpes podem ser transmitidas por áreas não cobertas." }], character_type: "boy" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: Lubrificantes à base de óleo são seguros para usar com preservativos de látex.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ Lubrificantes à base de óleo (como vaselina ou óleos de massagem) podem danificar o látex do preservativo, tornando-o menos eficaz e mais propenso a rasgar. Use sempre lubrificantes à base de água ou silicone com preservativos de látex. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ Lubrificantes à base de óleo (como vaselina ou óleos de massagem) podem danificar o látex do preservativo, tornando-o menos eficaz e mais propenso a rasgar. Use sempre lubrificantes à base de água ou silicone com preservativos de látex. PENALIDADE: -50 pontos!" }, { text: "Depende do tipo de óleo", points: 10, feedback: "Qualquer lubrificante à base de óleo pode danificar o látex. Use sempre à base de água ou silicone." }], character_type: "boy" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: É possível engravidar tendo relação sexual durante a menstruação.", options: [{ text: "VERDADEIRO", points: 75, feedback: "CORRETO! ✅ Embora a probabilidade seja menor, espermatozoides podem sobreviver por vários dias no corpo feminino, e a ovulação pode ocorrer mais cedo em alguns ciclos, levando à gravidez. Sempre use proteção se não deseja engravidar. BÔNUS: +75 pontos!" }, { text: "FALSO", points: -50, feedback: "VERDADEIRO! ❌ Embora a probabilidade seja menor, espermatozoides podem sobreviver por vários dias no corpo feminino, e a ovulação pode ocorrer mais cedo em alguns ciclos, levando à gravidez. Sempre use proteção se não deseja engravidar. PENALIDADE: -50 pontos!" }, { text: "Só com ciclos irregulares", points: 10, feedback: "Pode acontecer mesmo com ciclos regulares, pois espermatozoides sobrevivem vários dias." }], character_type: "girl" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: IST é um problema de saúde apenas para pessoas sexualmente ativas com múltiplos parceiros.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ Qualquer pessoa sexualmente ativa pode contrair uma IST, independentemente do número de parceiros. O risco está na prática sexual desprotegida. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ Qualquer pessoa sexualmente ativa pode contrair uma IST, independentemente do número de parceiros. O risco está na prática sexual desprotegida. PENALIDADE: -50 pontos!" }, { text: "Depende do tipo de IST", points: 10, feedback: "Qualquer IST pode afetar qualquer pessoa sexualmente ativa, independente do número de parceiros." }], character_type: "boy" },
    { text: "PERGUNTA DE RISCO - Verdadeiro ou Falso: O sexo anal é uma prática de baixo risco para a transmissão de IST em comparação com o sexo vaginal.", options: [{ text: "FALSO", points: 75, feedback: "CORRETO! ✅ O sexo anal é, na verdade, uma prática de alto risco para a transmissão de IST (incluindo o HIV) devido à maior fragilidade do tecido anal, que pode sofrer microlesões mais facilmente. O uso correto do preservativo e lubrificante é essencial. BÔNUS: +75 pontos!" }, { text: "VERDADEIRO", points: -50, feedback: "FALSO! ❌ O sexo anal é, na verdade, uma prática de alto risco para a transmissão de IST (incluindo o HIV) devido à maior fragilidade do tecido anal, que pode sofrer microlesões mais facilmente. O uso correto do preservativo e lubrificante é essencial. PENALIDADE: -50 pontos!" }, { text: "Tem o mesmo risco que sexo vaginal", points: 10, feedback: "Na verdade tem risco maior devido à fragilidade do tecido anal e maior chance de microlesões." }], character_type: "boy" }
];

// Initialize game
function initGame() {
    updateDisplay();
    updatePhaseDisplay();
    document.getElementById('start-button').addEventListener('click', startGame);

    // Inicia o vídeo (autoplay/loop/muted)
    const videoEl = document.getElementById('intro-video');
    videoEl.muted = true;
    videoEl.play().catch(e => console.log("Erro ao iniciar vídeo:", e));
    
    // Inicia a música de fundo (volume baixo, loop, mutada por padrão)
    bgm.volume = 0.2;
    bgm.loop = true;
    bgm.muted = isMuted;
    bgm.play().catch(e => console.log("Erro ao iniciar BGM:", e));
    
    // Adiciona listener para desmutar o vídeo ao clicar (primeira interação)
    videoEl.addEventListener('click', () => {
        if (videoEl.muted) {
            videoEl.muted = false;
            toggleMute(); // Desmuta o jogo inteiro
        }
    });
    
    window.dispatchEvent(new Event('resize'));
}

function startGame() {
    // Tenta garantir que o BGM inicie (será desmutado apenas no toggleMute, mas tenta iniciar a reprodução)
    if (bgm.paused) {
        bgm.play().catch(e => console.log("Erro ao iniciar BGM após clique:", e));
    }
    
    // Pausa o vídeo ao sair da splash screen
    document.getElementById('intro-video').pause();

    const splashScreen = document.getElementById('splash-screen');
    splashScreen.style.opacity = '0';
    setTimeout(() => {
        splashScreen.style.display = 'none';
    }, 500);
}

function updateDisplay() {
    document.getElementById('knowledge').textContent = gameStats.knowledge;
    document.getElementById('medals').textContent = gameStats.medals;
    document.getElementById('joy-coins').textContent = gameStats.joyCoins;
    document.getElementById('bombs').textContent = gameStats.bombs;
}

function updatePhaseDisplay() {
    const currentPhaseData = phases[gameStats.currentPhase];
    const phaseStats = document.getElementById('phase-stats');
    const phaseTitle = document.getElementById('phase-title');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    phaseTitle.textContent = `Fase ${gameStats.currentPhase}: ${currentPhaseData.name}`;
    phaseStats.style.background = currentPhaseData.color;
    
    const progress = (gameStats.phaseProgress / gameStats.questionsPerPhase) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${gameStats.phaseProgress}/${gameStats.questionsPerPhase} perguntas`;
    
    const characterContainer = document.getElementById('character-container');
    const gameBoard = document.getElementById('game-board');
    
    if (currentPhaseData.type === 'board') {
        characterContainer.style.display = 'none';
        gameBoard.classList.add('active');
        resetBoardForNewPhase();
        initializeBoard();
    } else {
        characterContainer.style.display = 'block';
        gameBoard.classList.remove('active');
        
        // Define a imagem padrão do personagem para as fases de interação
        const character = document.getElementById('boy-character');
        character.style.background = `url(${characterImages.girl_d}) center/contain no-repeat`;
        character.classList.add('has-image');
        character.innerHTML = ''; 

        const thoughtBubble = document.getElementById('thought-bubble');
        thoughtBubble.textContent = gameStats.phaseProgress === 0 
            ? `Clique para começar a ${currentPhaseData.name}!` 
            : `${gameStats.questionsPerPhase - gameStats.phaseProgress} perguntas restantes!`;
    }
}

function updateCharacterForQuestion(scenario) {
    const character = document.getElementById('boy-character');
    const type = scenario.character_type || 'girl';
    const imageFile = type === 'boy' ? characterImages.boy_q : characterImages.girl_q;
    character.style.background = `url(${imageFile}) center/contain no-repeat`;
    character.classList.add('has-image');
    character.innerHTML = '';
}

function updateCharacterForAnswer(scenario, isCorrect) {
    const character = document.getElementById('boy-character');
    const type = scenario.character_type || 'girl';
    let imageFile = '';
    
    if (isCorrect) {
        imageFile = type === 'boy' ? characterImages.boy_a : characterImages.girl_a;
        playAudio(sfxCoin, 1.0); // Play coin sound on correct answer
    } else {
        imageFile = type === 'boy' ? characterImages.boy_e : characterImages.girl_e;
        playAudio(sfxError, 1.0); // Play error sound on incorrect answer
    }
    
    character.style.background = `url(${imageFile}) center/contain no-repeat`;
    character.classList.add('has-image');
    character.innerHTML = '';
    
    setTimeout(() => {
        if (phases[gameStats.currentPhase].type === 'character') {
            // Retorna à imagem padrão da garota/dica
            character.style.background = `url(${characterImages.girl_d}) center/contain no-repeat`;
        } else {
            // Volta a ser transparente se for a tela do tabuleiro (Board Mode)
            character.style.background = 'transparent'; 
            character.classList.remove('has-image');
        }
    }, 3000);
}

// Lógica do Tabuleiro (Game Board)

function resetBoardForNewPhase() {
    boardState.currentPosition = 0;
    boardState.totalMoves = 0;
    boardState.boardSquares = [];
    boardState.isRolling = false;
    boardState.questionsAnswered = 0;
    boardState.lastDiceRoll = 0;
    
    const boardPath = document.getElementById('board-path');
    if (boardPath) {
        boardPath.innerHTML = '';
    }
}

function initializeBoard() {
     const currentPhaseData = phases[gameStats.currentPhase];
    
    document.getElementById('board-phase-title').textContent = currentPhaseData.name;
    document.getElementById('board-position').textContent = `🎯 Casa: ${boardState.currentPosition + 1}/20`;
    document.getElementById('board-moves').textContent = `🎲 Jogadas: ${boardState.totalMoves}`;
    document.getElementById('board-questions').textContent = `❓ Perguntas: ${gameStats.phaseProgress}/${gameStats.questionsPerPhase}`;
    
    if (boardState.boardSquares.length === 0) {
        generateBoardPath();
    }
    
    updatePlayerPosition();
    
    const currentSquare = boardState.boardSquares[boardState.currentPosition];
    document.getElementById('advance-btn').disabled = false;
    document.getElementById('test-question-btn').disabled = !(currentSquare && (currentSquare.type === 'question' || currentSquare.type === 'challenge'));
}

function generateBoardPath() {
    const boardPath = document.getElementById('board-path');
    boardPath.innerHTML = '';
    boardState.boardSquares = [];
    
    const totalSquares = 20;
    const squareTypes = ['start', 'question', 'question', 'bonus', 'question', 'question', 'challenge', 'question', 'question', 'question', 'bonus', 'question', 'question', 'challenge', 'question', 'question', 'question', 'bonus', 'question', 'finish'];
    const squareIcons = ['🏁', '❓', '❓', '💎', '❓', '❓', '⚡', '❓', '❓', '❓', '💎', '❓', '❓', '⚡', '❓', '❓', '❓', '💎', '❓', '🏆'];
    const squareTexts = ['INÍCIO', 'Pergunta', 'Pergunta', 'Bônus', 'Pergunta', 'Pergunta', 'Desafio', 'Pergunta', 'Pergunta', 'Pergunta', 'Bônus', 'Pergunta', 'Pergunta', 'Desafio', 'Pergunta', 'Pergunta', 'Pergunta', 'Bônus', 'Pergunta', 'FIM'];
    
    const gameBoard = document.getElementById('game-board');
    const boardRect = gameBoard.getBoundingClientRect();
    const boardSize = Math.min(boardRect.width, boardRect.height);
    
    const centerX = boardSize / 2;
    const centerY = boardSize / 2;
    const maxRadius = (boardSize * 0.35); 
    const squareSize = Math.max(50, Math.min(70, boardSize * 0.1)); 
    
    for (let i = 0; i < totalSquares; i++) {
        const square = document.createElement('div');
        square.className = `board-square ${squareTypes[i]}`;
        
        const progress = i / (totalSquares - 1); 
        const angle = progress * Math.PI * 6; 
        const radius = maxRadius * (1 - progress * 0.8); 
        
        const x = centerX + Math.cos(angle) * radius - (squareSize / 2);
        const y = centerY + Math.sin(angle) * radius - (squareSize / 2);
        
        square.style.width = squareSize + 'px';
        square.style.height = squareSize + 'px';
        square.style.left = x + 'px';
        square.style.top = y + 'px';
        
        const iconSize = Math.max(0.8, squareSize / 60);
        const textSize = Math.max(0.4, squareSize / 140);
        const numberSize = Math.max(0.5, squareSize / 120);
        
        square.innerHTML = `
            <div style="position: absolute; top: -6px; right: -6px; font-size: ${numberSize}em; font-weight: bold; background: rgba(255,255,255,0.9); color: #333; padding: 2px 6px; border-radius: 50%; min-width: ${Math.max(16, squareSize * 0.25)}px; height: ${Math.max(16, squareSize * 0.25)}px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${i + 1}</div>
            <div style="font-size: ${iconSize}em; margin-bottom: 2px;">${squareIcons[i]}</div>
            <div style="font-size: ${textSize}em; text-align: center; line-height: 1; font-weight: bold;">${squareTexts[i]}</div>
        `;
        square.dataset.index = i;
        square.onclick = () => handleSquareClick(i);
        
        boardPath.appendChild(square);
        boardState.boardSquares.push({
            element: square,
            type: squareTypes[i],
            visited: false,
            position: i,
            x: x + (squareSize / 2),
            y: y + (squareSize / 2)
        });
    }
}

function updatePlayerPosition() {
    const playerPiece = document.getElementById('player-piece');
    const currentSquare = boardState.boardSquares[boardState.currentPosition];
    
    if (currentSquare) {
        playerPiece.style.left = (currentSquare.x - (playerPiece.offsetWidth / 2)) + 'px';
        playerPiece.style.top = (currentSquare.y - (playerPiece.offsetHeight / 2)) + 'px';
        
        boardState.boardSquares.forEach((square, index) => {
            square.element.classList.remove('current', 'visited', 'future');
            
            if (index === boardState.currentPosition) {
                square.element.classList.add('current');
                square.element.style.opacity = '1';
                square.element.style.transform = 'scale(1.1)';
                square.element.style.pointerEvents = 'auto';
                square.visited = true;
            } else if (index < boardState.currentPosition) {
                square.element.style.opacity = '0';
                square.element.style.transform = 'scale(0.3) rotate(180deg)';
                square.element.style.pointerEvents = 'none';
                square.element.classList.add('visited');
                square.visited = true;
            } else {
                square.element.classList.add('future');
                square.element.style.opacity = '0.3';
                square.element.style.transform = 'scale(0.9)';
                square.element.style.pointerEvents = 'none';
            }
        });
    }
}

function advanceSquare() {
    const advanceBtn = document.getElementById('advance-btn');
    advanceBtn.disabled = true;
    
    const maxPosition = boardState.boardSquares.length - 1;
    
    if (boardState.currentPosition < maxPosition) {
        const newPosition = boardState.currentPosition + 1;
        
        const moveInterval = setInterval(() => {
            if (boardState.currentPosition < newPosition) {
                boardState.currentPosition++;
                updatePlayerPosition();
                playAudio(sfxMove, 0.3); // Uso de playAudio
                
                document.getElementById('board-position').textContent = `🎯 Casa: ${boardState.currentPosition + 1}/20`;
                document.getElementById('board-moves').textContent = `🎲 Jogadas: ${++boardState.totalMoves}`;

            } else {
                clearInterval(moveInterval);
                
                const currentSquare = boardState.boardSquares[boardState.currentPosition];
                handleSquareLanding(currentSquare);
                
                advanceBtn.disabled = false;
            }
        }, 500);
    } else {
        showMessage('🏆 Você já está na casa final!', 'success');
        completePhase();
        advanceBtn.disabled = false;
    }
}

function handleSquareClick(index) {
    if (index === boardState.currentPosition) {
        const square = boardState.boardSquares[index];
        if (square.type === 'question' || square.type === 'challenge') {
            triggerBoardQuestion();
        } else {
            handleSquareLanding(square);
        }
    } else if (index < boardState.currentPosition) {
        showMessage('⚠️ Você não pode voltar para casas anteriores!', 'warning');
    } else {
        showMessage('⚠️ Use o botão "Avançar 1 Casa" para mover no tabuleiro!', 'info');
    }
}

function triggerBoardQuestion() {
    document.getElementById('test-question-btn').disabled = true;
    
    const currentPhaseData = phases[gameStats.currentPhase];
    const phaseStartIndex = gameStats.currentPhase === 1 ? phases[1].startIndex : phases[3].startIndex;
    const phaseEndIndex = gameStats.currentPhase === 1 ? phases[1].endIndex : phases[3].endIndex;
    
    const availableQuestions = scenarios.slice(phaseStartIndex, phaseEndIndex);
    
    const unusedQuestions = availableQuestions.filter((_, index) => 
        !usedQuestions.includes(phaseStartIndex + index)
    );
    
    if (unusedQuestions.length === 0) {
        showMessage('Todas as perguntas desta fase foram respondidas!', 'info');
        return;
    }
    
    const randomQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
    const questionIndex = scenarios.indexOf(randomQuestion);
    usedQuestions.push(questionIndex);
    
    currentScenario = randomQuestion;
    showScenarioModal(currentScenario);
}

// Lógica para as fases de interação direta (Fases 2 e 4)
function triggerRandomScenario() {
    event.preventDefault();
    
    const currentPhaseData = phases[gameStats.currentPhase];
    const phaseStartIndex = gameStats.currentPhase === 2 ? phases[2].startIndex : phases[4].startIndex;
    const phaseEndIndex = gameStats.currentPhase === 2 ? phases[2].endIndex : phases[4].endIndex;
    
    const availableQuestions = scenarios.slice(phaseStartIndex, phaseEndIndex);
    
    const unusedQuestions = availableQuestions.filter((_, index) => 
        !usedQuestions.includes(phaseStartIndex + index)
    );
    
    if (unusedQuestions.length === 0) {
        showMessage('Todas as perguntas desta fase foram respondidas!', 'info');
        return;
    }
    
    const randomQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
    const questionIndex = scenarios.indexOf(randomQuestion);
    usedQuestions.push(questionIndex);
    
    currentScenario = randomQuestion;
    showScenarioModal(currentScenario);
}

function handleBonusSquare() {
    const bonusPoints = 25;
    gameStats.knowledge += bonusPoints;
    gameStats.joyCoins += 3;
    
    playAudio(sfxCoin, 1.0);
    createJoyCoin();
    showMessage(`💎 Casa Bônus! +${bonusPoints} Conhecimento e +3 Moedas da Alegria!`, 'success');
    updateDisplay();
}

function handleChallengeSquare() {
    showMessage('⚡ Casa Desafio! Próxima pergunta vale pontos duplos!', 'warning');
    gameStats.doublePoints = true;
}

function handleFinishSquare() {
    showMessage('🏆 Parabéns! Você chegou ao fim do tabuleiro!', 'success');
    completePhase();
}

function showBoardHelp() {
    showMessage('🎯 Avance casa por casa. Clique em "Testar Pergunta" nas casas ❓ ou ⚡. 💎 Casas bônus dão pontos extras. ⚡ Casas desafio dobram os pontos da próxima pergunta.', 'info');
}

function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message show ${type}`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 4000);
}

function doJob(jobType, points, duration, icon) {
    const jobElement = event.currentTarget;
    const originalContent = jobElement.innerHTML;
    
    jobElement.innerHTML = `
        <div class="job-icon">⏳</div>
        <div class="job-info">
            <div class="job-name">Estudando...</div>
            <div class="job-reward">Aguarde ${duration/1000}s</div>
        </div>
    `;
    jobElement.style.pointerEvents = 'none';
    
    setTimeout(() => {
        gameStats.knowledge += points;
        if (gameStats.knowledge >= 100) {
            gameStats.medals++;
            gameStats.knowledge = 50; 
            showMessage(`🏅 Parabéns! Você ganhou uma medalha! Total: ${gameStats.medals}`, 'success');
        } else {
            showMessage(`${icon} +${points} Conhecimento!`, 'success');
        }
        
        updateDisplay();
        jobElement.innerHTML = originalContent;
        jobElement.style.pointerEvents = 'auto';
    }, duration);
}

function showScenarioModal(scenario) {
    const modal = document.getElementById('question-modal');
    const scenarioText = document.getElementById('modal-scenario-text');
    const optionsContainer = document.getElementById('modal-options-container');
    
    updateCharacterForQuestion(scenario);
    
    scenarioText.textContent = scenario.text;
    optionsContainer.innerHTML = '';
    
    scenario.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'modal-option';
        button.textContent = option.text;
        button.onclick = () => selectOption(option, scenario);
        optionsContainer.appendChild(button);
    });
    
    modal.style.display = 'flex';
}

function selectOption(option, scenario) {
    const isCorrect = option.points > 0;
    let finalPoints = option.points;
    
    if (gameStats.doublePoints && isCorrect) {
        finalPoints *= 2;
        gameStats.doublePoints = false; 
        showMessage('⚡ Pontos duplos aplicados!', 'success');
    }
    
    updateCharacterForAnswer(scenario, isCorrect);
    
    gameStats.knowledge += finalPoints;
    if (gameStats.knowledge < 0) gameStats.knowledge = 0;
    
    if (finalPoints > 0) {
        const coinsEarned = Math.floor(finalPoints / 10) + 1;
        gameStats.joyCoins += coinsEarned;
        createJoyCoin();
        showMessage(`🪙 +${coinsEarned} Moedas da Alegria! ${option.feedback}`, 'success');
    } else {
        gameStats.bombs++;
        createBombExplosion();
        showMessage(`💣 BOOM! Bomba coletada! ${option.feedback}`, 'warning');
    }
    
    gameStats.phaseProgress++;
    
    const currentPhaseData = phases[gameStats.currentPhase];
    if (currentPhaseData.type === 'board') {
        document.getElementById('board-questions').textContent = `❓ Perguntas: ${gameStats.phaseProgress}/${gameStats.questionsPerPhase}`;
    }
    
    // Check for phase completion only if it's not a board game, or if it is AND we reached the finish line
    if (gameStats.phaseProgress >= gameStats.questionsPerPhase && currentPhaseData.type !== 'board') {
        completePhase();
    } else if (currentPhaseData.type === 'board' && boardState.currentPosition === boardState.boardSquares.length - 1) {
         completePhase();
    } else {
        if (gameStats.knowledge >= 100) {
            gameStats.medals++;
            gameStats.knowledge = 50;
            showMessage(`🏅 Medalha conquistada! Conhecimento resetado para continuar!`, 'success');
        }
    }
    
    updateDisplay();
    updatePhaseDisplay();
    closeModal();
    
    if (currentPhaseData.type === 'board') {
        document.getElementById('test-question-btn').disabled = false;
        document.getElementById('advance-btn').disabled = false;
    }
}

function completePhase() {
    playAudio(sfxWin, 1.0);
    
    const currentPhaseData = phases[gameStats.currentPhase];
    gameStats.completedPhases.push(gameStats.currentPhase);
    
    const rewardElement = document.getElementById(`reward-${gameStats.currentPhase}`);
    rewardElement.classList.add('completed');
    
    showPhaseCompleteModal(currentPhaseData);
}

function showPhaseCompleteModal(phaseData) {
    const modal = document.getElementById('phase-complete-modal');
    const title = document.getElementById('phase-complete-title');
    const description = document.getElementById('phase-complete-description');
    
    title.textContent = `🎉 ${phaseData.name} Concluída!`;
    description.textContent = `Parabéns! Você conquistou o título de ${phaseData.reward}!`;
    
    modal.style.display = 'flex';
    
    createConfetti();
}

function continueToNextPhase() {
    const modal = document.getElementById('phase-complete-modal');
    modal.style.display = 'none';
    
    if (gameStats.currentPhase < 4) {
        gameStats.currentPhase++;
        gameStats.phaseProgress = 0;
        usedQuestions = []; 
        updatePhaseDisplay();
        showMessage(`🚀 Bem-vindo à ${phases[gameStats.currentPhase].name}!`, 'success');
    } else {
        showFinalCelebration();
    }
}

function showFinalCelebration() {
    for (let i = 0; i < 100; i++) {
        setTimeout(() => createConfetti(), i * 50);
    }
    
    showMessage('🎯🏆 PARABÉNS! Você é oficialmente um ESPECIALISTA EM SEXUALIDADE! Todas as 4 fases concluídas com sucesso! 🏆🎯', 'success');
    
    playAudio(sfxWin, 1.0);
    
    const character = document.getElementById('boy-character');
    character.textContent = '🏆';
    character.style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
    character.style.backgroundImage = "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face')";
    character.style.backgroundBlendMode = 'overlay';
    
    const thoughtBubble = document.getElementById('thought-bubble');
    thoughtBubble.textContent = 'ESPECIALISTA COMPLETO!';
}

function createJoyCoin() {
    const coin = document.createElement('div');
    coin.className = 'joy-coin';
    coin.textContent = '🪙';
    
    const rect = document.getElementById('main-content').getBoundingClientRect();
    coin.style.left = (rect.left + rect.width / 2) + 'px';
    coin.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(coin);
    
    setTimeout(() => {
        coin.remove();
    }, 2000);
}

function createBombExplosion() {
    const character = document.getElementById('boy-character');
    const rect = character.getBoundingClientRect();
    
    const bomb = document.createElement('div');
    bomb.className = 'bomb-explosion';
    bomb.textContent = '💥';
    bomb.style.left = (rect.left + rect.width / 2) + 'px';
    bomb.style.top = (rect.top + rect.height / 2) + 'px';
    
    document.body.appendChild(bomb);
    
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.animation = 'smoothPulse 0.8s ease-in-out';
    
    setTimeout(() => {
        bomb.remove();
        gameContainer.style.animation = '';
    }, 1500);
}

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const symbols = ['🎉', '🎊', '⭐', '🌟', '💫', '✨', '🏆', '🎯'];
    
    for (let i = 0; i < 15; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
        confetti.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        confetti.style.fontSize = (Math.random() * 20 + 15) + 'px';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

function closeModal() {
    document.getElementById('question-modal').style.display = 'none';
}

// Inicializa o jogo quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initGame);