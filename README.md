# 🛒 Bora Mercado JuRogerPi — Alexa Skill em Node.js & Google Sheets (com IA Gemini 3.6 Flash)

Skill customizada para a Amazon Alexa (hospedada em **Node.js**) integrada a uma planilha do **Google Sheets** chamada **`Bora Mercado`** via **Google Apps Script** e inteligência artificial **Gemini 3.6 Flash**. 

A segurança e restrição de acesso são controladas **estritamente pela Whitelist do Beta Test da Amazon Alexa**, permitindo acesso direto e sem atritos para os membros convidados.

- **Repositório GitHub**: `https://github.com/rogeriopradoj/skill-alexa-bora-mercado-jurogerpi`
- **Caminho da Pasta Local**: `~/contribs/skill-alexa-bora-mercado-jurogerpi`

---

## 🏗️ Arquitetura do Sistema

```text
[ Echo Spot / Echo Dot / App Alexa ]
                │ (Comandos de Voz: "anota leite", "dá baixa no leite", "o que falta")
                ▼
      [ Alexa Custom Skill ]
      └─ Host: AWS Lambda (Node.js - Locale pt-BR)
      └─ Invocation Name: bora mercado jurogerpi
      └─ Configuração Privada: config.json (Apenas GOOGLE_SCRIPT_URL)
                │
                ▼ (HTTP GET JSON com tratamento de HTTP 302 Redirect)
     [ Google Apps Script ]
      └─ Inteligência Artificial: Gemini 3.6 Flash (100% Gratuito no Google AI Studio)
      └─ Implantação: Web App (Executar como 'Eu', Acesso 'Qualquer pessoa')
                │
                ▼
       [ Google Sheets: "Bora Mercado" ]
       ├─ Aba 1: "Itens" (4 Colunas: Item, Data Inclusão, Quem Incluiu, User ID Alexa)
       └─ Aba 2: "Historico_Removidos" (7 Colunas de Auditoria Total)
```

---

## 🚀 Como Usar no Dia a Dia

1. **Abrir a Skill**: *"Alexa, abra o **bora mercado jurogerpi**"*
2. **Anotar Item**: *"Alexa, peça pro **bora mercado jurogerpi** anotar leite"*
3. **Dar Baixa / Riscar**: *"Alexa, peça pro **bora mercado jurogerpi** dar baixa no leite"* (ou *"comprei a comida do bicho"*)
4. **Consultar**: *"Alexa, pergunte pro **bora mercado jurogerpi** o que falta"*
