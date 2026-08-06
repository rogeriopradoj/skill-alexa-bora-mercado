# 🛒 skill-alexa-lista-de-casa

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** via **Google Apps Script**. Permite que contas da Alexa em perfis Amazon diferentes (ex: você e sua esposa no Brasil) compartilhem e gerenciem a mesma lista de compras usando comandos de voz.

---

## 🏗️ Arquitetura do Projeto

```text
[ Echo da Esposa ]  \
                     --> [ Alexa Custom Skill ] --> [ Google Apps Script ] --> [ Google Sheets ]
[ Sua Echo ]        /    (Alexa-Hosted Node.js)      (API REST WebApp)     (Planilha Compartilhada)
```

- **Google Sheets**: Armazena os itens da lista.
- **Google Apps Script**: Atua como uma API REST gratuita exposta como Web App.
- **Alexa Custom Skill**: Skill hospedada gratuitamente no AWS Lambda (Alexa-Hosted) que responde aos comandos de voz e se comunica com o Apps Script.
- **Alexa Beta Testing**: Permite compartilhar a Skill em desenvolvimento com a conta da sua esposa sem precisar publicar na loja da Amazon.

---

## 📁 Estrutura do Repositório

```text
skill-alexa-lista-de-casa/
├── README.md                           # Este guia de configuração e uso
├── .gitignore                          # Arquivos ignorados pelo Git
├── google-apps-script/
│   └── Code.gs                         # Código do backend no Google Apps Script
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

## 🚀 Passo a Passo de Configuração

### Passo 1: Configurar a Planilha e o Google Apps Script

1. Crie uma planilha no Google Drive e dê o nome de **`Lista de Compras`**.
2. Na primeira linha da Coluna A, escreva o cabeçalho: `Item`.
3. Compartilhe essa planilha com o e-mail da sua esposa (com permissão de **Editor**).
4. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
5. Copie o conteúdo do arquivo [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) e cole no editor do Apps Script.
6. Clique no botão **Implantar** (Deploy) > **Nova implantação**.
7. Selecione o tipo **App da Web** (Web App) e preencha:
   - **Descrição**: `API Lista de Compras`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem tem acesso**: `Qualquer pessoa` (Anyone)
8. Clique em **Implantar**, autorize as permissões da sua conta Google e **copie a URL do Web App gerada**.
   - A URL terá o formato: `https://script.google.com/macros/s/.../exec`

---

### Passo 2: Criar e Configurar a Skill no Alexa Developer Console

1. Acesse o [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) e faça login.
2. Clique em **Create Skill**:
   - **Skill name**: `Lista de Casa`
   - **Primary locale**: `Portuguese (BR)`
   - **Experience**: `Custom`
   - **Hosting resource**: `Alexa-hosted (Node.js)`
3. Após a criação, vá em **Interaction Model** > **JSON Editor**:
   - Copie o conteúdo do arquivo [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json).
   - Cole no editor JSON e clique em **Save Model** e em seguida **Build Model**.
4. Vá para a aba **Code** no console da Alexa:
   - Abra o arquivo `index.js` e cole o conteúdo do arquivo [`alexa-skill/lambda/index.js`](./alexa-skill/lambda/index.js).
   - Na linha 7 do `index.js`, substitua a constante `GOOGLE_SCRIPT_URL` pela URL que você copiou no Passo 1:
     ```javascript
     const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
     ```
   - Abra o `package.json` e garanta que o conteúdo seja igual a [`alexa-skill/lambda/package.json`](./alexa-skill/lambda/package.json).
   - Clique em **Save** e em seguida **Deploy**.

---

### Passo 3: Compartilhar com a Conta da sua Esposa (Beta Testing)

Para que a Skill funcione nas duas contas sem publicar na loja da Amazon:

1. No **Alexa Developer Console**, vá para a aba **Test**.
2. Mude o seletor de teste de *Off* para **Development**.
3. Vá para o menu superior **Distribution** > **Beta Testing** (ou em Tools > Beta Testing).
4. Adicione o e-mail da conta Amazon da sua esposa na lista de testadores.
5. Ela receberá um convite por e-mail. Ao aceitar o convite, a Skill ficará disponível para ela no aplicativo Alexa do celular e nos dispositivos Echo vinculados à conta dela.

---

## 🗣️ Como Usar no Dia a Dia

O nome de invocação da Skill é **`lista de casa`**.

### Comandos em Etapa Única (One-Shot):
- *"Alexa, peça para a **lista de casa** adicionar leite."*
- *"Alexa, mande a **lista de casa** incluir café."*
- *"Alexa, pergunte para a **lista de casa** o que tem na lista."*
- *"Alexa, peça para a **lista de casa** remover o queijo."*

### Modo Conversação:
1. Você diz: *"Alexa, abra a **lista de casa**."*
2. Alexa: *"Lista de casa aberta. O que deseja fazer?"*
3. Você: *"Adiciona banana."*
4. Alexa: *"Banana adicionada. Mais algum item?"*

---

## 💡 Dica: Atalhos com Rotinas

Para evitar falar o nome completo da invocação toda vez:
1. Abra o app da Alexa no celular.
2. Vá em **Mais** > **Rotinas** > **+**.
3. Quando você disser: *"Alexa, o que falta comprar?"*
4. Ação -> Personalizado -> *"Alexa, pergunte para a lista de casa o que tem na lista"*.
