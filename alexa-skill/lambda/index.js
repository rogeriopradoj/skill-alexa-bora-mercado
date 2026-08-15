const Alexa = require('ask-sdk-core');
const https = require('https');

// ======================================================================================
// CONFIGURE AQUI A URL DO SEU GOOGLE APPS SCRIPT
// Exemplo: 'https://script.google.com/macros/s/AKfycb.../exec'
// ======================================================================================
const GOOGLE_SCRIPT_URL = 'COLE_AQUI_A_SUA_URL_DO_GOOGLE_APPS_SCRIPT';

// ======================================================================================
// MAPEAMENTO DE NOMES AMIGÁVEIS (GOVERNANÇA)
// Para descobrir o seu userId da Alexa, faça um teste na skill.
// O User ID será gravado na planilha do Google Sheets, depois você pode colar aqui!
// Exemplo:
// const USER_MAP = {
//    'amzn1.ask.account.AG123...': 'Rogério',
//    'amzn1.ask.account.AG456...': 'Esposa'
// };
// ======================================================================================
const USER_MAP = {};

/**
 * Utilitário para extrair as informações de identificação do Usuário da Alexa.
 */
function getUserInfo(handlerInput) {
    const userId = handlerInput.requestEnvelope?.session?.user?.userId 
                || handlerInput.requestEnvelope?.context?.System?.user?.userId 
                || '';

    const mappedName = USER_MAP[userId];
    if (mappedName) {
        return { user: mappedName, userId: userId };
    }

    // Se ainda não foi mapeado, utiliza os últimos 6 caracteres do ID para identificar na planilha
    const shortId = userId ? userId.slice(-6) : 'Desconhecido';
    return { user: `User_${shortId}`, userId: userId };
}

/**
 * Função utilitária para fazer chamadas HTTP GET ao Google Apps Script.
 * Trata automaticamente o redirecionamento HTTP 302 do Apps Script.
 */
function callScript(action, item = '', user = '', userId = '') {
    return new Promise((resolve, reject) => {
        let url = `${GOOGLE_SCRIPT_URL}?action=${action}`;
        if (item) url += `&item=${encodeURIComponent(item)}`;
        if (user) url += `&user=${encodeURIComponent(user)}`;
        if (userId) url += `&userId=${encodeURIComponent(userId)}`;

        const fetchUrl = (targetUrl) => {
            https.get(targetUrl, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    if (res.headers.location) {
                        return fetchUrl(res.headers.location);
                    }
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (e) {
                        reject(new Error(`Erro ao parsear JSON da resposta: ${data}`));
                    }
                });
            }).on('error', (err) => reject(err));
        };

        fetchUrl(url);
    });
}

// 1. LaunchRequest Handler
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const { user } = getUserInfo(handlerInput);
        const speakOutput = `Bora mercado, ${user}! Você pode pedir para anotar um item, riscar um item ou perguntar o que falta.`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que quer anotar ou consultar?')
            .getResponse();
    }
};

// 2. AdicionarItemIntent Handler
const AdicionarItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AdicionarItemIntent';
    },
    async handle(handlerInput) {
        const item = Alexa.getSlotValue(handlerInput.requestEnvelope, 'item');
        const { user, userId } = getUserInfo(handlerInput);

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não entendi qual item você quer anotar. Pode repetir?')
                .reprompt('Qual item você quer anotar?')
                .getResponse();
        }

        try {
            await callScript('add', item, user, userId);
            const speakOutput = `Anotado ${item}!`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Quer anotar mais alguma coisa?')
                .getResponse();
        } catch (error) {
            console.error('Erro no AdicionarItemIntent:', error);
            return handlerInput.responseBuilder
                .speak(`Tive um problema ao conectar com a planilha para anotar ${item}.`)
                .getResponse();
        }
    }
};

// 3. RemoverItemIntent Handler
const RemoverItemIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RemoverItemIntent';
    },
    async handle(handlerInput) {
        const item = Alexa.getSlotValue(handlerInput.requestEnvelope, 'item');
        const { user, userId } = getUserInfo(handlerInput);

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não entendi qual item você quer riscar. Pode me dizer o nome do item?')
                .reprompt('Qual item quer riscar?')
                .getResponse();
        }

        try {
            const res = await callScript('remove', item, user, userId);
            let speakOutput = '';
            if (res.success) {
                speakOutput = `Riscado ${item}.`;
            } else {
                speakOutput = `Não encontrei ${item} para riscar.`;
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Quer alterar mais alguma coisa?')
                .getResponse();
        } catch (error) {
            console.error('Erro no RemoverItemIntent:', error);
            return handlerInput.responseBuilder
                .speak(`Tive um problema ao comunicar com a planilha ao tentar riscar ${item}.`)
                .getResponse();
        }
    }
};

// 4. ListarItensIntent Handler
const ListarItensIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListarItensIntent';
    },
    async handle(handlerInput) {
        try {
            const res = await callScript('list');
            let speakOutput = '';

            if (res.items && res.items.length > 0) {
                const listaFormatada = res.items.join(', ');
                speakOutput = `Tá faltando: ${listaFormatada}.`;
            } else {
                speakOutput = 'Não tá faltando nada, a lista tá vazia!';
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Erro no ListarItensIntent:', error);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui consultar o Google Sheets no momento.')
                .getResponse();
        }
    }
};

// 5. HelpIntent Handler
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Você pode dizer "anota leite", "risca pão" ou "o que falta". Como posso ajudar?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// 6. CancelAndStopIntent Handler
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Até mais!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// 7. FallbackIntent Handler
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Desculpe, não entendi. Você pode dizer "anota leite" ou perguntar "o que falta".';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Como posso ajudar?')
            .getResponse();
    }
};

// 8. SessionEndedRequestHandler
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Sessão encerrada com o motivo: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// 9. ErrorHandler (Tratamento de exceções globais)
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`Erro capturado pelo Handler: ${error.stack}`);
        const speakOutput = 'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AdicionarItemIntentHandler,
        RemoverItemIntentHandler,
        ListarItensIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
