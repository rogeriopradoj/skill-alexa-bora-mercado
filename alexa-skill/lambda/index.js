const Alexa = require('ask-sdk-core');
const https = require('https');

// ======================================================================================
// CONFIGURAÇÃO DE SEGURANÇA VIA config.json
// O arquivo config.json deve permanecer no .gitignore.
// ======================================================================================
let config = {
    GOOGLE_SCRIPT_URL: '',
    ALLOWED_USERS: {}
};

try {
    config = require('./config.json');
} catch (error) {
    console.log('Aviso: config.json não encontrado. Verifique a configuração do ambiente.');
}

const GOOGLE_SCRIPT_URL = config.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || '';
const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Recupera o userId da conta Alexa e verifica se ela possui acesso.
 */
function checkAuthorization(handlerInput) {
    const userId =
        handlerInput.requestEnvelope?.session?.user?.userId ||
        handlerInput.requestEnvelope?.context?.System?.user?.userId ||
        '';

    const allowedUsers = config.ALLOWED_USERS || {};
    const configuredUserIds = Object.keys(allowedUsers);

    // Modo inicial: sem usuários configurados, permite acesso e registra um nome temporário.
    if (configuredUserIds.length === 0) {
        const shortId = userId ? userId.slice(-6) : 'Desconhecido';

        return {
            isAuthorized: true,
            user: `User_${shortId}`,
            userId
        };
    }

    const mappedName = allowedUsers[userId];

    if (mappedName) {
        return {
            isAuthorized: true,
            user: mappedName,
            userId
        };
    }

    return {
        isAuthorized: false,
        user: 'Não Autorizado',
        userId
    };
}

function unauthorizedResponse(handlerInput, action) {
    return handlerInput.responseBuilder
        .speak(`Desculpe, seu usuário não possui permissão para ${action}.`)
        .getResponse();
}

/**
 * Faz uma chamada GET ao Google Apps Script.
 * Trata redirecionamentos, códigos HTTP inválidos, timeout e resposta JSON.
 */
function callScript(action, item = '', user = '', userId = '') {
    if (!GOOGLE_SCRIPT_URL) {
        return Promise.reject(
            new Error('GOOGLE_SCRIPT_URL não configurada no config.json ou nas variáveis de ambiente.')
        );
    }

    let requestUrl;

    try {
        const url = new URL(GOOGLE_SCRIPT_URL);

        url.searchParams.set('action', action);

        if (item) {
            url.searchParams.set('item', item);
        }

        if (user) {
            url.searchParams.set('user', user);
        }

        if (userId) {
            url.searchParams.set('userId', userId);
        }

        requestUrl = url.toString();
    } catch (error) {
        return Promise.reject(new Error(`GOOGLE_SCRIPT_URL inválida: ${error.message}`));
    }

    return new Promise((resolve, reject) => {
        const fetchUrl = (targetUrl, redirectCount = 0) => {
            let request;

            try {
                request = https.get(targetUrl, (response) => {
                    const statusCode = response.statusCode || 0;
                    const redirectCodes = [301, 302, 303, 307, 308];

                    if (redirectCodes.includes(statusCode)) {
                        const location = response.headers.location;

                        response.resume();

                        if (!location) {
                            reject(new Error(`Redirecionamento HTTP ${statusCode} sem destino.`));
                            return;
                        }

                        if (redirectCount >= MAX_REDIRECTS) {
                            reject(new Error('Quantidade máxima de redirecionamentos excedida.'));
                            return;
                        }

                        let nextUrl;

                        try {
                            nextUrl = new URL(location, targetUrl).toString();
                        } catch (error) {
                            reject(new Error(`URL de redirecionamento inválida: ${error.message}`));
                            return;
                        }

                        fetchUrl(nextUrl, redirectCount + 1);
                        return;
                    }

                    if (statusCode < 200 || statusCode >= 300) {
                        response.resume();
                        reject(new Error(`Google Apps Script respondeu com HTTP ${statusCode}.`));
                        return;
                    }

                    let data = '';

                    response.setEncoding('utf8');

                    response.on('data', (chunk) => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        try {
                            const parsed = JSON.parse(data.replace(/^\uFEFF/, ''));

                            if (!parsed || typeof parsed !== 'object') {
                                reject(new Error('A resposta do Apps Script não contém um JSON válido.'));
                                return;
                            }

                            resolve(parsed);
                        } catch (error) {
                            reject(
                                new Error(
                                    `Erro ao interpretar a resposta do Apps Script: ${error.message}`
                                )
                            );
                        }
                    });
                });

                request.setTimeout(REQUEST_TIMEOUT_MS, () => {
                    request.destroy(
                        new Error('Tempo limite ao conectar com o Google Apps Script.')
                    );
                });

                request.on('error', reject);
            } catch (error) {
                reject(error);
            }
        };

        fetchUrl(requestUrl);
    });
}

function launchResponse(handlerInput) {
    const auth = checkAuthorization(handlerInput);

    if (!auth.isAuthorized) {
        return unauthorizedResponse(handlerInput, 'acessar esta lista');
    }

    const speakOutput =
        `Bora Mercado, ${auth.user}! ` +
        'Você pode dizer, por exemplo, anota leite, dá baixa em leite, ou perguntar o que falta.';

    return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt('O que você quer anotar, marcar como comprado ou consultar?')
        .getResponse();
}

// 1. LaunchRequest
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return launchResponse(handlerInput);
    }
};

// 2. Navegação para a skill
const NavigateHomeIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NavigateHomeIntent'
        );
    },
    handle(handlerInput) {
        return launchResponse(handlerInput);
    }
};

// 3. Adicionar item
const AdicionarItemIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AdicionarItemIntent'
        );
    },
    async handle(handlerInput) {
        const auth = checkAuthorization(handlerInput);

        if (!auth.isAuthorized) {
            return unauthorizedResponse(handlerInput, 'alterar esta lista');
        }

        const item = Alexa.getSlotValue(handlerInput.requestEnvelope, 'item')?.trim();

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não entendi qual item você quer anotar. Pode repetir?')
                .reprompt('Qual item você quer anotar?')
                .getResponse();
        }

        try {
            const response = await callScript('add', item, auth.user, auth.userId);

            if (!response.success) {
                return handlerInput.responseBuilder
                    .speak(`Não consegui anotar ${item}.`)
                    .reprompt('Quer tentar anotar outro item?')
                    .getResponse();
            }

            return handlerInput.responseBuilder
                .speak(`Anotado: ${item}.`)
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

// 4. Marcar item como comprado
const RemoverItemIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'RemoverItemIntent'
        );
    },
    async handle(handlerInput) {
        const auth = checkAuthorization(handlerInput);

        if (!auth.isAuthorized) {
            return unauthorizedResponse(handlerInput, 'alterar esta lista');
        }

        const item = Alexa.getSlotValue(handlerInput.requestEnvelope, 'item')?.trim();

        if (!item) {
            return handlerInput.responseBuilder
                .speak('Não entendi qual item você quer marcar como comprado. Pode repetir?')
                .reprompt('Qual item você quer marcar como comprado?')
                .getResponse();
        }

        try {
            const response = await callScript('remove', item, auth.user, auth.userId);

            const speakOutput = response.success
                ? `Pronto, dei baixa em ${item}.`
                : `Não encontrei ${item} na lista atual.`;

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Quer anotar outro item, dar baixa em algo ou consultar a lista?')
                .getResponse();
        } catch (error) {
            console.error('Erro no RemoverItemIntent:', error);

            return handlerInput.responseBuilder
                .speak(
                    `Tive um problema ao conectar com a planilha para dar baixa em ${item}.`
                )
                .getResponse();
        }
    }
};

// 5. Listar itens
const ListarItensIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListarItensIntent'
        );
    },
    async handle(handlerInput) {
        const auth = checkAuthorization(handlerInput);

        if (!auth.isAuthorized) {
            return unauthorizedResponse(handlerInput, 'consultar esta lista');
        }

        try {
            const response = await callScript('list');
            const items = Array.isArray(response.items) ? response.items : [];

            const speakOutput =
                items.length > 0
                    ? `Tá faltando: ${items.join(', ')}.`
                    : 'Não tá faltando nada. A lista está vazia.';

            return handlerInput.responseBuilder.speak(speakOutput).getResponse();
        } catch (error) {
            console.error('Erro no ListarItensIntent:', error);

            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui consultar a lista no momento.')
                .getResponse();
        }
    }
};

// 6. Ajuda
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
        );
    },
    handle(handlerInput) {
        const auth = checkAuthorization(handlerInput);

        if (!auth.isAuthorized) {
            return unauthorizedResponse(handlerInput, 'acessar esta lista');
        }

        const speakOutput =
            'Você pode dizer: anota leite, registra arroz, dá baixa em leite, ' +
            'marca como comprado pão, ou perguntar o que falta. Como posso ajudar?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que você quer fazer?')
            .getResponse();
    }
};

// 7. Cancelar ou parar
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            ['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(
                Alexa.getIntentName(handlerInput.requestEnvelope)
            )
        );
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.speak('Até mais!').getResponse();
    }
};

// 8. Frase não compreendida
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return (
            Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
            Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent'
        );
    },
    handle(handlerInput) {
        const auth = checkAuthorization(handlerInput);

        if (!auth.isAuthorized) {
            return unauthorizedResponse(handlerInput, 'acessar esta lista');
        }

        const speakOutput =
            'Não entendi. Você pode dizer anota leite, dá baixa em leite, ' +
            'marca como comprado pão, ou perguntar o que falta.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('O que você quer fazer?')
            .getResponse();
    }
};

// 9. Encerramento de sessão
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(
            `Sessão encerrada: ${handlerInput.requestEnvelope.request.reason || 'motivo não informado'}`
        );

        return handlerInput.responseBuilder.getResponse();
    }
};

// 10. Exceções não tratadas
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Erro capturado pelo ErrorHandler:', error);

        const speakOutput =
            'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Você pode tentar novamente.')
            .getResponse();
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