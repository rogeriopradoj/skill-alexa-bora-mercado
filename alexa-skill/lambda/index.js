const Alexa = require('ask-sdk-core');
const https = require('https');

let config = { GOOGLE_SCRIPT_URL: '' };
try { config = require('./config.json'); } catch (error) { console.log('config.json não encontrado.'); }
const GOOGLE_SCRIPT_URL = config.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || '';
const TIMEOUT_MS = 10000;

function getUserId(handlerInput) {
    return handlerInput.requestEnvelope?.session?.user?.userId || handlerInput.requestEnvelope?.context?.System?.user?.userId || '';
}

function getUserName(userId) {
    return `User_${userId ? userId.slice(-6) : 'Desconhecido'}`;
}

function callScript(action, item = '', user = '', userId = '') {
    if (!GOOGLE_SCRIPT_URL) return Promise.reject(new Error('GOOGLE_SCRIPT_URL não configurada no config.json.'));
    let initialUrl;
    try {
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.set('action', action);
        if (item) url.searchParams.set('item', item);
        if (user) url.searchParams.set('user', user);
        if (userId) url.searchParams.set('userId', userId);
        initialUrl = url.toString();
    } catch (error) { return Promise.reject(new Error(`GOOGLE_SCRIPT_URL inválida: ${error.message}`)); }

    return new Promise((resolve, reject) => {
        const fetchUrl = (targetUrl, redirects = 0) => {
            const request = https.get(targetUrl, (response) => {
                const status = response.statusCode || 0;
                if ([301, 302, 303, 307, 308].includes(status)) {
                    const location = response.headers.location;
                    response.resume();
                    if (!location) return reject(new Error(`Redirecionamento HTTP ${status} sem destino.`));
                    if (redirects >= 5) return reject(new Error('Muitos redirecionamentos.'));
                    try { return fetchUrl(new URL(location, targetUrl).toString(), redirects + 1); }
                    catch (error) { return reject(error); }
                }
                if (status < 200 || status >= 300) { response.resume(); return reject(new Error(`HTTP ${status}.`)); }
                let data = '';
                response.setEncoding('utf8');
                response.on('data', chunk => { data += chunk; });
                response.on('end', () => {
                    try { resolve(JSON.parse(data.replace(/^\uFEFF/, ''))); }
                    catch (error) { reject(new Error(`Resposta inválida do Apps Script: ${error.message}`)); }
                });
            });
            request.setTimeout(TIMEOUT_MS, () => request.destroy(new Error('Tempo de conexão esgotado.')));
            request.on('error', reject);
        };
        fetchUrl(initialUrl);
    });
}

const LaunchRequestHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'LaunchRequest'; },
    handle(i) {
        return i.responseBuilder
            .speak(`Bora Mercado JuRogerPi! Você pode dizer anota leite, dá baixa no leite, ou perguntar o que falta.`)
            .reprompt('O que você quer fazer?')
            .getResponse();
    }
};

const NavigateHomeIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.NavigateHomeIntent'; },
    handle(i) { return LaunchRequestHandler.handle(i); }
};

const AdicionarItemIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AdicionarItemIntent'; },
    async handle(i) {
        const userId = getUserId(i);
        const userName = getUserName(userId);
        const rawItem = Alexa.getSlotValue(i.requestEnvelope, 'item');
        const item = rawItem !== undefined && rawItem !== null ? String(rawItem).trim() : '';
        if (!item) return i.responseBuilder.speak('Não entendi qual item você quer anotar.').reprompt('Qual item?').getResponse();
        try {
            const result = await callScript('add', item, userName, userId);
            return i.responseBuilder.speak(result.success ? `Anotado: ${item}.` : `Não consegui anotar ${item}.`).reprompt('Quer anotar mais alguma coisa?').getResponse();
        } catch (error) { console.error('Erro ao adicionar:', error); return i.responseBuilder.speak('Não consegui acessar a planilha agora.').getResponse(); }
    }
};

const RemoverItemIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'RemoverItemIntent'; },
    async handle(i) {
        const userId = getUserId(i);
        const userName = getUserName(userId);
        const rawItem = Alexa.getSlotValue(i.requestEnvelope, 'item');
        const item = rawItem !== undefined && rawItem !== null ? String(rawItem).trim() : '';
        if (!item) return i.responseBuilder.speak('Não entendi qual item você quer marcar como comprado.').reprompt('Qual item?').getResponse();
        try {
            const result = await callScript('remove', item, userName, userId);
            return i.responseBuilder.speak(result.success ? `Pronto, dei baixa em ${item}.` : `Não encontrei ${item} na lista atual.`).getResponse();
        } catch (error) { console.error('Erro ao remover:', error); return i.responseBuilder.speak('Não consegui acessar a planilha agora.').getResponse(); }
    }
};

const ListarItensIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'ListarItensIntent'; },
    async handle(i) {
        try {
            const result = await callScript('list');
            const items = Array.isArray(result.items) ? result.items : [];
            return i.responseBuilder.speak(items.length ? `Tá faltando: ${items.join(', ')}.` : 'Não tá faltando nada. A lista está vazia.').getResponse();
        } catch (error) { console.error('Erro ao listar:', error); return i.responseBuilder.speak('Não consegui consultar a lista agora.').getResponse(); }
    }
};

const HelpIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.HelpIntent'; },
    handle(i) {
        const text = 'Você pode dizer anota leite, dá baixa no leite, ou perguntar o que falta.';
        return i.responseBuilder.speak(text).reprompt(text).getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && ['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(Alexa.getIntentName(i.requestEnvelope)); },
    handle(i) { return i.responseBuilder.speak('Até mais.').getResponse(); }
};

const FallbackIntentHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.FallbackIntent'; },
    handle(i) { return i.responseBuilder.speak('Não entendi. Diga anota leite, dá baixa no leite, ou o que falta.').reprompt('O que você quer fazer?').getResponse(); }
};

const SessionEndedRequestHandler = {
    canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'SessionEndedRequest'; },
    handle(i) { return i.responseBuilder.getResponse(); }
};

const ErrorHandler = {
    canHandle() { return true; },
    handle(i, error) {
        console.error('Erro capturado:', error);
        return i.responseBuilder.speak('Ocorreu um erro ao processar seu pedido. Tente novamente.').reprompt('Tente novamente.').getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        NavigateHomeIntentHandler,
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
