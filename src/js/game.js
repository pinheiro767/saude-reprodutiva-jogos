// ==============================================
// CONFIGURAÇÃO DE ESTADO E MAPEAMENTO DE ASSETS
// ==============================================

// Mapeamento das imagens personalizadas (com caminhos atualizados para assets/img/)
const CHARACTER_IMAGES = {
    'girl_default': 'assets/img/3.jpg',
    'girl_question': 'assets/img/2.jpg',
    'girl_win': 'assets/img/5.jpg',
    'girl_lose': 'assets/img/6.jpg',
    'boy_default': 'assets/img/4.jpg', 
    'boy_question': 'assets/img/7.jpg',
    'boy_win': 'assets/img/4.jpg',
    'boy_lose': 'assets/img/7.jpg'
};

// Estado do jogo
let gameState = {
    currentPlayer: 1,
    players: {
        1: { position: 1, coins: 0, bombs: 0 },
        2: { position: 1, coins: 0, bombs: 0 }
    },
    gameEnded: false
};
let currentQuestion = null;
let currentQuestionType = null;
let isMuted = true; // Inicia mutado para compliance com autoplay

// Referências de Áudio
const bgm = document.getElementById('bgm');
const sfxCoin = document.getElementById('sfxCoin');
const sfxError = document.getElementById('sfxError');
const sfxWin = document.getElementById('sfxWin');

// ==============================================
// FUNÇÕES DE ÁUDIO E VISUALIZAÇÃO
// ==============================================

function playAudio(audioElement, volume = 1.0) {
    if (isMuted) return;
    audioElement.currentTime = 0;
    audioElement.volume = volume;
    audioElement.play().catch(e => console.log("Erro ao tocar áudio:", e));
}

function toggleMute() { 
    isMuted = !isMuted; 
    document.getElementById('muteButton').textContent = isMuted ? '🔇' : '🔊';
    bgm.muted = isMuted; 
    sfxCoin.muted = isMuted; 
    sfxError.muted = isMuted; 
    sfxWin.muted = isMuted;
    if (!isMuted && bgm.paused) { 
        bgm.play().catch(e => console.log("Erro ao iniciar BGM:", e)); 
    }
}

// Configura o visual do avatar baseado no estado
function setAvatarImage(avatarElement, type, state) {
    const isGirl = type === 'girl';
    let imageKey = `${isGirl ? 'girl' : 'boy'}_${state}`;
    
    if (state === 'default') {
         imageKey = isGirl ? 'girl_default' : 'boy_default';
    } else if (state === 'question') {
         imageKey = isGirl ? 'girl_question' : 'boy_question';
    } else if (state === 'win') {
         imageKey = isGirl ? 'girl_win' : 'boy_win';
    } else if (state === 'lose') {
         imageKey = isGirl ? 'girl_lose' : 'boy_lose';
    }

    avatarElement.style.backgroundImage = `url(${CHARACTER_IMAGES[imageKey]})`;
}

// Mostrar card do personagem
function showCharacterCard(position, isQuestion = true) {
    const square = document.getElementById(`square-${position}`);
    const characterCard = square.querySelector('.character-card');
    
    if (characterCard) {
        characterCard.classList.add('show');
        const avatar = characterCard.querySelector('.character-avatar');
        const isGirl = position % 2 === 0;

        setAvatarImage(avatar, isGirl ? 'girl' : 'boy', isQuestion ? 'question' : 'default');
    }
}

// Atualizar reação do personagem
function updateCharacterReaction(position, isCorrect) {
    const square = document.getElementById(`square-${position}`);
    const characterCard = square.querySelector('.character-card');
    if (characterCard) {
        const avatar = characterCard.querySelector('.character-avatar');
        const message = characterCard.querySelector('.character-message');
        const isGirl = position % 2 === 0;
        const type = isGirl ? 'girl' : 'boy';

        characterCard.classList.remove('happy', 'sad');
        avatar.classList.remove('happy', 'sad');
        message.classList.remove('happy', 'sad');
        
        if (isCorrect) {
            characterCard.classList.add('happy');
            avatar.classList.add('happy');
            message.classList.add('happy');
            message.textContent = 'Parabéns! 😊';
            setAvatarImage(avatar, type, 'win');
        } else {
            characterCard.classList.add('sad');
            avatar.classList.add('sad');
            message.classList.add('sad');
            message.textContent = 'Que pena! 😔';
            setAvatarImage(avatar, type, 'lose');
        }
        
        characterCard.classList.add('show');
        
        // Resetar para estado neutro após 3 segundos
        setTimeout(() => {
            characterCard.classList.remove('happy', 'sad');
            avatar.classList.remove('happy', 'sad');
            message.classList.remove('happy', 'sad');
            message.textContent = 'Boa sorte!';
            setAvatarImage(avatar, type, 'default');
        }, 3000);
    }
}

function updatePlayerDisplay() {
    const player1 = gameState.players[1];
    const player2 = gameState.players[2];
    document.getElementById('player1Position').textContent = player1.position;
    document.getElementById('player1Coins').textContent = player1.coins;
    document.getElementById('player1Bombs').textContent = player1.bombs;
    document.getElementById('player2Position').textContent = player2.position;
    document.getElementById('player2Coins').textContent = player2.coins;
    document.getElementById('player2Bombs').textContent = player2.bombs;

    const player1Card = document.getElementById('player1Card');
    const player2Card = document.getElementById('player2Card');
    const turnIndicator = document.getElementById('turnIndicator');

    if (gameState.currentPlayer === 1) {
        player1Card.classList.add('active');
        player2Card.classList.remove('active');
        turnIndicator.textContent = `Vez do Jogador 1`;
    } else {
        player1Card.classList.remove('active');
        player2Card.classList.add('active');
        turnIndicator.textContent = `Vez do Jogador 2`;
    }
}

// ==============================================
// LÓGICA DO TABULEIRO E JOGO
// ==============================================

function initializeBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';

    const radius = 250; 
    const centerX = 300; 
    const centerY = 300; 

    for (let i = 1; i <= 40; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.id = `square-${i}`;
        
        // Calcular posição em círculo
        const angle = ((i - 1) / 40) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        square.style.left = `${x - 40}px`; 
        square.style.top = `${y - 50}px`; 
        square.style.animationDelay = `${i * 0.1}s`; 
        
        let isGirl = i % 2 === 0;
        let charIcon = isGirl ? '👧' : '👦';

        if (i === 1) {
            square.classList.add('start');
            charIcon = '🚀';
        } else if (i === 40) {
            square.classList.add('finish');
            charIcon = '🏆';
        } else if (i % 5 === 0 || i % 7 === 0) {
            square.classList.add('vf'); // Casa de Verdadeiro/Falso Especial (Risco)
        } else {
            square.classList.add('normal'); // Casa de Verdadeiro/Falso Normal (Informativa)
        }

        const character = document.createElement('div');
        character.className = 'square-character';
        character.textContent = charIcon;
        const label = document.createElement('div');
        label.className = 'square-number';
        label.textContent = (i === 1) ? 'INÍCIO' : (i === 40) ? 'FIM' : (square.classList.contains('vf') ? 'V/F' : i);
        square.appendChild(character);
        square.appendChild(label);

        // Adicionar card de reação para casas com perguntas
        if (i !== 1 && i !== 40) {
            const characterCard = document.createElement('div');
            characterCard.className = 'character-card';
            characterCard.id = `character-${i}`;
            
            const avatar = document.createElement('div');
            avatar.className = 'character-avatar';
            
            // Inicializa a imagem default no avatar
            setAvatarImage(avatar, isGirl ? 'girl' : 'boy', 'default');
            
            const message = document.createElement('div');
            message.className = 'character-message';
            message.textContent = 'Boa sorte!';
            
            characterCard.appendChild(avatar);
            characterCard.appendChild(message);
            square.appendChild(characterCard);
            // Mostra o card neutro
            showCharacterCard(i, false); 
        }

        // Adicionar jogadores nas posições iniciais
        if (i === 1) {
            const player1 = document.createElement('div');
            player1.className = 'player player1';
            player1.textContent = '1';
            square.appendChild(player1);

            const player2 = document.createElement('div');
            player2.className = 'player player2';
            player2.textContent = '2';
            player2.style.right = '-30px'; // Desloca para não ficar em cima do Jogador 1
            square.appendChild(player2);
        }

        board.appendChild(square);
    }
}

// Girar a roleta
function spinRoulette() {
    if (gameState.gameEnded) return;
    
    const roulette = document.getElementById('roulette');
    const result = document.getElementById('rouletteResult');
    
    roulette.classList.add('spinning');
    playAudio(sfxCoin, 0.8);
    
    setTimeout(() => {
        const roll = Math.floor(Math.random() * 6) + 1;
        result.textContent = roll;
        roulette.classList.remove('spinning');
        
        movePlayer(roll);
    }, 2000);
}

// Mover o jogador
function movePlayer(steps) {
    const player = gameState.players[gameState.currentPlayer];
    const oldPosition = player.position;
    
    // Remover jogador da posição atual
    const currentSquare = document.getElementById(`square-${oldPosition}`);
    const playerElement = currentSquare.querySelector(`.player.player${gameState.currentPlayer}`);
    if (playerElement) {
        playerElement.remove();
    }

    // Calcular nova posição
    player.position = Math.min(player.position + steps, 40);
    
    // Adicionar jogador na nova posição
    const newSquare = document.getElementById(`square-${player.position}`);
    const newPlayer = document.createElement('div');
    newPlayer.className = `player player${gameState.currentPlayer}`;
    newPlayer.textContent = gameState.currentPlayer;
    newPlayer.style.transform = 'scale(0)';
    
    // Ajuste de posição para múltiplos jogadores na mesma casa
    if (gameState.currentPlayer === 2) {
        newPlayer.style.right = '-30px';
    } else {
        newPlayer.style.right = '-10px';
    }
    
    newSquare.appendChild(newPlayer);
    
    // Animar entrada do jogador
    setTimeout(() => {
        newPlayer.style.transform = 'scale(1)';
        newPlayer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }, 100);

    // Atualizar informações do jogador
    updatePlayerDisplay();

    // Verificar se chegou ao fim
    if (player.position === 40) {
        gameState.gameEnded = true;
        const playerName = gameState.currentPlayer === 1 ? 
            (document.getElementById('player1Name').textContent || 'Jogador 1') :
            (document.getElementById('player2Name').textContent || 'Jogador 2');
        
        setTimeout(() => {
            showWinner(playerName);
            playAudio(sfxWin, 1.0); // Som de vitória
        }, 500);
        return;
    }

    // Mostrar pergunta baseada no tipo de casa
    setTimeout(() => {
        const square = document.getElementById(`square-${player.position}`);
        if (square.classList.contains('vf')) {
            showCharacterCard(player.position, true); // Mostra personagem perguntando
            showVFQuestion();
        } else if (square.classList.contains('normal')) {
            showCharacterCard(player.position, true); // Mostra personagem perguntando
            showInformativeQuestion();
        }
    }, 500);
}

// Alternar jogador
function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updatePlayerDisplay();
}

// Mostrar vencedor
function showWinner(playerName) {
    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'winner-announcement';
    winnerDiv.innerHTML = `🎉 ${playerName} VENCEU! 🎉<br>Parabéns por completar o tabuleiro de educação sexual!`;
    
    const gameInfo = document.querySelector('.game-info');
    gameInfo.appendChild(winnerDiv);

    setTimeout(() => {
        showCustomModal('🏆 Fim de Jogo!', `${playerName} chegou primeiro ao final! Parabéns por aprender sobre educação sexual de forma divertida!`, [
            {text: 'Jogar Novamente', action: () => { 
                gameState = {
                    currentPlayer: 1,
                    players: {
                        1: { position: 1, coins: 0, bombs: 0 },
                        2: { position: 1, coins: 0, bombs: 0 }
                    },
                    gameEnded: false
                };
                initializeBoard(); 
                updatePlayerDisplay();
                winnerDiv.remove();
                closeModal(); 
            }}
        ]);
    }, 2000);
}

// Mostrar pergunta informativa
function showInformativeQuestion() {
    const randomIndex = Math.floor(Math.random() * perguntasInformativas.length);
    currentQuestion = perguntasInformativas[randomIndex];
    currentQuestionType = 'informative';

    document.getElementById('modalTitle').textContent = 'Verdadeiro ou Falso?';
    document.getElementById('modalQuestion').textContent = currentQuestion.pergunta;
    document.getElementById('modalButtons').innerHTML = `
        <div class="vf-buttons">
            <button class="btn btn-true" onclick="checkVFAnswer('V')">Verdadeiro</button>
            <button class="btn btn-false" onclick="checkVFAnswer('F')">Falso</button>
        </div>
    `;
    
    document.getElementById('questionModal').style.display = 'flex';
}

// Mostrar pergunta V/F
function showVFQuestion() {
    const randomIndex = Math.floor(Math.random() * perguntasRisco.length);
    currentQuestion = perguntasRisco[randomIndex];
    currentQuestionType = 'vf';

    document.getElementById('modalTitle').textContent = 'Pergunta de Risco - V/F?';
    document.getElementById('modalQuestion').textContent = currentQuestion.pergunta;
    document.getElementById('modalButtons').innerHTML = `
        <div class="vf-buttons">
            <button class="btn btn-true" onclick="checkVFAnswer('V')">Verdadeiro</button>
            <button class="btn btn-false" onclick="checkVFAnswer('F')">Falso</button>
        </div>
    `;
    
    document.getElementById('questionModal').style.display = 'flex';
}

// Criar efeito de explosão
function createExplosion() {
    const overlay = document.getElementById('explosionOverlay');
    const particlesContainer = document.getElementById('explosionParticles');
    const gameContainer = document.getElementById('mainGameContainer');
    
    overlay.style.display = 'block';
    gameContainer.classList.add('screen-shake');
    
    particlesContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (i / 20) * 2 * Math.PI;
        const distance = Math.random() * 200 + 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.style.setProperty('--end-x', `${x}px`);
        particle.style.setProperty('--end-y', `${y}px`);
        particle.style.animation = `particle-explosion 1.5s ease-out forwards`;
        particle.style.animationDelay = `${Math.random() * 0.3}s`;
        
        const colors = ['#ff4500', '#ff6b00', '#ff8c00', '#ffa500', '#ffb347'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        particlesContainer.appendChild(particle);
    }
    
    setTimeout(() => {
        overlay.style.display = 'none';
        gameContainer.classList.remove('screen-shake');
        particlesContainer.innerHTML = '';
    }, 1500);
}

// Verificar resposta V/F
function checkVFAnswer(answer) {
    const isCorrect = answer === currentQuestion.resposta_correta;
    const player = gameState.players[gameState.currentPlayer];
    
    // Atualizar reação do personagem (com imagem correta)
    updateCharacterReaction(player.position, isCorrect);
    
    if (isCorrect) {
        player.coins++;
        document.getElementById('answerTitle').textContent = '✅ Correto! +1 Moeda';
        playAudio(sfxCoin, 0.5); // Som de moeda
    } else {
        player.bombs++;
        document.getElementById('answerTitle').textContent = '❌ Incorreto! +1 Bomba';
        
        setTimeout(() => {
            createExplosion();
            playAudio(sfxError, 1.0); // Som de erro
        }, 500);
    }
    
    document.getElementById('answerText').textContent = currentQuestion.explicacao;
    updatePlayerDisplay();
    
    document.getElementById('questionModal').style.display = 'none';
    document.getElementById('answerModal').style.display = 'flex';
}

// Fechar modal
function closeModal() {
    document.getElementById('questionModal').style.display = 'none';
    document.getElementById('answerModal').style.display = 'none';
    
    // Alternar para o próximo jogador após fechar o modal
    if (!gameState.gameEnded) {
        switchPlayer();
    }
}

// Mostrar modal customizado
function showCustomModal(title, message, buttons) {
    document.getElementById('answerTitle').textContent = title;
    document.getElementById('answerText').textContent = message;
    
    const buttonContainer = document.querySelector('#answerModal .modal-buttons');
    buttonContainer.innerHTML = '';
    
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.textContent = button.text;
        btn.onclick = button.action;
        buttonContainer.appendChild(btn);
    });
    
    document.getElementById('answerModal').style.display = 'flex';
}


// Funções de demonstração (não utilizadas no jogo principal, mas mantidas para compatibilidade com SDK)
function showAnswer() { closeModal(); } 
function render(config) { /* Lógica de renderização do SDK */ }
function mapToCapabilities(config) { /* Mapeamento de capacidades do SDK */ }
function mapToEditPanelValues(config) { /* Mapeamento do painel de edição do SDK */ }


// ==============================================
// BANCO DE PERGUNTAS (V/F)
// ==============================================

const perguntasInformativas = [
    {"pergunta": "É seguro rasgar a embalagem do preservativo com os dentes para ser mais rápido.", "resposta_correta": "F", "explicacao": "FALSO. Rasgar com os dentes ou unhas pode causar microfuros invisíveis que anulam a proteção. Sempre use os dedos para rasgar na borda serrilhada. Guarde em locais frescos, longe do calor."},
    {"pergunta": "Se colocar o preservativo do lado errado e ele tocar no pênis, posso virá-lo e usar normalmente.", "resposta_correta": "F", "explicacao": "FALSO. Se começou do lado errado e tocou no pênis, jogue fora e pegue outro! Fluidos pré-ejaculatórios podem ter entrado em contato com a parte interna."},
    {"pergunta": "É importante apertar a pontinha do preservativo antes de desenrolar para tirar o ar.", "resposta_correta": "V", "explicacao": "VERDADEIRO. A pontinha é o reservatório do esperma. Se não tirar o ar, a pressão na ejaculação pode estourar o preservativo."},
    {"pergunta": "O preservativo protege mesmo se não desenrolar até a base do pênis.", "resposta_correta": "F", "explicacao": "FALSO. Deve desenrolar completamente até a base. É ali que a borda forma uma 'barreira' que ajuda a prender o esperma e manter a proteção."},
    {"pergunta": "Posso retirar o preservativo a qualquer momento após a ejaculação sem cuidados especiais.", "resposta_correta": "F", "explicacao": "FALSO. Deve ser rápido e cuidadoso imediatamente após a ejaculação, antes do pênis amolecer. Segure a borda na base e retire devagar."},
    {"pergunta": "O preservativo feminino pode ser colocado horas antes da relação sexual.", "resposta_correta": "V", "explicacao": "VERDADEIRO. Esta é uma grande vantagem! Pode ser colocado com antecedência, tirando a pressão do momento e garantindo que a proteção já está pronta."},
    {"pergunta": "É normal o preservativo feminino ficar frouxo ou torcido dentro do canal vaginal.", "resposta_correta": "V", "explicacao": "VERDADEIRO. Essa folga é normal e permite que ele se ajuste durante a relação. O importante é que o anel menor esteja bem fundo e o maior cubra a entrada."},
    {"pergunta": "Posso usar preservativo masculino e feminino ao mesmo tempo para maior proteção.", "resposta_correta": "F", "explicacao": "FALSO. NUNCA use os dois juntos! O atrito entre os materiais pode rasgar ambos os preservativos. Escolha apenas um."},
    {"pergunta": "O diafragma é considerado um método contraceptivo de barreira.", "resposta_correta": "V", "explicacao": "VERDADEIRO. O diafragma (usado com espermicida) e os preservativos são exemplos de métodos de barreira que impedem fisicamente a passagem dos espermatozoides."},
    {"pergunta": "A pílula do dia seguinte pode ser usada como método contraceptivo regular.", "resposta_correta": "F", "explicacao": "FALSO. É apenas para emergências. Usar regularmente causa desequilíbrios hormonais e é menos eficaz que métodos contraceptivos regulares."},
    {"pergunta": "O preservativo protege contra todas as IST sem exceção.", "resposta_correta": "F", "explicacao": "FALSO. Protege contra a maioria, mas IST como HPV e Herpes podem ser transmitidas pelo contato com áreas da pele não cobertas pelo preservativo."},
    {"pergunta": "O duche vaginal após a relação é eficaz para prevenir gravidez e IST.", "resposta_correta": "F", "explicacao": "FALSO. O duche pode empurrar bactérias para dentro do útero e desequilibra a flora vaginal, aumentando o risco de infecções."},
    {"pergunta": "O preservativo é o único método que oferece dupla proteção: contra gravidez e IST.", "resposta_correta": "V", "explicacao": "VERDADEIRO. É o único método contraceptivo que também oferece proteção contra a maioria das Infecções Sexualmente Transmissíveis."},
    {"pergunta": "O consentimento dado no início da relação vale para toda a atividade sexual.", "resposta_correta": "F", "explicacao": "FALSO. O consentimento deve ser contínuo e pode ser retirado a qualquer momento. Deve ser confirmado em cada etapa da atividade sexual."},
    {"pergunta": "Libido e desejo sexual são exatamente a mesma coisa.", "resposta_correta": "F", "explicacao": "FALSO. Libido é o impulso sexual geral (o 'motor'), enquanto desejo sexual é a vontade específica de ter atividade sexual (a 'vontade de dirigir')."},
    {"pergunta": "Sexting sem consentimento pode ter consequências legais graves.", "resposta_correta": "V", "explicacao": "VERDADEIRO. A distribuição não consensual de conteúdo íntimo (pornografia de vingança) é ilegal e pode ter graves consequências emocionais e legais."},
    {"pergunta": "Orientação Sexual e Identidade de Gênero referem-se ao mesmo conceito.", "resposta_correta": "F", "explicacao": "FALSO. Orientação Sexual é sobre atração por outras pessoas. Identidade de Gênero é o sentido interno de ser homem, mulher, ambos, nenhum ou outro gênero."},
    {"pergunta": "Uma pessoa sem sintomas visíveis de IST não pode ter nenhuma infecção.", "resposta_correta": "F", "explicacao": "FALSO. Muitas IST (como Clamídia e HPV) podem ser assintomáticas por muito tempo. Por isso são essenciais os testes regulares e o uso de preservativo."},
    {"pergunta": "Lubrificantes à base de óleo são seguros com preservativos de látex.", "resposta_correta": "F", "explicacao": "FALSO. Óleos (vaselina, óleos de massagem) danificam o látex, tornando o preservativo menos eficaz. Use lubrificantes à base de água ou silicone."},
    {"pergunta": "É impossível engravidar durante a menstruação.", "resposta_correta": "F", "explicacao": "FALSO. Embora menos provável, espermatozoides sobrevivem dias no corpo e a ovulação pode ocorrer mais cedo em alguns ciclos. Sempre use proteção se não deseja engravidar."}
];

const perguntasRisco = [
    {"pergunta": "Verdade ou Mito: Esquecer a pílula anticoncepcional num dia, mas tomá-la no dia seguinte, anula completamente o risco de gravidez.", "resposta_correta": "F", "explicacao": "FALSO. A eficácia da pílula depende da tomada correta e diária. Se você falhar um dia, a proteção pode ser reduzida, e métodos de proteção adicionais (como o preservativo) devem ser usados nos dias seguintes, conforme as indicações médicas."},
    {"pergunta": "É seguro usar dois preservativos ao mesmo tempo para maior proteção.", "resposta_correta": "F", "explicacao": "FALSO. Usar dois preservativos aumenta o atrito entre eles, fazendo com que ambos se rasguem mais facilmente. Use sempre apenas um preservativo de cada vez."},
    {"pergunta": "A pílula do dia seguinte pode ser usada como método contraceptivo regular.", "resposta_correta": "F", "explicacao": "FALSO. A pílula do dia seguinte é apenas para emergências. Usar regularmente pode causar desequilíbrios hormonais e é menos eficaz que métodos contraceptivos regulares."},
    {"pergunta": "É possível engravidar mesmo usando preservativo corretamente.", "resposta_correta": "V", "explicacao": "VERDADEIRO. Nenhum método contraceptivo é 100% eficaz. O preservativo tem cerca de 98% de eficácia quando usado corretamente, mas ainda existe uma pequena possibilidade de falha."},
    {"pergunta": "Toda IST apresenta sintomas visíveis.", "resposta_correta": "F", "explicacao": "FALSO. Muita IST (como Clamídia, HPV e HIV) pode ser assintomática por longos períodos. Por isso é importante fazer testes regulares e usar sempre preservativo."},
    {"pergunta": "O preservativo protege contra toda IST.", "resposta_correta": "F", "explicacao": "FALSO. O preservativo protege contra a maioria das IST, mas algumas como HPV e Herpes podem ser transmitidas pelo contato com áreas da pele não cobertas pelo preservativo."},
    {"pergunta": "Lubrificantes à base de óleo são seguros para usar com preservativos de látex.", "resposta_correta": "F", "explicacao": "FALSO. Lubrificantes à base de óleo (como vaselina ou óleos de massagem) podem danificar o látex do preservativo, tornando-o menos eficaz e mais propenso a rasgar. Use sempre lubrificantes à base de água ou silicone com preservativos de látex."},
    {"pergunta": "É possível engravidar tendo relação sexual durante a menstruação.", "resposta_correta": "V", "explicacao": "VERDADEIRO. Embora a probabilidade seja menor, espermatozoides podem sobreviver por vários dias no corpo feminino, e a ovulação pode ocorrer mais cedo em alguns ciclos, levando à gravidez. Sempre use proteção se não deseja engravidar."},
    {"pergunta": "IST é um problema de saúde apenas para pessoas sexualmente ativas com múltiplos parceiros.", "resposta_correta": "F", "explicacao": "FALSO. Qualquer pessoa sexualmente ativa pode contrair uma IST, independentemente do número de parceiros. O risco está na prática sexual desprotegida."},
    {"pergunta": "O sexo anal é uma prática de baixo risco para a transmissão de IST em comparação com o sexo vaginal.", "resposta_correta": "F", "explicacao": "FALSO. O sexo anal é, na verdade, uma prática de alto risco para a transmissão de IST (incluindo o HIV) devido à maior fragilidade do tecido anal, que pode sofrer microlesões mais facilmente. O uso correto do preservativo e lubrificante é essencial."}
];
