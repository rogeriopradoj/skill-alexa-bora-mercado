const Alexa = require('ask-sdk-core');
const https = require('https');

// ======================================================================================
// CONFIGURE AQUI A URL DO SEU GOOGLE APPS SCRIPT
// Exemplo: 'https://script.google.com/macros/s/AKfycb.../exec'
// ======================================================================================
const GOOGLE_SCRIPT_URL = 'COLE_AQUI_A_SUA_URL_DO_GOOGLE_APPS_SCRIPT';

/**
 * Função utilitária para fazer chamadas HTTP GET ao Google Apps Script.
 * Trata automaticamente o redirecionamento HTTP 302 que o Apps Script utiliza.
 */
function callScript(action, item = '') {
    return new Promise((resolve, reject) => {
        let url = `${GOOGLE_SCRIPT_URL}?action=${action}`;
        if (item) {
            url += `&item=${encodeURIComponent(item)}`;
        }

        const fetchUrl = (targetUrl) => {
            https.get(targetUrl, (res) => {
                // Redirecionamento nativo do Google Apps Script
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

// 1. LaunchRequest Handler (Quando você diz: "Alexa, abra a lista de casa")
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bem-vindo à Lista de Casa! Você pode pedir para adicionar um item, remover um item ou listar o que falta comprar.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que deseja fazer na sua lista de compras?')
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

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não consegui entender qual item você deseja adicionar. Pode repetir?')
                .reprompt('Qual item você quer adicionar à lista?')
                .getResponse();
        }

        try {
            await callScript('add', item);
            const speakOutput = `${item} foi adicionado à lista de casa.`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Quer adicionar mais algum item?')
                .getResponse();
        } catch (error) {
            console.error('Erro no AdicionarItemIntent:', error);
            return handlerInput.responseBuilder
                .speak(`Tive um problema ao conectar com a planilha para adicionar ${item}. Tente novamente em instantes.`)
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

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não entendi qual item você quer remover. Pode me dizer o nome do item?')
                .reprompt('Qual item deseja remover?')
                .getResponse();
        }

        try {
            const res = await callScript('remove', item);
            let speakOutput = '';
            if (res.success) {
                speakOutput = `${item} foi removido da lista de casa.`;
            } else {
                speakOutput = `Não encontrei o item ${item} na sua lista de compras.`;
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Deseja alterar mais alguma coisa?')
                .getResponse();
        } catch (error) {
            console.error('Erro no RemoverItemIntent:', error);
            return handlerInput.responseBuilder
                .speak(`Tive um problema ao comunicar com a planilha ao tentar remover ${item}.`)
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
                speakOutput = `A sua lista de casa tem ${res.items.length} ${res.items.length === 1 ? 'item' : 'itens'}: ${listaFormatada}.`;
            } else {
                speakOutput = 'A sua lista de compras está vazia no momento.';
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } catch (error) {
            console.error('Erro no ListarItensIntent:', error);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui consultar a lista no Google Sheets no momento.')
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
        const speakOutput = 'Você pode me pedir para adicionar leite na lista, perguntar o que tem na lista ou remover um item. Como posso ajudar?';
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
        const speakOutput = 'Até logo!';
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
        const speakOutput = 'Desculpe, não entendi esse comando. Tente pedir para adicionar um item ou consultar a lista de compras.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Como posso ajudar com a sua lista?')
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
