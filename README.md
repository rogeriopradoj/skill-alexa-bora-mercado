# 🛒 skill-alexa-bora-mercado (Suporte Multilíngue: pt-BR e en-US)

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script**. Permite gerenciar e auditar a lista de compras familiar, suportando dispositivos configurados em **Português (Brasil)** e **Inglês (US)**.

---

## 🌎 Suporte Multilíngue (Como ativar o Inglês / en-US)

Se a sua Alexa ou a da sua esposa estiver configurada em **Inglês (US)** ou em modo bilíngue:

1. No **Alexa Developer Console**, no topo da página (ao lado do nome da Skill), clique no seletor de idioma onde diz `Portuguese (BR)`.
2. Clique em **Language Settings** (ou **Add Locale**).
3. Adicione o idioma **`English (US)`**.
4. No menu da esquerda, mude o seletor para `English (US)` > **Interaction Model** > **JSON Editor**.
5. Cole o conteúdo do arquivo [`alexa-skill/interactionModels/custom/en-US.json`](./alexa-skill/interactionModels/custom/en-US.json).
6. Clique em **Save Model** e em seguida **Build Model**.

---

## 🏛️ Governança e Estrutura de Abas na Planilha

O Google Apps Script gerencia automaticamente **duas abas** na sua planilha:

- **`Itens`**: [Item, Data Inclusão, Quem Incluiu, User ID Alexa]
- **`Historico_Removidos`**: [Item, Data Remoção, Quem Apagou, Data Inclusão, Quem Incluiu]

---

## 📁 Estrutura do Repositório

```text
skill-alexa-bora-mercado/
├── README.md
├── .gitignore
├── assets/
│   ├── icon_108.png
│   └── icon_512.png
├── google-apps-script/
│   └── Code.gs
└── alexa-skill/
    ├── skill.json
    ├── interactionModels/
    │   └── custom/
    │       ├── pt-BR.json              # Modelo em Português
    │       └── en-US.json              # Modelo em Inglês
    └── lambda/
        ├── index.js
        └── package.json
```
