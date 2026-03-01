import json
import os

def load_client_config() -> dict:
    config_path = os.path.join(os.path.dirname(__file__), 'client_config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Config load error: {e}")
        return {}

def get_config_value(key: str, default=None):
    config = load_client_config()
    return config.get(key, default)