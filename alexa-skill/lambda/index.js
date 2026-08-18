const Alexa = require('ask-sdk-core');
const https = require('https');

let config = { GOOGLE_SCRIPT_URL: '' };
try { config = require('./config.json'); } catch (error) { console.log('config.json não encontrado.'); }
const GOOGLE_SCRIPT_URL = config.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || '';
const TIMEOUT_MS = 10000;

function getUserId(handlerInput) {
    return handlerInput.requestEnvelope?.session?.user?.userId || handlerInput.requestEnvelope?.context?.System?.user?.userId || '';
}

function getTemporaryName(userId) {
    return `User_${userId ? userId.slice(-6) : 'Desconhecido'}`;
}

function callScript(action, item = '', user = '', userId = '', code = '') {
    if (!GOOGLE_SCRIPT_URL) return Promise.reject(new Error('GOOGLE_SCRIPT_URL não configurada.'));
    let initialUrl;
    try {
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.set('action', action);
        if (item) url.searchParams.set('item', item);
        if (user) url.searchParams.set('user', user);
        if (userId) url.searchParams.set('userId', userId);
        if (code) url.searchParams.set('code', code);
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

async function checkAuthorization(handlerInput) {
    const userId = getUserId(handlerInput);
    if (!userId) return { isAuthorized: false, user: 'Não Autorizado', userId: '' };
    try {
        const result = await callScript('authorize', '', '', userId);
        return { isAuthorized: result.success === true, user: result.user || getTemporaryName(userId), userId };
    } catch (error) {
        console.error('Erro ao consultar autorização:', error);
        return { isAuthorized: false, user: getTemporaryName(userId), userId };
    }
}

function denied(handlerInput) {
    return handlerInput.responseBuilder.speak('Seu acesso ainda não está autorizado. Diga cadastrar código dois mil seiscentos e vinte e seis.').getResponse();
}

const RequestLogger = { process(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log('[ALEXA]', JSON.stringify({ requestType: request.type, intentName: request.intent?.name || null, slots: request.intent?.slots || {}, userIdFinal: getUserId(handlerInput).slice(-6) }));
} };

const LaunchRequestHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'LaunchRequest'; }, async handle(i) {
    const auth = await checkAuthorization(i);
    if (!auth.isAuthorized) return denied(i);
    return i.responseBuilder.speak(`Bora Mercado, ${auth.user}. Você pode dizer anota leite, dá baixa no leite, ou perguntar o que falta.`).reprompt('O que você quer fazer?').getResponse();
} };

const NavigateHomeIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.NavigateHomeIntent'; }, async handle(i) { return LaunchRequestHandler.handle(i); } };

const CadastrarUsuarioIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'CadastrarUsuarioIntent'; }, async handle(i) {
    const userId = getUserId(i);
    const code = Alexa.getSlotValue(i.requestEnvelope, 'codigo')?.trim();
    if (!code) return i.responseBuilder.speak('Diga o código de cadastro.').reprompt('Qual é o código?').getResponse();
    try {
        const result = await callScript('register', '', getTemporaryName(userId), userId, code);
        return i.responseBuilder.speak(result.success ? 'Cadastro confirmado. Agora você pode usar o Bora Mercado.' : 'Código inválido. Seu cadastro não foi realizado.').getResponse();
    } catch (error) { console.error('Erro no cadastro:', error); return i.responseBuilder.speak('Não consegui concluir o cadastro agora.').getResponse(); }
} };

const AdicionarItemIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AdicionarItemIntent'; }, async handle(i) {
    const auth = await checkAuthorization(i); if (!auth.isAuthorized) return denied(i);
    const item = Alexa.getSlotValue(i.requestEnvelope, 'item')?.trim();
    if (!item) return i.responseBuilder.speak('Não entendi qual item você quer anotar.').reprompt('Qual item?').getResponse();
    try { const result = await callScript('add', item, auth.user, auth.userId); return i.responseBuilder.speak(result.success ? `Anotado: ${item}.` : `Não consegui anotar ${item}.`).reprompt('Quer anotar mais alguma coisa?').getResponse(); }
    catch (error) { console.error('Erro ao adicionar:', error); return i.responseBuilder.speak('Não consegui acessar a planilha agora.').getResponse(); }
} };

const RemoverItemIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'RemoverItemIntent'; }, async handle(i) {
    const auth = await checkAuthorization(i); if (!auth.isAuthorized) return denied(i);
    const item = Alexa.getSlotValue(i.requestEnvelope, 'item')?.trim();
    if (!item) return i.responseBuilder.speak('Não entendi qual item você quer marcar como comprado.').reprompt('Qual item?').getResponse();
    try { const result = await callScript('remove', item, auth.user, auth.userId); return i.responseBuilder.speak(result.success ? `Pronto, dei baixa em ${item}.` : `Não encontrei ${item} na lista atual.`).getResponse(); }
    catch (error) { console.error('Erro ao remover:', error); return i.responseBuilder.speak('Não consegui acessar a planilha agora.').getResponse(); }
} };

const ListarItensIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'ListarItensIntent'; }, async handle(i) {
    const auth = await checkAuthorization(i); if (!auth.isAuthorized) return denied(i);
    try { const result = await callScript('list'); const items = Array.isArray(result.items) ? result.items : []; return i.responseBuilder.speak(items.length ? `Tá faltando: ${items.join(', ')}.` : 'Não tá faltando nada. A lista está vazia.').getResponse(); }
    catch (error) { console.error('Erro ao listar:', error); return i.responseBuilder.speak('Não consegui consultar a lista agora.').getResponse(); }
} };

const HelpIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.HelpIntent'; }, async handle(i) {
    const auth = await checkAuthorization(i); if (!auth.isAuthorized) return denied(i);
    const text = 'Você pode dizer anota leite, dá baixa no leite, marca como comprado pão, ou perguntar o que falta.';
    return i.responseBuilder.speak(text).reprompt(text).getResponse();
} };

const CancelAndStopIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && ['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(Alexa.getIntentName(i.requestEnvelope)); }, handle(i) { return i.responseBuilder.speak('Até mais.').getResponse(); } };
const FallbackIntentHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(i.requestEnvelope) === 'AMAZON.FallbackIntent'; }, handle(i) { return i.responseBuilder.speak('Não entendi. Diga anota leite, dá baixa no leite, ou o que falta.').reprompt('O que você quer fazer?').getResponse(); } };
const SessionEndedRequestHandler = { canHandle(i) { return Alexa.getRequestType(i.requestEnvelope) === 'SessionEndedRequest'; }, handle(i) { return i.responseBuilder.getResponse(); } };
const ErrorHandler = { canHandle() { return true; }, handle(i, error) { console.error('Erro:', error); return i.responseBuilder.speak('Ocorreu um erro. Tente novamente.').reprompt('Tente novamente.').getResponse(); } };

exports.handler = Alexa.SkillBuilders.custom().addRequestHandlers(LaunchRequestHandler, NavigateHomeIntentHandler, CadastrarUsuarioIntentHandler, AdicionarItemIntentHandler, RemoverItemIntentHandler, ListarItensIntentHandler, HelpIntentHandler, CancelAndStopIntentHandler, FallbackIntentHandler, SessionEndedRequestHandler).addRequestInterceptors(RequestLogger).addErrorHandlers(ErrorHandler).lambda();
