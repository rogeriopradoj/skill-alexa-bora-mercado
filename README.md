# 🛒 Bora Mercado JuRogerPi — Alexa Skill em Python & Google Sheets

Skill customizada para a Amazon Alexa (hospedada em **Python**) integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script**. Permite que você e sua família compartilhem a mesma lista de compras com comandos de voz super naturais em **Português (Brasil)**, cadastro automático de membros da família via código PIN e governança completa.

---

## 🏗️ Arquitetura do Sistema

```text
[ Echo Spot / Echo Dot / App Alexa ]
                │ (Comandos por Voz: "anota leite", "dá baixa no leite", "o que falta")
                │ (Cadastro: "cadastrar código 1234")
                ▼
      [ Alexa Custom Skill ]
      └─ Host: AWS Lambda (Python 3.x - Locale pt-BR)
      └─ Invocation Name: bora mercado jurogerpi
      └─ Configuração Privada: config.json (Apenas GOOGLE_SCRIPT_URL)
                │
                ▼ (HTTP GET JSON com tratamento de HTTP 302 Redirect)
     [ Google Apps Script ]
      └─ Configuração do Script: FAMILY_PIN (Propriedade do Script no Google)
      └─ Implantação: Web App (Executar como 'Eu', Acesso 'Qualquer pessoa')
                │
                ▼
       [ Google Sheets: "Bora Mercado" ]
       ├─ Aba 1: "Itens" (Lista com Status ATIVO/REMOVIDO e Usuários)
       ├─ Aba 2: "Historico_Removidos" (Trilha de Auditoria de Apagamentos)
       └─ Aba 3: "Usuarios_Autorizados" (Cadastro Automático por PIN)
```

---

## 📁 Estrutura do Repositório

```text
skill-alexa-bora-mercado/
├── README.md                           # Documentação completa de arquitetura, setup e uso
├── PRIVACY_POLICY.md                   # Política de Privacidade oficial
├── TERMS_OF_USE.md                     # Termos de Uso oficial
├── .gitignore                          # Proteção Git (ignora config.json, etc)
├── assets/
│   ├── icon_108.png                    # Small Skill Icon (108x108 px)
│   └── icon_512.png                    # Large Skill Icon (512x512 px)
├── google-apps-script/
│   └── Code.gs                         # Backend do Apps Script (PIN, abas e logs)
└── alexa-skill/
    ├── skill.json                      # Manifest da Skill (Bora Mercado JuRogerPi)
    ├── interactionModels/
    │   └── custom/
    │       └── pt-BR.json              # Modelo de interação (invocationName: bora mercado jurogerpi)
    └── lambda/
        ├── lambda_function.py          # Handler Python principal da Alexa (Python 3.x)
        ├── requirements.txt            # Dependências Python (ask-sdk-core)
        ├── config.example.json         # Modelo de configuração público para o Git
        └── config.json                 # Arquivo de segredos privado (IGNORADO PELO GIT)
```

---

## 🚀 Passo a Passo Completo de Instalação e Configuração

### 1. Criar a Skill em Python no Alexa Developer Console

1. Acesse o [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask).
2. Clique em **Create Skill**:
   - **Skill name**: `Bora Mercado JuRogerPi`
   - **Primary locale**: `Portuguese (BR)`
   - **Experience**: `Custom`
   - **Hosting resource**: **`Alexa-hosted (Python)`**
3. Selecione **Start from Scratch** e clique em **Create Skill**.

---

### 2. Configurar o Código em Python e Modelo de Voz

1. **Modelo de Interação (pt-BR.json)**:
   - No menu da esquerda, vá em **Interaction Model** > **JSON Editor**.
   - Cole o conteúdo do arquivo [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json).
   - Clique em **Save Model** e em **Build Model**.
2. **Código Lambda (`lambda_function.py`)**:
   - Na aba **Code**, cole o conteúdo de [`alexa-skill/lambda/lambda_function.py`](./alexa-skill/lambda/lambda_function.py) no arquivo `lambda_function.py`.
   - No arquivo `requirements.txt`, garanta que esteja escrito `ask-sdk-core>=1.13.0`.
3. **Arquivo Privado `config.json`**:
   - Na aba **Code**, clique em **New File** abaixo da pasta `lambda` e nomeie como **`config.json`**:
     ```json
     {
       "GOOGLE_SCRIPT_URL": "https://script.google.com/macros/s/SUA_URL_REAL/exec"
     }
     ```
   - Clique em **Save** e em **Deploy**.

---

## 🗣️ Comandos de Voz Recomendados (pt-BR)

- **Abrir a Skill**: *"Alexa, abra o **bora mercado jurogerpi**"*
- **Cadastrar Membro**: *"Alexa, cadastrar código 1234"*
- **Anotar Item**: *"Alexa, peça pro **bora mercado jurogerpi** anotar leite"*
- **Dar Baixa**: *"Alexa, peça pro **bora mercado jurogerpi** dar baixa no leite"*
- **Consultar**: *"Alexa, pergunte pro **bora mercado jurogerpi** o que falta"*
