import os
import json
import urllib.request
import urllib.parse
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler, AbstractErrorHandler
from ask_sdk_core.utils import is_request_type, is_intent_name

# ======================================================================================
# CONFIGURAÇÃO DE SEGURANÇA VIA ARQUIVO DE CONFIGURAÇÃO (config.json)
# O arquivo config.json está no .gitignore e NUNCA é enviado para o GitHub público!
# ======================================================================================
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')
config = {}
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except Exception as e:
        print(f"Erro ao carregar config.json: {e}")

GOOGLE_SCRIPT_URL = config.get('GOOGLE_SCRIPT_URL', os.environ.get('GOOGLE_SCRIPT_URL', ''))
TIMEOUT_SECONDS = 10

def get_user_id(handler_input):
    try:
        session = handler_input.request_envelope.session
        if session and session.user and session.user.user_id:
            return session.user.user_id
    except AttributeError:
        pass
    try:
        system = handler_input.request_envelope.context.system
        if system and system.user and system.user.user_id:
            return system.user.user_id
    except AttributeError:
        pass
    return ''

def get_temporary_name(user_id):
    short_id = user_id[-6:] if user_id else 'Desconhecido'
    return f"User_{short_id}"

def call_script(action, item='', user='', user_id='', code=''):
    if not GOOGLE_SCRIPT_URL:
        raise Exception("GOOGLE_SCRIPT_URL não configurada.")
    
    params = {'action': action}
    if item: params['item'] = item
    if user: params['user'] = user
    if user_id: params['userId'] = user_id
    if code: params['code'] = code
    
    url = f"{GOOGLE_SCRIPT_URL}?{urllib.parse.urlencode(params)}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
        data = response.read().decode('utf-8')
        return json.loads(data.lstrip('\ufeff'))

def check_authorization(handler_input):
    user_id = get_user_id(handler_input)
    if not user_id:
        return False, 'Não Autorizado', ''
    try:
        res = call_script('authorize', user_id=user_id)
        is_auth = res.get('success') == True
        user_name = res.get('user') or get_temporary_name(user_id)
        return is_auth, user_name, user_id
    except Exception as e:
        print(f"Erro no check_authorization: {e}")
        return False, get_temporary_name(user_id), user_id

# 1. LaunchRequest Handler
class LaunchRequestHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_request_type("LaunchRequest")(handler_input)
    
    def handle(self, handler_input):
        is_auth, user_name, user_id = check_authorization(handler_input)
        if not is_auth:
            speech = "Seu acesso ainda não está autorizado. Para se cadastrar, diga cadastrar código, seguido do código que recebeu do administrador da lista."
            return handler_input.response_builder.speak(speech).response
        
        speech = f"Bora Mercado JuRogerPi, {user_name}! Você pode dizer anota leite, dá baixa no leite, ou perguntar o que falta."
        return handler_input.response_builder.speak(speech).ask("O que você quer fazer?").response

# 2. CadastrarUsuarioIntent Handler
class CadastrarUsuarioIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("CadastrarUsuarioIntent")(handler_input)
    
    def handle(self, handler_input):
        user_id = get_user_id(handler_input)
        slots = handler_input.request_envelope.request.intent.slots
        code_slot = slots.get('codigo')
        code = code_slot.value.strip() if code_slot and code_slot.value else ''
        
        if not code:
            return handler_input.response_builder.speak("Diga o código de cadastro.").ask("Qual é o código?").response
        
        try:
            res = call_script('register', user=get_temporary_name(user_id), user_id=user_id, code=code)
            if res.get('success'):
                speech = "Cadastro confirmado. Agora você pode usar o Bora Mercado JuRogerPi."
            else:
                speech = "Código inválido. Seu cadastro não foi realizado."
            return handler_input.response_builder.speak(speech).response
        except Exception as e:
            print(f"Erro no cadastro: {e}")
            return handler_input.response_builder.speak("Não consegui concluir o cadastro agora.").response

# 3. AdicionarItemIntent Handler
class AdicionarItemIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AdicionarItemIntent")(handler_input)
    
    def handle(self, handler_input):
        is_auth, user_name, user_id = check_authorization(handler_input)
        if not is_auth:
            speech = "Seu acesso ainda não está autorizado. Para se cadastrar, diga cadastrar código, seguido do código que recebeu do administrador da lista."
            return handler_input.response_builder.speak(speech).response
        
        slots = handler_input.request_envelope.request.intent.slots
        item_slot = slots.get('item')
        item = item_slot.value.strip() if item_slot and item_slot.value else ''
        
        if not item:
            return handler_input.response_builder.speak("Não entendi qual item você quer anotar.").ask("Qual item?").response
        
        try:
            res = call_script('add', item=item, user=user_name, user_id=user_id)
            if res.get('success'):
                speech = f"Anotado: {item}."
            else:
                speech = f"Não consegui anotar {item}."
            return handler_input.response_builder.speak(speech).ask("Quer anotar mais alguma coisa?").response
        except Exception as e:
            print(f"Erro ao adicionar: {e}")
            return handler_input.response_builder.speak("Não consegui acessar a planilha agora.").response

# 4. RemoverItemIntent Handler
class RemoverItemIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("RemoverItemIntent")(handler_input)
    
    def handle(self, handler_input):
        is_auth, user_name, user_id = check_authorization(handler_input)
        if not is_auth:
            speech = "Seu acesso ainda não está autorizado. Para se cadastrar, diga cadastrar código..."
            return handler_input.response_builder.speak(speech).response
        
        slots = handler_input.request_envelope.request.intent.slots
        item_slot = slots.get('item')
        item = item_slot.value.strip() if item_slot and item_slot.value else ''
        
        if not item:
            return handler_input.response_builder.speak("Não entendi qual item você quer marcar como comprado.").ask("Qual item?").response
        
        try:
            res = call_script('remove', item=item, user=user_name, user_id=user_id)
            if res.get('success'):
                speech = f"Pronto, dei baixa em {item}."
            else:
                speech = f"Não encontrei {item} na lista atual."
            return handler_input.response_builder.speak(speech).response
        except Exception as e:
            print(f"Erro ao remover: {e}")
            return handler_input.response_builder.speak("Não consegui acessar a planilha agora.").response

# 5. ListarItensIntent Handler
class ListarItensIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("ListarItensIntent")(handler_input)
    
    def handle(self, handler_input):
        is_auth, user_name, user_id = check_authorization(handler_input)
        if not is_auth:
            speech = "Seu acesso ainda não está autorizado. Para se cadastrar, diga cadastrar código..."
            return handler_input.response_builder.speak(speech).response
        
        try:
            res = call_script('list')
            items = res.get('items', [])
            if items:
                speech = f"Tá faltando: {', '.join(items)}."
            else:
                speech = "Não tá faltando nada. A lista está vazia."
            return handler_input.response_builder.speak(speech).response
        except Exception as e:
            print(f"Erro ao listar: {e}")
            return handler_input.response_builder.speak("Não consegui consultar a lista agora.").response

# 6. HelpIntent Handler
class HelpIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.HelpIntent")(handler_input)
    
    def handle(self, handler_input):
        text = "Você pode dizer anota leite, dá baixa no leite, ou perguntar o que falta."
        return handler_input.response_builder.speak(text).ask(text).response

# 7. CancelOrStopIntent Handler
class CancelOrStopIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.CancelIntent")(handler_input) or is_intent_name("AMAZON.StopIntent")(handler_input)
    
    def handle(self, handler_input):
        return handler_input.response_builder.speak("Até mais.").response

# 8. FallbackIntent Handler
class FallbackIntentHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)
    
    def handle(self, handler_input):
        speech = "Não entendi. Diga anota leite, dá baixa no leite, ou o que falta."
        return handler_input.response_builder.speak(speech).ask("O que você quer fazer?").response

# 9. SessionEndedRequestHandler
class SessionEndedRequestHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return is_request_type("SessionEndedRequest")(handler_input)
    
    def handle(self, handler_input):
        return handler_input.response_builder.response

# 10. CatchAllExceptionHandler
class CatchAllExceptionHandler(AbstractErrorHandler):
    def can_handle(self, handler_input, exception):
        return True
    
    def handle(self, handler_input, exception):
        print(f"Erro capturado: {exception}")
        speech = "Ocorreu um erro. Tente novamente."
        return handler_input.response_builder.speak(speech).ask("Tente novamente.").response

sb = SkillBuilder()
sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(CadastrarUsuarioIntentHandler())
sb.add_request_handler(AdicionarItemIntentHandler())
sb.add_request_handler(RemoverItemIntentHandler())
sb.add_request_handler(ListarItensIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelOrStopIntentHandler())
sb.add_request_handler(FallbackIntentHandler())
sb.add_request_handler(SessionEndedRequestHandler())
sb.add_error_handler(CatchAllExceptionHandler())

lambda_handler = sb.lambda_handler()
