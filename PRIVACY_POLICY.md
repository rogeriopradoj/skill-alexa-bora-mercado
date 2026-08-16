# Política de Privacidade — Alexa Skill "Bora Mercado"

**Última atualização:** 16 de Agosto de 2026

Esta Política de Privacidade descreve como a Skill para Amazon Alexa **"Bora Mercado"** lida com suas informações e garante a sua privacidade ao utilizar nosso serviço.

---

## 1. Coleta de Informações Pessoais

A Skill **Bora Mercado**:
- **NÃO** solicita, lê ou armazena dados de identificação pessoal do usuário (como nome completo, endereço de e-mail, número de telefone, localização física ou dados bancários).
- **NÃO** realiza cobranças, compras no aplicativo ou transações financeiras.
- **NÃO** compartilha ou vende qualquer informação para terceiros ou redes de publicidade.

---

## 2. Uso de Dados e Funcionamento

Para oferecer a funcionalidade de gerenciamento de lista de mercado compartilhada em família, a Skill processa apenas:

1. **Comandos de Voz**: Os itens informados por voz (ex: *"leite"*, *"café"*) são processados estritamente para adicionar, listar ou remover itens da planilha do Google Sheets vinculada e mantida pelo próprio usuário.
2. **Identificador Anônimo de Usuário da Alexa (`userId`)**: O identificador alfanumérico anônimo gerado pela Amazon Alexa é utilizado exclusivamente no servidor Lambda para controle de acesso privado (governança) e auditoria interna da lista de compras da família.

---

## 3. Armazenamento de Dados

Todos os itens da lista são armazenados exclusivamente na planilha do **Google Sheets** configurada e pertencente ao usuário. A Skill atua como um intermediário técnico via integração direta e segura (Google Apps Script).

---

## 4. Retenção e Exclusão de Dados

- Os itens adicionados permanecem na planilha ativa do usuário até que o próprio usuário solicite a remoção por comando de voz ou edite a planilha manualmente.
- Ao desativar a Skill na sua conta Amazon, nenhuma requisição adicional será processada.

---

## 5. Alterações nesta Política

Esta Política de Privacidade pode ser atualizada ocasionalmente para refletir melhorias no serviço. A versão mais recente estará sempre disponível publicamente neste repositório.

---

## 6. Contato e Suporte

Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o funcionamento da Skill **Bora Mercado**, entre em contato através do repositório oficial do projeto no GitHub.
