import json
import os
import re
from typing import Dict

import openai
from langchain.prompts import PromptTemplate
from openai import OpenAI as OpenAILib

from mage_ai.ai.ai_client import AIClient
from mage_ai.data_cleaner.transformer_actions.constants import ActionType, Axis
from mage_ai.data_preparation.models.constants import (
    AIMode,
    BlockLanguage,
    BlockType,
    PipelineType,
)
from mage_ai.data_preparation.repo_manager import get_repo_config
from mage_ai.io.base import DataSource
from mage_ai.orchestration.ai.config import OpenAIConfig

CLASSIFICATION_FUNCTION_NAME = "classify_description"
tools = [
    {
        "type": "function",
        "function": {
            "name": CLASSIFICATION_FUNCTION_NAME,
            "description": "Classify the code description provided into following properties.",
            "parameters": {
                "type": "object",
                "properties": {
                    BlockType.__name__: {
                        "type": "string",
                        "description": "Type of the code block. It either "
                                       "loads data from a source, export data to a source "
                                       "or transform data from one format to another.",
                        "enum": [f"{BlockType.__name__}__data_exporter",
                                 f"{BlockType.__name__}__data_loader",
                                 f"{BlockType.__name__}__transformer"]
                    },
                    BlockLanguage.__name__: {
                        "type": "string",
                        "description": "Programming language of the code block. "
                                       f"Default value is {BlockLanguage.__name__}__python.",
                        "enum": [
                            f"{BlockLanguage.__name__}__{type.name.lower()}"
                            for type in BlockLanguage]
                    },
                    PipelineType.__name__: {
                        "type": "string",
                        "description": "Type of pipeline to build. Default value is "
                                       f"{PipelineType.__name__}__python if pipeline type "
                                       "is not mentioned in the description.",
                        "enum": [
                            f"{PipelineType.__name__}__{type.name.lower()}"
                            for type in PipelineType]
                    },
                    ActionType.__name__: {
                        "type": "string",
                        "description": f"If {BlockType.__name__} is transformer, "
                                       f"{ActionType.__name__} specifies what kind "
                                       "of action the code performs.",
                        "enum": [f"{ActionType.__name__}__{type.name.lower()}"
                                 for type in ActionType]
                    },
                    DataSource.__name__: {
                        "type": "string",
                        "description": f"If {BlockType.__name__} is data_loader or "
                                       f"data_exporter, {DataSource.__name__} field specify "
                                       "where the data loads from or exports to.",
                        "enum": [f"{DataSource.__name__}__{type.name.lower()}"
                                 for type in DataSource]
                    },
                },
                "required": [BlockType.__name__, BlockLanguage.__name__, PipelineType.__name__],
            },
        }
    },
]
PROMPT_FOR_FUNCTION_PARAMS = """
Based on the code description, answer each question.

`code description: {code_description}`

Question BlockType: What is the purpose of the code? Choose one result from:
['data_loader', 'data_exporter', 'transformer'].
If the code wants to read data from a data source, it is "data_loader".
If it wants to export data into a data source, it is "data_exporter".
For the rest manipulation data actions, it is "transformer".

Question BlockLanguage: What is the intended programming language for this code?
The default value is Python, but choose one result from: {block_languages}.

Question PipelineType: What is the pipeline type? The default value is Python,
but choose one result from: {pipeline_types}.

Question ActionType: If BlockType is transformer, what is the action this code tries to perform?
Choose one result from: {action_types}

Question DataSource: If BlockType is data_loader or data_exporter, where the data loads from or
export to? Choose one result from: {data_sources}

Return your responses in JSON format with the question name as the key and
the answer as the value.
"""

DEFAULT_PROVIDER_CONFIG = {
    AIMode.OPEN_AI: dict(
        base_url='https://api.openai.com/v1',
        model='gpt-4o',
    ),
    AIMode.OPENAI_COMPATIBLE: dict(
        base_url=None,
        model=None,
    ),
    AIMode.DEEPSEEK: dict(
        base_url='https://api.deepseek.com/v1',
        model='deepseek-chat',
    ),
    AIMode.GROK: dict(
        base_url='https://api.x.ai/v1',
        model='grok-2-latest',
    ),
    AIMode.QWEN: dict(
        base_url='https://dashscope.aliyuncs.com/compatible-mode/v1',
        model='qwen2.5-72b-instruct',
    ),
}

PROVIDER_ENV_VARS = {
    AIMode.OPEN_AI: 'OPENAI_API_KEY',
    AIMode.OPENAI_COMPATIBLE: 'OPENAI_API_KEY',
    AIMode.DEEPSEEK: 'DEEPSEEK_API_KEY',
    AIMode.GROK: 'GROK_API_KEY',
    AIMode.QWEN: 'QWEN_API_KEY',
}


class OpenAIClient(AIClient):
    def __init__(self, open_ai_config: OpenAIConfig, provider: AIMode = AIMode.OPEN_AI):
        repo_config = get_repo_config()
        if open_ai_config is None or isinstance(open_ai_config, type):
            open_ai_config = OpenAIConfig()

        self.provider = provider or AIMode.OPEN_AI
        defaults = DEFAULT_PROVIDER_CONFIG.get(
            self.provider,
            DEFAULT_PROVIDER_CONFIG[AIMode.OPENAI_COMPATIBLE],
        )

        base_url = open_ai_config.base_url or defaults.get('base_url')
        model = open_ai_config.model or defaults.get('model')

        env_key = PROVIDER_ENV_VARS.get(self.provider, 'OPENAI_API_KEY')
        openai_api_key = open_ai_config.openai_api_key
        if not openai_api_key and self.provider == AIMode.OPEN_AI:
            openai_api_key = repo_config.openai_api_key
        if not openai_api_key:
            openai_api_key = os.getenv(env_key) or os.getenv('OPENAI_API_KEY')

        openai.api_key = openai_api_key
        self.model = model or DEFAULT_PROVIDER_CONFIG[AIMode.OPEN_AI]['model']
        self.base_url = base_url
        if base_url:
            self.openai_client = OpenAILib(api_key=openai_api_key, base_url=base_url)
        else:
            self.openai_client = OpenAILib(api_key=openai_api_key)

    def __build_prompt(self, variable_values: Dict[str, str], prompt_template: str) -> str:
        filled_prompt = PromptTemplate(
            input_variables=list(variable_values.keys()),
            template=prompt_template,
        )
        return filled_prompt.format(**variable_values)

    def __chat_completion_request(self, messages, use_tools: bool = True):
        try:
            request_args = dict(
                model=self.model,
                messages=messages,
                temperature=0,
            )
            if use_tools:
                request_args.update(dict(
                    tools=tools,
                    tool_choice={
                        "type": "function",
                        "function": {"name": CLASSIFICATION_FUNCTION_NAME},
                    },
                ))
            response = self.openai_client.chat.completions.create(**request_args)
            return response
        except Exception as e:
            print("Unable to generate ChatCompletion response")
            print(f"Exception: {e}")
            return e

    def __extract_message_content(self, response) -> str:
        try:
            return response.choices[0].message.content
        except Exception:
            return None

    def __parse_json_response(self, response_text: str, is_json_response: bool = True):
        if not is_json_response:
            return response_text
        if isinstance(response_text, dict):
            return response_text
        if not isinstance(response_text, str):
            return {}
        if not response_text:
            return {}
        text = response_text.strip()
        text = re.sub(r'^```json', '', text, flags=re.IGNORECASE).strip()
        text = re.sub(r'^```', '', text).strip()
        text = re.sub(r'```$', '', text).strip()
        if not (text.startswith('{') and text.endswith('}')):
            text = f'{{{text.strip()}}}'
        try:
            return json.loads(text)
        except json.decoder.JSONDecodeError as err:
            print(f'[ERROR] OpenAIClient.inference_with_prompt {text}: {err}.')
            return response_text

    async def inference_with_prompt(
            self,
            variable_values: Dict[str, str],
            prompt_template: str,
            is_json_response: bool = True
    ):
        """Generic function to call OpenAI LLM and return JSON response by default.

        Fill variables and values into template, and run against LLM
        to genenrate JSON format response.

        Args:
            variable_values: all required variable and values in prompt.
            prompt_template: prompt template for LLM call.
            is_json_response: default is json formatted response.

        Returns:
            We typically suggest response in JSON format. For example:
                {
                    'action_code': 'grade == 5 or grade == 6',
                    'arguments': ['class']
                }
        """
        prompt = self.__build_prompt(variable_values, prompt_template)
        response = self.__chat_completion_request(
            [{'role': 'user', 'content': prompt}],
            use_tools=False,
        )
        if isinstance(response, Exception):
            raise response
        content = self.__extract_message_content(response)
        return self.__parse_json_response(content, is_json_response=is_json_response)

    def __parse_argument_value(self, value: str) -> str:
        if value is None:
            return None
        # If model returned value does not contain '__' as we suggested in the tools
        # then return the value as it is.
        if '__' not in value:
            return value
        return value.lower().split('__')[1]

    def __load_template_params(self, function_args: json):
        block_type = BlockType(self.__parse_argument_value(function_args[BlockType.__name__]))
        block_language = BlockLanguage(
                            self.__parse_argument_value(
                                function_args.get(BlockLanguage.__name__)
                            ) or "python")
        pipeline_type = PipelineType(
                            self.__parse_argument_value(
                                function_args.get(PipelineType.__name__)
                            ) or "python")
        config = {}
        config['action_type'] = self.__parse_argument_value(
                                    function_args.get(ActionType.__name__))
        if config['action_type']:
            if config['action_type'] in [
                ActionType.FILTER,
                ActionType.DROP_DUPLICATE,
                ActionType.REMOVE,
                ActionType.SORT
            ]:
                config['axis'] = Axis.ROW
            else:
                config['axis'] = Axis.COLUMN
        config['data_source'] = self.__parse_argument_value(
                                    function_args.get(DataSource.__name__))
        return block_type, block_language, pipeline_type, config

    def __parse_prompt_function_args(self, function_args: Dict):
        block_type_value = function_args.get(f'Question {BlockType.__name__}') or \
            function_args.get(BlockType.__name__)
        if not block_type_value:
            raise Exception('Missing BlockType in prompt response.')
        block_type = BlockType(self.__parse_argument_value(block_type_value))

        block_language_value = function_args.get(f'Question {BlockLanguage.__name__}') or \
            function_args.get(BlockLanguage.__name__) or 'python'
        try:
            block_language = BlockLanguage(self.__parse_argument_value(block_language_value))
        except ValueError:
            block_language = BlockLanguage.PYTHON

        pipeline_type_value = function_args.get(f'Question {PipelineType.__name__}') or \
            function_args.get(PipelineType.__name__) or 'python'
        try:
            pipeline_type = PipelineType(self.__parse_argument_value(pipeline_type_value))
        except ValueError:
            pipeline_type = PipelineType.PYTHON

        config = {}
        action_type_value = function_args.get(f'Question {ActionType.__name__}') or \
            function_args.get(ActionType.__name__)
        if action_type_value:
            try:
                config['action_type'] = ActionType(
                    self.__parse_argument_value(action_type_value)
                )
            except ValueError:
                config['action_type'] = None
            if config.get('action_type'):
                if config['action_type'] in [
                    ActionType.FILTER,
                    ActionType.DROP_DUPLICATE,
                    ActionType.REMOVE,
                    ActionType.SORT
                ]:
                    config['axis'] = Axis.ROW
                else:
                    config['axis'] = Axis.COLUMN

        data_source_value = function_args.get(f'Question {DataSource.__name__}') or \
            function_args.get(DataSource.__name__)
        if data_source_value:
            try:
                config['data_source'] = DataSource(
                    self.__parse_argument_value(data_source_value)
                )
            except ValueError:
                config['data_source'] = None

        output = {}
        output['block_type'] = block_type
        output['block_language'] = block_language
        output['pipeline_type'] = pipeline_type
        output['config'] = config
        return output

    async def __find_block_params_with_prompt(self, block_description: str):
        variable_values = dict()
        variable_values['code_description'] = block_description
        variable_values['block_languages'] = \
            [f'{type.name.lower()}' for type in BlockLanguage]
        variable_values['pipeline_types'] = \
            [f'{type.name.lower()}' for type in PipelineType]
        variable_values['action_types'] = \
            [f'{type.name.lower()}' for type in ActionType]
        variable_values['data_sources'] = \
            [f"{type.name.lower()}" for type in DataSource]
        prompt = self.__build_prompt(variable_values, PROMPT_FOR_FUNCTION_PARAMS)
        response = self.__chat_completion_request(
            [{'role': 'user', 'content': prompt}],
            use_tools=False,
        )
        if isinstance(response, Exception):
            raise response
        content = self.__extract_message_content(response)
        function_args = self.__parse_json_response(content, is_json_response=True)
        if not isinstance(function_args, dict):
            raise Exception('Failed to interpret prompt response as JSON.')
        return self.__parse_prompt_function_args(function_args)

    async def find_block_params(
            self,
            block_description: str):
        messages = [{'role': 'user', 'content': block_description}]
        # Fetch response form API call with retries
        # retry __chat_completion_request twice.
        # If it still returns error, raise error in find_block_params.
        # If not error anymore, proceed with rest of the code change.
        max_retries = 2
        attempt = 0
        response = self.__chat_completion_request(messages)
        while attempt <= max_retries and isinstance(response, Exception):
            response = self.__chat_completion_request(messages)
            attempt += 1
        if isinstance(response, Exception):
            return await self.__find_block_params_with_prompt(block_description)
        arguments = None
        try:
            arguments = response.choices[0].message.tool_calls[0].function.arguments
        except Exception:
            arguments = None
        if arguments:
            function_args = json.loads(arguments)
            block_type, block_language, pipeline_type, config = self.__load_template_params(
                function_args)
            output = {}
            output['block_type'] = block_type
            output['block_language'] = block_language
            output['pipeline_type'] = pipeline_type
            output['config'] = config
            return output
        return await self.__find_block_params_with_prompt(block_description)
