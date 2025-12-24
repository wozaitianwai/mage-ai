from mage_ai.shared.complex import is_model_xgboost
from mage_ai.tests.base_test import TestCase


class TestComplex(TestCase):
    def test_is_model_xgboost(self):
        # Test None
        self.assertFalse(is_model_xgboost(None))

        # Test class
        class MockClass:
            pass
        self.assertFalse(is_model_xgboost(MockClass))

        # Test instance matching xgboost.core.Booster
        class Booster:
            pass
        
        # Mocking module and qualname for the instance's class
        mock_booster = Booster()
        # We can't easily change __module__ of a class defined inside a function in some python versions
        # but let's try to set it on the class
        Booster.__module__ = 'xgboost.core'
        Booster.__qualname__ = 'Booster'
        
        self.assertTrue(is_model_xgboost(mock_booster))

        # Test instance with get_booster
        class XGBClassifier:
            def get_booster(self):
                pass
        
        self.assertTrue(is_model_xgboost(XGBClassifier()))

        # Test other instance
        class Other:
            pass
        self.assertFalse(is_model_xgboost(Other()))
