# 🛒 skill-alexa-lista-de-casa (Bora pro Mercado)

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** via **Google Apps Script**. Permite que você e sua esposa compartilhem a mesma lista de mercado usando o nome de invocação **`bora pro mercado`** com comandos super naturais.

---

## 🏗️ Arquitetura do Projeto

```text
[ Echo da Esposa ]  \
                     --> [ Alexa Custom Skill ] --> [ Google Apps Script ] --> [ Google Sheets ]
[ Sua Echo ]        /    (Invocation: bora pro mercado) (API REST WebApp)   (Planilha Compartilhada)
```

---

## 🗣️ Comandos de Voz Super Naturais (Nome de Invocação: `bora pro mercado`)

Evitamos os termos gravados *"lista"*, *"compras"* e *"adicionar item"* que acionavam a lista nativa da Amazon. Agora você usa verbos curtos do dia a dia:

### Para Anotar (Adicionar):
- *"Alexa, peça pro **bora pro mercado** anotar leite."*
- *"Alexa, peça pro **bora pro mercado** botar pão."*
- *"Alexa, fala pro **bora pro mercado** colocar café."*
- *"Alexa, pede pro **bora pro mercado** incluir detergente."*

### Para Consultar:
- *"Alexa, pergunte pro **bora pro mercado** o que falta."*
- *"Alexa, pergunte pro **bora pro mercado** o que precisamos."*
- *"Alexa, pede pro **bora pro mercado** ver o que tem para comprar."*

### Para Riscar (Remover):
- *"Alexa, peça pro **bora pro mercado** riscar o leite."*
- *"Alexa, fala pro **bora pro mercado** tirar o pão."*
- *"Alexa, peça pro **bora pro mercado** apagar o café."*

---

## 🚀 Passo a Passo de Atualização no Console da Alexa

1. No [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask), acesse sua Skill.
2. Em **Interaction Model** > **JSON Editor**:
   - Copie o conteúdo do arquivo [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json).
   - Cole no editor e clique em **Save Model** e **Build Model**.
3. Na aba **Code**:
   - Copie o conteúdo do arquivo [`alexa-skill/lambda/index.js`](./alexa-skill/lambda/index.js) (lembre-se de manter sua URL do Apps Script na constante `GOOGLE_SCRIPT_URL`).
   - Clique em **Save** e **Deploy**.

---

## 💡 Dica de Ouro: Atalhos com Rotinas da Alexa

Se você quiser falar frases ainda menores (ex: *"Alexa, anota leite"*):
1. Abra o app da Alexa no celular (**Mais** > **Rotinas** > **+**).
2. **Quando:** Você diz: *"Alexa, anota leite"*
3. **Ação:** Personalizado -> *"Alexa, peça pro bora pro mercado anotar leite"*.
