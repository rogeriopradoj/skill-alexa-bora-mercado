# 🛒 Bora Mercado — Alexa Skill & Google Sheets (com Governança e Segurança Privada)

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script**. Permite que você e sua família compartilhem a mesma lista de compras com comandos de voz super naturais em **Português (Brasil)**, auditoria de inclusão/remoção e restrição de acesso por Whitelist de segurança.

---

## 🏗️ Arquitetura do Sistema

```text
[ Echo Spot / Echo Dot / App Alexa ]
                │ (Comandos por Voz: "anota leite", "risca pão", "o que falta")
                ▼
      [ Alexa Custom Skill ]
      └─ Host: AWS Lambda (Node.js - Locale pt-BR)
      └─ Configuração Privada: config.json (Segredos e Whitelist)
                │
                ▼ (HTTP GET JSON com tratamento de HTTP 302 Redirect)
     [ Google Apps Script ]
      └─ Implantação: Web App (Executar como 'Eu', Acesso 'Qualquer pessoa')
                │
                ▼
       [ Google Sheets: "Bora Mercado" ]
       ├─ Aba 1: "Itens" (Lista ativa com Data e Usuário)
       └─ Aba 2: "Historico_Removidos" (Trilha de Auditoria de Apagamentos)
```

---

## 📁 Estrutura do Repositório

```text
skill-alexa-bora-mercado/
├── README.md                           # Documentação completa de arquitetura, setup e uso
├── PRIVACY_POLICY.md                   # Política de Privacidade oficial (para certificação Amazon)
├── TERMS_OF_USE.md                     # Termos de Uso oficial (para certificação Amazon)
├── .gitignore                          # Proteção Git (ignora config.json, node_modules, etc)
├── assets/
│   ├── icon_108.png                    # Small Skill Icon (108x108 px com margem de 16px)
│   └── icon_512.png                    # Large Skill Icon (512x512 px com margem de 75px)
├── google-apps-script/
│   └── Code.gs                         # Backend do Apps Script (criação automática de abas e log)
└── alexa-skill/
    ├── skill.json                      # Manifest da Skill (locale pt-BR)
    ├── interactionModels/
    │   └── custom/
    │       └── pt-BR.json              # Modelo de interação em Português (Brasil)
    └── lambda/
        ├── index.js                    # Handler Node.js principal da Alexa
        ├── package.json                # Dependências Node.js (ask-sdk-core)
        ├── config.example.json         # Modelo de configuração seguro para o Git público
        └── config.json                 # Arquivo de segredos privado (IGNORADO PELO GIT)
```

---

## 🚀 Passo a Passo Completo de Instalação e Configuração

### 1. Configurar o Google Sheets & Apps Script

1. Crie uma planilha no Google Drive com o nome exato **`Bora Mercado`**.
2. Compartilhe a planilha com o e-mail dos membros da família (permissão de **Editor**).
3. No menu superior da planilha, vá em **Extensões** > **Apps Script**.
4. Copie o conteúdo do arquivo [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) e cole no editor.
5. Clique em **Implantar** (Deploy) > **Nova implantação** (New Deployment).
   - **Tipo**: App da Web (Web App)
   - **Descrição**: `API Bora Mercado`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem tem acesso**: `Qualquer pessoa` (Anyone)
6. Clique em **Implantar**, autorize o acesso e **copie a URL do Web App gerada** (`https://script.google.com/macros/s/.../exec`).

---

### 2. Configurar a Skill no Alexa Developer Console

1. Acesse o [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
2. Clique em **Create Skill**:
   - **Skill name**: `Bora Mercado`
   - **Primary locale**: `Portuguese (BR)`
   - **Experience**: `Custom`
   - **Hosting resource**: `Alexa-hosted (Node.js)`
3. **Importar Modelo de Interação (pt-BR)**:
   - No menu da esquerda, selecione `Portuguese (BR)` > **Interaction Model** > **JSON Editor**.
   - Cole o conteúdo do arquivo [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json).
   - Clique em **Save Model** e em **Build Model**.
4. **Código Lambda**:
   - Na aba **Code**, cole o conteúdo de [`alexa-skill/lambda/index.js`](./alexa-skill/lambda/index.js) no arquivo `index.js`.
5. **Configurar o Arquivo Privado `config.json`**:
   - Na aba **Code**, no menu lateral esquerdo abaixo de `lambda`, clique em **New File**.
   - Nomeie o arquivo como **`config.json`**.
   - **Fase 1 (Descoberta dos User IDs)**: Cole a sua URL do Apps Script mantendo a whitelist vazia:
     ```json
     {
       "GOOGLE_SCRIPT_URL": "https://script.google.com/macros/s/SUA_URL_REAL/exec",
       "ALLOWED_USERS": {}
     }
     ```
   - Clique em **Save** e em **Deploy**.
6. **Upload de Ícones e Preenchimento de Distribuição**:
   - Vá na aba **Distribution** > **Primary Details**:
     - Arraste [`assets/icon_108.png`](./assets/icon_108.png) no campo Small Skill Icon.
     - Arraste [`assets/icon_512.png`](./assets/icon_512.png) no campo Large Skill Icon.
     - Em **Example Phrases**, preencha exatamente:
       1. `Alexa, abra o bora mercado`
       2. `Alexa, inicie o bora mercado`
       3. `Alexa, abra bora mercado`
     - Preencha os campos **Privacy Policy URL** e **Terms of Use URL** com os links do seu GitHub:
       - `https://raw.githubusercontent.com/SEU_USUARIO/skill-alexa-bora-mercado/refs/heads/main/PRIVACY_POLICY.md`
       - `https://raw.githubusercontent.com/SEU_USUARIO/skill-alexa-bora-mercado/refs/heads/main/TERMS_OF_USE.md`

---

### 3. Fase 2: Ativar a Whitelist de Segurança e Governança

1. Com a Skill em Fase 1 (vazia), faça um teste na sua Alexa e peça para sua esposa falar um comando no celular/Echo dela:
   - *"Alexa, peça pro bora mercado anotar leite"*
2. Abra a planilha **`Bora Mercado`** no Google Sheets.
3. Observe a **Coluna D** (`User ID Alexa`) da aba `Itens`. Os códigos longos da Amazon de você e da sua esposa estarão gravados lá.
4. Volte na aba **Code** da Alexa no arquivo **`config.json`** e atualize para o formato final com os IDs capturados:
   ```json
   {
     "GOOGLE_SCRIPT_URL": "https://script.google.com/macros/s/SUA_URL_REAL/exec",
     "ALLOWED_USERS": {
       "amzn1.ask.account.SEU_ID_GERADO_NA_COLUNA_D...": "Rogério",
       "amzn1.ask.account.ID_DA_ESPOSA_GERADO_NA_COLUNA_D...": "Esposa"
     }
   }
   ```
5. Clique em **Save** e em **Deploy**.

---

### 4. Publicação Oficial na Loja da Alexa (Certification)

1. No console da Alexa, vá na aba **Certification** > **Validation**. Clique em **Run Validation**.
2. Vá em **Certification** > **Submission** e clique em **Submit for Certification**.
3. Em 24 a 48 horas a Amazon aprovará a publicação.

---

## 🗣️ Comandos de Voz Recomendados (pt-BR)

| Ação | Comando de Voz | Resposta da Alexa |
| :--- | :--- | :--- |
| **Anotar (Adicionar)** | *"Alexa, peça pro **bora mercado** anotar leite"* | *"Anotado leite!"* |
| **Anotar (Sinônimos)** | *"Alexa, peça pro **bora mercado** botar/colocar pão"* | *"Anotado pão!"* |
| **Consultar** | *"Alexa, pergunte pro **bora mercado** o que falta"* | *"Tá faltando: leite, pão."* |
| **Riscar (Remover)** | *"Alexa, peça pro **bora mercado** riscar o leite"* | *"Riscado leite."* |

---

## 💡 Dica: Atalhos com Rotinas da Alexa

Para não precisar falar *"peça pro bora mercado..."* toda vez:
1. Abra o app da Alexa no celular (**Mais** > **Rotinas** > **+**).
2. **Quando:** Você diz: *"Alexa, anota leite"*
3. **Ação:** Personalizado -> *"Alexa, peça pro bora mercado anotar leite"*.
