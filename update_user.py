
from sqlalchemy import or_

from mage_ai.authentication.passwords import create_bcrypt_hash, generate_salt
from mage_ai.orchestration.db import db_connection
from mage_ai.orchestration.db.models.oauth import User

identifier = "admin"          # 用户名或邮箱
new_password = "admin"  # 至少 8 位

db_connection.start_session(force=True)
user = User.query.filter(or_(User.username == identifier, User.email == identifier)).first()
if not user:
    raise SystemExit(f"User not found: {identifier}")

salt = generate_salt()
user.password_salt = salt
user.password_hash = create_bcrypt_hash(new_password, salt)
db_connection.session.commit()
print(f"Password updated for: {user.username or user.email}")