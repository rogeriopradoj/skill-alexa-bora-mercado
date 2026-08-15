# 🛒 skill-alexa-bora-mercado (com Governança e Auditoria)

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script**. Permite gerenciar e auditar com precisão a lista de compras familiar.

---

## 🏛️ Governança e Estrutura de Abas na Planilha

O Google Apps Script gerencia automaticamente **duas abas** na sua planilha:

### Aba 1: `Itens` (Itens Ativos)
Registra todos os itens atualmente pendentes para compra.
- **Item**: Nome do produto (ex: *Leite*).
- **Data Inclusão**: Data e hora exatas da inclusão (`dd/mm/yyyy hh:mm:ss`).
- **Quem Incluiu**: Nome do usuário ou ID da conta Alexa (ex: *Rogério* ou *Esposa*).
- **User ID Alexa**: Identificador único da conta Amazon/Alexa.

### Aba 2: `Historico_Removidos` (Auditoria de Apagamentos)
Trilha de auditoria para onde os itens resolvidos/apagados são movidos automaticamente ao serem riscados.
- **Item**: Nome do produto removido.
- **Data Remoção**: Data e hora exatas em que o item foi riscado.
- **Quem Apagou**: Usuário/Conta que solicitou a remoção.
- **Data Inclusão**: Data original em que o item tinha sido inserido.
- **Quem Incluiu**: Usuário original que havia adicionado o item.

---

## 👥 Como Mapear os Nomes ("Rogério" e "Esposa")

No arquivo `alexa-skill/lambda/index.js`, existe o objeto `USER_MAP`:

```javascript
const USER_MAP = {
   'amzn1.ask.account.AG123...': 'Rogério',
   'amzn1.ask.account.AG456...': 'Esposa'
};
```

1. Quando você ou sua esposa usarem a Skill pela primeira vez, o código gravará o `User ID` completo na Coluna D da aba `Itens`.
2. Basta copiar o `User ID` da sua conta e da conta dela da planilha e colar no `USER_MAP` no `index.js`.
3. A partir disso, a planilha mostrará os nomes amigáveis (**Rogério** e **Esposa**) nas colunas de governança!

---

## 📁 Estrutura do Repositório

```text
skill-alexa-bora-mercado/
├── README.md                           # Este guia de governança e configuração
├── .gitignore
├── assets/
│   ├── icon_108.png
│   └── icon_512.png
├── google-apps-script/
│   └── Code.gs                         # Backend Apps Script (com suporte a abas e auditoria)
└── alexa-skill/
    ├── skill.json
    ├── interactionModels/
    │   └── custom/
    │       └── pt-BR.json
    └── lambda/
        ├── index.js                    # Lambda Handler com extração de User ID Alexa
        └── package.json
```
