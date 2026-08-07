# 🛒 skill-alexa-lista-de-casa (Relação Mercado)

Skill customizada para a Amazon Alexa integrada a uma planilha do **Google Sheets** via **Google Apps Script**. Permite que contas da Alexa em perfis Amazon diferentes (ex: você e sua esposa no Brasil) compartilhem e gerenciem a mesma lista/relação de compras usando o nome de invocação **`relação mercado`**.

---

## 🏗️ Arquitetura do Projeto

```text
[ Echo da Esposa ]  \
                     --> [ Alexa Custom Skill ] --> [ Google Apps Script ] --> [ Google Sheets ]
[ Sua Echo ]        /    (Invocation: relação mercado) (API REST WebApp)   (Planilha Compartilhada)
```

---

## 🚀 Passo a Passo de Atualização no Console da Alexa

Como alteramos o nome de invocação para **`relação mercado`**:

1. No [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask), acesse sua Skill.
2. Vá em **Interaction Model** > **JSON Editor**:
   - Copie o conteúdo do arquivo [`alexa-skill/interactionModels/custom/pt-BR.json`](./alexa-skill/interactionModels/custom/pt-BR.json).
   - Cole no editor e clique em **Save Model** e em seguida **Build Model**.
3. Vá na aba **Code**:
   - Atualize o arquivo `index.js` com o conteúdo de [`alexa-skill/lambda/index.js`](./alexa-skill/lambda/index.js) (lembre-se de manter sua URL do Google Apps Script na constante `GOOGLE_SCRIPT_URL`).
   - Clique em **Save** e **Deploy**.

---

## 🗣️ Como Usar no Dia a Dia (Nome de Invocação: `relação mercado`)

Usamos **"relação mercado"** para evitar que a Alexa confunda com as palavras reservadas *"lista"* e *"compras"* do sistema nativo da Amazon.

### Comandos em Etapa Única (One-Shot):
- *"Alexa, peça para a **relação mercado** adicionar leite."*
- *"Alexa, mande a **relação mercado** incluir café."*
- *"Alexa, pergunte para a **relação mercado** o que tem."*
- *"Alexa, peça para a **relação mercado** remover o queijo."*

### Modo Conversação:
1. Você diz: *"Alexa, abra a **relação mercado**."*
2. Alexa: *"Bem-vindo à Relação Mercado! O que deseja fazer?"*
3. Você: *"Adiciona banana."*
4. Alexa: *"Banana foi adicionado à relação. Quer adicionar mais algum item?"*

---

## 💡 Dica: Atalhos com Rotinas da Alexa

Para falar frases ainda menores (ex: *"Alexa, o que falta?"*):
1. Abra o app da Alexa no celular (**Mais** > **Rotinas** > **+**).
2. **Quando:** Você diz: *"Alexa, o que falta?"*
3. **Ação:** Personalizado -> *"Alexa, pergunte para a relação mercado o que tem"*.
