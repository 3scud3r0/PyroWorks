# PyroWorks — visão de produto e vertical slice

> **Regra central:** não simular apenas fogos; simular o espetáculo.

## Limites criativos e de segurança

PyroWorks é uma obra inteiramente virtual. Termos como *peony*, *willow*,
*comet* e *mine* são somente arquétipos visuais. Seus controles são artísticos
— cor, escala, duração, densidade, brilho, dispersão e ritmo — e nunca representam
materiais, proporções, montagem, acionamento ou operação de pirotecnia real.

As falhas também são abstratas: um evento pode atrasar, desaparecer, ficar
encoberto pela fumaça virtual ou perder impacto composicional. Elas existem para
criar decisões de direção, não para reproduzir incidentes reais.

---

## 1. Visão definitiva

**PyroWorks é um palco audiovisual jogável no qual qualquer pessoa pode imaginar,
dirigir e apresentar um espetáculo de luz no céu.** Ele combina a satisfação
imediata de um sandbox com a precisão de uma ilha de edição, a expressividade de
um instrumento musical e a progressão de um jogo de gestão.

O jogador não escolhe apenas “qual efeito vem depois”. Ele conduz expectativa,
silêncio, escala, espaço, cor, música, câmera, atmosfera e reação do público. Um
show pequeno, coerente e preciso deve superar uma sequência enorme e caótica.

### Fantasia do jogador

1. **Imaginar:** “quero uma abertura íntima em azul e dourado, uma pausa e um
   clímax que ocupe todo o horizonte”.
2. **Compor:** transformar essa intenção em eventos legíveis numa timeline.
3. **Dirigir:** escolher palco, pontos de origem, câmera, atmosfera e mixagem.
4. **Sentir:** apertar PLAY e ver a composição ganhar peso, luz, som e escala.
5. **Lapidar:** entender por que um momento funcionou e alterar rapidamente.
6. **Apresentar:** guardar a performance como replay cinematográfico e,
   futuramente, publicar, colaborar e remixar.

### Promessa de experiência

- **Primeiros 60 segundos:** escolher um clima e obter um show bonito sem manual.
- **Primeiros 10 minutos:** mover eventos, trocar uma paleta e criar um clímax.
- **Longo prazo:** dominar composição, ritmo, espaço, câmera e produção, sem
  transformar profundidade em centenas de menus.
- **Modo espectador:** céu, luz, ambiente, público, música e espetáculo, sem HUD.

### Princípios de escopo

- Primeiro aperfeiçoar **um palco, uma câmera e um show de 60 segundos**.
- Recursos novos só entram se tornarem o show mais impressionante, divertido ou
  criativo.
- Conteúdo vem depois de sensação; quantidade vem depois de legibilidade;
  metajogo vem depois de PLAY.

---

## 2. Os sete pilares de design

### 1. Direção, não detonação

O verbo central é **dirigir**. Toda interface fala em efeitos, cenas, intenções,
paletas, energia e tempo. A abstração protege a fantasia criativa e mantém o
produto distante de procedimentos do mundo real.

### 2. PLAY precisa emocionar

O show é o produto. Transições de interface, contagem silenciosa, primeira luz,
impacto sonoro, iluminação do ambiente e respiro final formam uma única
experiência. Se assistir não for prazeroso, nenhum sistema de progressão compensa.

### 3. Ritmo acima de volume

Silêncio, contraste e antecipação valem tanto quanto intensidade. O futuro
**Rhythm Score** recompensa sincronização, progressão, variedade relevante,
pausas e resolução; penaliza repetição e saturação. Mais partículas não significa
automaticamente uma nota maior.

### 4. Profundidade em camadas

O modo **Beginner** oferece intenções (“calmo”, “crescente”, “finale”), presets e
alças diretas. O modo **Pro** revela curvas, agrupamento, quantização, offsets,
parâmetros espaciais e automação. Ambos editam o mesmo modelo de dados; mudar de
modo nunca destrói trabalho.

### 5. Física a serviço da arte

Gravidade, vento, arrasto, fumaça, luz e atraso acústico geram peso e coerência,
mas são modelos visuais controláveis. Consistência percebida é mais importante
que precisão acadêmica, e determinismo é obrigatório para editar e reproduzir.

### 6. O palco também atua

Água reflete, neblina difunde, nuvens recebem luz, skyline dá escala e a plateia
responde. Ambiente, atmosfera, câmera e áudio não são decoração: eles alteram a
leitura da composição.

### 7. Criar, aprender e compartilhar sem atrito

Cada reprodução gera feedback acionável, não uma sentença. Undo, comparação A/B,
replay determinístico e remix tornam experimentação segura. Colaboração futura
se organiza por papéis — direção, composição, visual, câmera e produção.

---

## 3. Core gameplay loop

```text
INTENÇÃO → CRIAR → POSICIONAR → PROGRAMAR → SIMULAR → ASSISTIR
    ↑                                                    ↓
COMPARTILHAR ← APRESENTAR ← APERFEIÇOAR ← EDITAR ← ANALISAR
```

| Etapa | Decisão do jogador | Resposta do jogo |
|---|---|---|
| Intenção | Tema, emoção e arco | Preset inicial e sugestões não destrutivas |
| Criar | Efeito/paleta escolhidos | Prévia curta e custo visual estimado |
| Posicionar | Origem e ocupação do céu | Gizmos simples e envelope espacial |
| Programar | Tempo, sequência e grupos | Snap, marcadores e leitura de energia |
| Simular | PLAY completo ou trecho | Reprodução determinística em tempo real |
| Assistir | Foco total no espetáculo | UI recolhe; câmera, som e palco assumem |
| Analisar | Ler ritmo, clareza e pico | Heatmap e três observações prioritárias |
| Editar | Ajustar a causa, não sintomas | Undo, A/B e re-simulação instantânea |
| Aperfeiçoar | Criar contraste e identidade | Comparação com a intenção original |
| Apresentar | Escolher câmera/performance | Replay limpo e metadados da versão |
| Compartilhar | Publicar ou remixar | Linhagem autoral e cópia editável (futuro) |

### Loop de 30 segundos do protótipo

Selecionar um evento → arrastá-lo → apertar PLAY → perceber a mudança no céu e
no som → usar replay do trecho → manter ou desfazer. O tempo entre intenção e
resultado deve ficar abaixo de cinco segundos.

### Gauntlet por incremento

Em cada ciclo: escolher o maior problema perceptível; definir uma emoção-alvo;
implementar a menor solução jogável; testar visual, ritmo e interface; remover
complexidade sem valor; integrar; e apresentar novamente. Só então o próximo
sistema entra.

---

## 4. Arquitetura do simulador

### Visão em camadas

```text
Editor / Beginner / Pro
        │ comandos (undo/redo)
        ▼
Show Document ──► Compiler ──► Event Schedule determinístico
                         ├──► Visual Simulation (GPU + CPU orchestration)
                         ├──► Atmosphere & Lighting
                         ├──► Audio & Music Clock
                         ├──► Camera Director
                         └──► Telemetry / Rhythm Analysis
                                      │
Replay Snapshot ◄── estado + seed + versão do simulador
```

### Módulos e contratos

1. **Show Document:** fonte de verdade serializável e versionada. Contém cenas,
   faixas, eventos, paletas, pontos virtuais, automações e seeds; não contém
   objetos vivos do motor.
2. **Command Layer:** toda edição é um comando reversível. Permite undo/redo,
   macros, histórico, colaboração futura e testes sem acoplar a UI.
3. **Show Compiler:** valida o documento, resolve grupos/loops, aplica presets e
   produz eventos imutáveis ordenados por tempo. Erros aparecem antes de PLAY.
4. **Master Clock:** uma única fonte de tempo para visual, música, câmera e
   análise. Suporta seek, pausa, velocidade e *pre-roll*.
5. **Simulation Orchestrator:** agenda emissores, distribui orçamento de frame,
   escolhe LOD e mantém pools. A CPU decide “o quê/quando”; a GPU simula “como”.
6. **Atmosphere & Stage:** fornece vento visual, densidade de névoa, chuva,
   nuvens, exposição e superfícies receptoras de luz.
7. **Renderer:** partículas emissivas, fumaça, iluminação volumétrica, reflexos
   aproximados, bloom e composição HDR.
8. **Audio Graph:** agenda camadas sonoras abstratas no mesmo relógio, aplica
   distância, atraso perceptivo, oclusão simples, eco do palco e ducking musical.
9. **Camera Director:** rigs terrestre/livre/aéreo e cortes; no slice, somente
   uma câmera terrestre com enquadramento assistido.
10. **Replay & Telemetry:** grava comandos, seed, câmera e métricas; não grava
    milhões de partículas. Re-simula o show de forma determinística.

### Modelo mínimo de dados

```text
Show { id, version, duration, seed, stage, atmosphere, tracks[], palettes[] }
Track { id, type: visual|audio|camera, name, muted, events[] }
Event { id, archetype, start, duration, position, scale, intensity,
        paletteRef, variationSeed, parameters, automation[] }
Palette { id, colors[], gradientMode, transitionCurve }
Automation { target, keyframes[], interpolation }
```

Todos os valores são unidades artísticas normalizadas ou unidades internas do
mundo virtual. O arquivo não expõe correspondências com dispositivos reais.

### Determinismo e desempenho

- Tick lógico fixo; renderização interpolada e independente da taxa de quadros.
- Seeds por show, evento e emissor, evitando que uma alteração local transforme
  eventos não relacionados.
- Orçamento adaptativo por milissegundos de GPU, não apenas por contagem.
- Perfis de qualidade alteram LOD, fumaça e reflexos, preservando timing, cor e
  silhueta.
- Telemetria mede frame time, partículas vivas, overdraw, pools, eventos perdidos
  e latência do PLAY.

---

## 5. Sistema de partículas

### Objetivo perceptivo

Cada efeito precisa comunicar **ascensão, transformação, expansão, suspensão e
extinção**. A beleza nasce da silhueta inicial, do movimento secundário, da
persistência luminosa, da fumaça iluminada e da resposta do palco.

### Arquétipo visual modular

Um `EffectRecipe` combina módulos seguros e abstratos:

- **Spawn Shape:** ponto, anel, esfera, arco, linha ou volume artístico.
- **Motion Field:** impulso visual, gravidade estilizada, arrasto, turbulência e
  vetor de vento do palco.
- **Appearance:** gradiente HDR, tamanho, brilho, trilha, cintilação e fade.
- **Evolution:** curvas normalizadas ao longo da vida e mudança cromática.
- **Children:** gatilhos visuais por tempo/fase para multiestágios abstratos.
- **Smoke/Residue:** campo de baixa frequência separado das partículas brilhantes.
- **Light Proxy:** poucas luzes agregadas representam milhares de partículas.
- **Audio Cue:** evento sonoro sem qualquer semântica de dispositivo real.

Peony, chrysanthemum, ring, willow, palm, comet, fountain, waterfall, strobe,
glitter, spiral e formas abstratas são receitas sobre esses módulos, e não novas
classes de código.

### Pipeline por frame

1. O scheduler ativa receitas no tempo exato.
2. A CPU cria descritores compactos em pools e escolhe o nível de detalhe.
3. Compute shaders emitem e atualizam buffers GPU.
4. Campos globais aplicam gravidade estilizada, vento, arrasto e turbulência.
5. Partículas mortas alimentam contadores; amostras agregadas alimentam fumaça,
   luz e áudio, sem leitura completa de volta para CPU.
6. Culling por frustum/tamanho e binning por material reduzem custo.
7. Renderização HDR aditiva/alpha controlada compõe trilhas, glow, fumaça e
   reflexos aproximados.

### Escala e degradação elegante

| Distância/importância | Representação |
|---|---|
| Herói, perto da câmera | Partículas completas, trilhas, fumaça e luz local |
| Médio | Menos segmentos e partículas, brilho preservado |
| Longe | Impostor/cluster analítico com mesma silhueta e timing |
| Fora de quadro | Simulação temporal mínima; áudio e estado continuam |

O sistema usa pooling, instancing, culling, buffers compactados e emissão
indireta. Ao exceder o orçamento, reduz primeiro detalhe invisível, depois
densidade redundante; nunca altera batidas, duração, cor dominante ou clímax.

### Luz, fumaça e ambiente

- Luzes são *proxies* agregados por cluster, com cor e energia suavizadas.
- Fumaça usa volumes de resolução adaptativa, advecção pelo vento e dissipação.
- Névoa e nuvens recebem iluminação aproximada, ampliando escala sem multiplicar
  luzes reais.
- Água usa captura/reflexo simplificado e bloom vertical; superfícies recebem
  pulsos de iluminação de baixa frequência.
- Exposição tem limites e adaptação lenta para que um clímax brilhe sem apagar
  completamente a leitura de cores.

---

## 6. Sistema de timeline

### Linguagem visual

A timeline é uma **partitura de energia**, não uma planilha. Eventos exibem cor,
forma, duração e intensidade; grupos mostram envelopes; pausas são espaço visível.
Uma faixa superior resume a energia percebida de todo o show.

```text
Tempo       00:00       00:15       00:30       00:45       01:00
Estrutura   INTRO       TEMA        ESCALADA    RESPIRO     FINALE
Visual 1    ──◆───◆─────[ sequência ]──────────────◆──────[grupo]
Visual 2    ───────◇────────◇────────[crescendo]──────────[grupo]
Música      ─beat─beat──DOWN────────────DROP──────────────END
Energia     ▁▂▂▃▃▃▄▅▆▆▇▂▂▃▅████
```

### Interações do vertical slice

- Selecionar, arrastar, duplicar e apagar eventos.
- Snap configurável e marcadores estruturais, sem análise musical nesta fase.
- Multi-seleção e agrupamento simples.
- Alterar intensidade e escala por alças no clipe.
- Trocar paleta sem abrir um painel avançado.
- Scrub com prévia aproximada; PLAY recomeça deterministicamente.
- Loop de região, desfazer/refazer e zoom temporal.

### Evolução posterior

- **Fase 2:** padrões, sequências, loops aninhados, automação, vento e biblioteca.
- **Fase 3:** waveform, BPM, beats, downbeats, seções, drops e Rhythm Score.
- **Fase 6:** diretor virtual converte linguagem natural em comandos reversíveis,
  sempre apresentando um diff antes de aplicar.

### Regras de edição

- O playhead pertence ao Master Clock; UI, áudio e simulação nunca mantêm relógios
  concorrentes.
- Alterações durante PLAY entram no próximo ponto seguro ou reiniciam a região,
  deixando isso explícito.
- Quantização é opcional; nunca corrige automaticamente uma escolha expressiva.
- Randomização exige seed e prévia, portanto pode ser reproduzida e desfeita.
- Beginner e Pro produzem os mesmos comandos e o mesmo documento.

---

## 7. Primeiro vertical slice: **Noite no Lago**

### Resultado desejado

Em até três minutos após abrir o protótipo, uma pessoa escolhe uma paleta, move
um evento, aperta PLAY e assiste a um show de 60 segundos que parece deliberado,
tem escala, respira, cresce e termina com resolução audiovisual.

### Conteúdo fechado

- **Um palco:** margem de um lago à noite, silhueta de montanhas, água refletiva,
  névoa leve e plateia distante.
- **Uma câmera:** terrestre cinematográfica, com enquadramento assistido e leve
  movimento; sem editor de câmera.
- **Quatro receitas:** burst/peony, comet, willow e ring, somente como formas
  visuais abstratas.
- **Três paletas:** Aurora, Gold e Cyberpunk.
- **Um show autoral de 60 s:** introdução, tema, escalada, pausa e finale.
- **Uma faixa musical original/provisória** com pulsação clara e licença adequada.
- **Timeline mínima:** mover, duplicar, apagar, paleta, intensidade, PLAY, stop,
  loop, undo e reset do preset.
- **Uma atmosfera:** vento visual leve e fixo; sem controles climáticos.
- **Um mix:** música, efeitos próximos/distantes, eco do lago, ambiente e público.
- **Dois modos de tela:** edição e espectador sem HUD.

### Arco dos 60 segundos

| Tempo | Função | Composição |
|---|---|---|
| 00–08 s | Expectativa | Ambiente, uma ascensão e primeira assinatura de cor |
| 08–22 s | Tema | Alternância lateral com respostas musicais e espaço |
| 22–38 s | Desenvolvimento | Rings e peonies ampliam largura e densidade |
| 38–45 s | Pausa | Decaimento, fumaça iluminada e som distante |
| 45–56 s | Escalada | Camadas em alturas virtuais e ritmo crescente |
| 56–60 s | Finale | Três frases complementares, impacto, cauda e blackout |

### Sensação de PLAY

1. A timeline recolhe em 250 ms e o cursor desaparece.
2. Um *pre-roll* de dois segundos estabelece água, vento e expectativa.
3. A primeira luz ilumina névoa, montanha e reflexo antes do som percebido.
4. A câmera faz movimentos discretos, sem disputar atenção.
5. O finale termina com cauda sonora, reação da plateia e dois segundos de céu.
6. A interface retorna oferecendo **Rever**, **Editar finale** ou **Comparar A/B**.

### O que fica deliberadamente fora

Carreira, economia, público segmentado, chuva, múltiplos palcos, câmera livre,
upload de música, Rhythm Score, multiplayer, compartilhamento, IA, procedural,
drones, vídeo e 10.000 eventos simultâneos. Esses itens só avançam depois que o
slice validar o prazer de assistir e editar.

### Plano Gauntlet do slice

1. **Pulso 1 — Momento herói:** uma receita, céu, câmera, luz e áudio; validar
   peso e beleza em dez segundos.
2. **Pulso 2 — Frase:** três eventos e uma pausa; validar contraste e antecipação.
3. **Pulso 3 — PLAY:** show completo bloqueado; validar arco e finale.
4. **Pulso 4 — Editar:** timeline mínima; validar tempo até perceber uma mudança.
5. **Pulso 5 — Palco:** água, névoa, plateia e mix; validar escala.
6. **Pulso 6 — Polimento:** performance, acessibilidade visual básica, onboarding
   e testes externos. Só depois planejar a biblioteca da Fase 2.

---

## 8. Quando o primeiro protótipo é “divertido”

O slice só é aprovado se cumprir **todos os bloqueadores técnicos** e alcançar
as metas de experiência em duas rodadas consecutivas de teste com pelo menos dez
pessoas por rodada, sendo ao menos metade sem experiência em editores.

### Bloqueadores técnicos

- [ ] 60 fps no hardware-alvo de referência em 1080p no preset recomendado, com
  1% low de pelo menos 45 fps durante o finale.
- [ ] Nenhum travamento e nenhum evento visual/sonoro perdido em 30 reproduções.
- [ ] Dessincronização audiovisual menor que 50 ms ao longo dos 60 segundos.
- [ ] Mesmo documento + seed produz a mesma ordem, timing, formas dominantes e
  cores em dez replays.
- [ ] PLAY inicia em até 500 ms; stop e replay não deixam partículas ou áudio
  residuais incorretos.
- [ ] Uso de GPU/CPU não cresce após 20 ciclos de play/stop (pools estáveis).

### Metas de usabilidade

- [ ] 90% encontram PLAY sem instrução em até dez segundos.
- [ ] 80% movem um evento, trocam a paleta e reproduzem o resultado em até três
  minutos, sem ajuda humana.
- [ ] Mediana inferior a cinco segundos entre finalizar uma edição e ver o trecho.
- [ ] 90% conseguem desfazer a mudança e restaurar o preset.
- [ ] No modo espectador, 100% identificam como sair sem interromper acidentalmente
  o show.

### Metas emocionais e de ritmo

- [ ] Nota média de **“quero assistir de novo” ≥ 4/5**.
- [ ] Nota média de **impacto do finale ≥ 4/5**.
- [ ] Pelo menos 80% identificam corretamente introdução, pausa e finale ao rever
  uma captura da curva de energia.
- [ ] Pelo menos 70% criam espontaneamente uma segunda versão após a primeira.
- [ ] Pelo menos 60% preferem sua versão editada ao preset em comparação cega A/B.
- [ ] A resposta aberta “melhor momento” não converge apenas para “mais coisas”; ao
  menos 40% citam timing, cor, pausa, reflexo, música ou atmosfera.

### Metas de qualidade audiovisual

- [ ] Em teste cego, 80% descrevem os quatro arquétipos como visualmente distintos.
- [ ] Cores principais continuam distinguíveis no finale, sem virar branco uniforme.
- [ ] A pausa mantém tensão: menos de 20% a interpretam como fim acidental.
- [ ] Som comunica perto/longe para ao menos 75% usando apenas áudio em fones.
- [ ] Reflexos, névoa e iluminação reforçam o efeito sem ocultar a silhueta em pelo
  menos 90% dos frames amostrados pelos testes visuais automatizados/manuais.

### Instrumentação de teste

Registrar somente métricas de produto: tempo até PLAY, comandos, undo, replays,
frame time, dessincronização, mudanças de paleta, abandono e respostas da sessão.
Capturas de A/B preservam seed e câmera. Cada teste termina com três perguntas:

1. Qual momento você lembra e por quê?
2. Onde perdeu interesse ou se sentiu sem controle?
3. O que mudaria antes de mostrar este show a alguém?

### Regra de decisão

Se o protótipo falhar, a equipe corrige primeiro o maior problema entre **impacto
de PLAY**, **clareza da edição** e **ritmo**. Não adiciona conteúdo para mascarar
uma base fraca. Fase 2 começa apenas quando assistir já for uma recompensa e uma
edição simples produzir uma diferença imediatamente perceptível.

---

## Próximo passo executável

Construir o **Pulso 1** como um teste de dez segundos: céu, lago, câmera fixa,
uma receita peony abstrata, iluminação agregada, reflexo, uma camada sonora com
distância e replay determinístico. O artefato é aprovado quando cinco observadores
conseguem apontar ascensão, expansão, persistência e extinção — e querem apertar
PLAY novamente.
