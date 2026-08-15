# 🛒 skill-alexa-bora-mercado

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script**. Permite que você e sua esposa compartilhem a mesma lista de mercado usando o nome da skill e de invocação **`bora mercado`** com comandos super naturais.

---

## 🏗️ Arquitetura do Projeto

```text
[ Echo da Esposa ]  \
                     --> [ Alexa Custom Skill ] --> [ Google Apps Script ] --> [ Google Sheets ]
[ Sua Echo ]        /    (Skill: Bora Mercado)      (API REST WebApp)      (Planilha: Bora Mercado)
```

- **Nome da Skill na Alexa**: `Bora Mercado`
- **Nome de Invocação (Invocation Name)**: `bora mercado`
- **Nome da Planilha no Google Sheets**: `Bora Mercado`

---

## 📁 Estrutura de Pastas

```text
skill-alexa-bora-mercado/
├── README.md                           # Guia de configuração e comandos
├── .gitignore                          # Arquivos ignorados pelo Git
├── assets/
│   ├── icon_108.png                    # Small Skill Icon (108x108 px)
│   └── icon_512.png                    # Large Skill Icon (512x512 px)
├── google-apps-script/
│   └── Code.gs                         # Backend no Google Apps Script
└── alexa-skill/
    ├── skill.json                      # Manifest da Skill na Alexa
    ├── interactionModels/
    │   └── custom/
    │       └── pt-BR.json              # Modelo de interação (Intents, Utterances e Slots)
    └── lambda/
        ├── index.js                    # Handler Node.js da Alexa Skill
        └── package.json                # Dependências da Lambda
```

---

## 🚀 Passo a Passo de Configuração e Atualização

### 1. No Google Sheets
- Altere o nome da sua planilha no Google Drive para **`Bora Mercado`**.

### 2. No Alexa Developer Console
- **Public Name**: Em **Skill Information** / **Distribution**, mude o nome da Skill para **`Bora Mercado`**.
- **Skill Invocation Name**: Em **Build** > **Invocation**, defina o nome como **`bora mercado`** e clique em **Save Model** e em seguida **Build Model**.
- **Modelo de Interação**: Em **Interaction Model** > **JSON Editor**, cole o conteúdo de [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json) e clique em **Save Model** e **Build Model**.
- **Código Lambda**: Na aba **Code**, cole o conteúdo de [`alexa-skill/lambda/index.js`](./alexa-skill/lambda/index.js) e clique em **Save** e **Deploy**.
- **Example Phrases (Distribution)**:
  1. `Alexa, abra o bora mercado`
  2. `Alexa, inicie o bora mercado`
  3. `Alexa, abra bora mercado`

---

## 🗣️ Comandos de Voz Super Naturais

### Para Anotar (Adicionar):
- *"Alexa, peça pro **bora mercado** anotar leite."*
- *"Alexa, peça pro **bora mercado** botar pão."*
- *"Alexa, fala pro **bora mercado** colocar café."*

### Para Consultar:
- *"Alexa, pergunte pro **bora mercado** o que falta."*
- *"Alexa, pergunte pro **bora mercado** o que precisamos."*

### Para Riscar (Remover):
- *"Alexa, peça pro **bora mercado** riscar o leite."*
- *"Alexa, fala pro **bora mercado** tirar o pão."*

---

## 💡 Dica de Ouro: Atalhos com Rotinas da Alexa

Se quiser falar frases ainda menores (ex: *"Alexa, anota leite"*):
1. Abra o app da Alexa no celular (**Mais** > **Rotinas** > **+**).
2. **Quando:** Você diz: *"Alexa, anota leite"*
3. **Ação:** Personalizado -> *"Alexa, peça pro bora mercado anotar leite"*.
