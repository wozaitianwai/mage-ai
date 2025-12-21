import inspect
from typing import Any


def is_model_sklearn(data: Any) -> bool:
    if data is None:
        return False

    if inspect.isclass(data):
        return False

    try:
        from sklearn.base import BaseEstimator, is_classifier, is_regressor

        # is_classifier / is_regressor expect a proper sklearn estimator; calling them on
        # arbitrary objects (or None) can raise when __sklearn_tags__ is missing.
        if not isinstance(data, BaseEstimator):
            return False

        # If it's a sklearn estimator, treat it as a model even if the helper checks fail.
        try:
            return is_classifier(data) or is_regressor(data) or True
        except Exception as err:
            print(f"Error checking sklearn model: {err}")
            return True
    except Exception as err:
        # Logging instead of raising keeps serialization resilient when objects
        # aren't valid sklearn estimators (e.g. None or partial mocks).
        print(f"Error checking sklearn model: {err}")
        return False


def is_model_xgboost(data: Any) -> bool:
    """
    Checks if the given data is an instance of an XGBoost model, either a Booster
    or an object from XGBoost's scikit-learn API.
    """
    if inspect.isclass(data):
        return False

    # Check for direct instance of Booster
    if inspect.isclass(data):
        # Checking if it's a class reference rather than an instance
        if "xgboost.core.Booster" == f"{data.__module__}.{data.__qualname__}":
            return True
    else:
        # Check based on instance attributes and methods
        if hasattr(data, "__class__"):
            class_name = f"{data.__class__.__module__}.{data.__class__.__qualname__}"
            if class_name.startswith("xgboost.core.Booster"):
                return True

    # Check for sklearn API models (like XGBClassifier, XGBRegressor)
    # These models have a get_booster() method
    if hasattr(data, "get_booster"):
        return True

    return False
