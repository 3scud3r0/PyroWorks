# PyroWorks

**PyroWorks** é um simulador criativo de direção de espetáculos audiovisuais. O
projeto trata fogos exclusivamente como efeitos virtuais abstratos: não modela
materiais, fabricação ou operação de dispositivos reais.

O primeiro marco do projeto é simples e ambicioso: fazer o ato de apertar
**PLAY** e assistir a um show curto ser extraordinário antes de expandir para
carreira, multiplayer ou geração procedural.

## Documentação

- [Visão do produto e plano do primeiro vertical slice](docs/VISION.md)

## Estado do projeto

O projeto está na **Fase 1** e já possui um vertical slice web jogável de “Noite
no Lago”: uma timeline editável, quatro formas de luz, três paletas, modo
espectador, geração procedural, Rhythm Score, importação/exportação de
performances, um Diretor Criativo por linguagem natural e uma simulação
determinística em Canvas com trilha e efeitos sonoros procedurais.

Ao abrir, o protótipo entra diretamente na **experiência cinematográfica em tela
cheia**: cenário, som e um único botão para iniciar. O estúdio técnico permanece
oculto e só aparece quando o jogador escolhe **Abrir Estúdio**.

### Recursos jogáveis

- Edite timing, intensidade, posição e altura das formas de luz.
- Combine dez arquétipos abstratos, crie sequências crescentes e alterne entre
  câmeras terrestre, aérea e Director.
- Peça ao Diretor Criativo uma abertura minimalista, pausa, paleta, atmosfera ou
  finale; a alteração continua editável e pode ser desfeita.
- Gere, salve localmente, importe e exporte performances em JSON.
- Alterne efeitos e música separadamente e assista sem HUD no modo espectador.
- Escolha um perfil de público e receba, ao final, uma avaliação de timing, cor,
  finale e uso de respiro — quantidade bruta não garante aprovação.

## Executar

```bash
npm start
```

Abra `http://localhost:4173`. Use **Espaço** para reproduzir/pausar, arraste
eventos na timeline e pressione **Esc** para sair do modo espectador.

## Validar

```bash
npm test
npm run check
```

## GitHub Pages

O workflow `.github/workflows/pages.yml` testa, compila e publica automaticamente
o site estático no GitHub Pages após cada push para `main`, `master` ou `work`.
Também é possível iniciá-lo manualmente pela aba **Actions**.

No primeiro deploy, configure o repositório em **Settings → Pages → Source** como
**GitHub Actions**. A URL publicada aparecerá no environment `github-pages` e no
resumo da execução. O build usa somente caminhos relativos, portanto funciona em
URLs de projeto como `https://usuario.github.io/PyroWorks/`.

O protótipo também possui manifesto instalável e service worker; depois da
primeira visita, o shell principal pode abrir sem conexão.
