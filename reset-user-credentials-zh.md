# Mage 用户名/密码找回与重置（本地/自建）

本文档适用于通过 `python -m mage_ai.cli.main start test_project --port 6789` 启动的
本地/自建 Mage（默认 `AUTHENTICATION_MODE=LOCAL`）。

## 适用范围快速判断

- 如果使用 LDAP / OIDC / Okta / Google / Microsoft 等 SSO：用户名/密码由第三方提供方管理，需在提供方处重置。
- 如果使用本地账号（默认）：继续下面步骤。

## 场景 A：仍能用管理账号登录

1. 登录后访问 `http://localhost:6789/settings/workspace/users`。
2. 选择目标用户，重置其密码。
3. 注意：
   - Owner 可以重置其他用户密码，但修改**自己的**密码需要提供当前密码。
   - Admin 不能修改 Owner 账户。

## 场景 B：所有账号都无法登录（本地 DB 强制重置）

### 1) 找到数据库文件

默认路径由 `test_project/metadata.yaml` 的 `variables_dir` 决定：

- 当前项目配置为 `variables_dir: ~/.mage_data`
- 实际数据库路径为：`~/.mage_data/test_project/mage-ai.db`

如果你设置过 `MAGE_DATA_DIR` 或 `DATABASE_CONNECTION_URL`，以环境变量为准。

建议先备份数据库文件再操作。

### 2) 列出当前用户（找回用户名/邮箱）

PowerShell 示例：

```powershell
@'
from mage_ai.orchestration.db import db_connection
from mage_ai.orchestration.db.models.oauth import User

db_connection.start_session(force=True)
for user in User.query.order_by(User.id.asc()).all():
    owner_flag = "owner" if user.owner else ""
    print(user.id, user.username, user.email, owner_flag)
'@ | python -
```

### 3) 重置指定用户密码

PowerShell 示例（将 `identifier` 和 `new_password` 改成你的值）：

```powershell
@'
from sqlalchemy import or_

from mage_ai.authentication.passwords import create_bcrypt_hash, generate_salt
from mage_ai.orchestration.db import db_connection
from mage_ai.orchestration.db.models.oauth import User

identifier = "admin"          # 用户名或邮箱
new_password = "NewPass1234"  # 至少 8 位

db_connection.start_session(force=True)
user = User.query.filter(or_(User.username == identifier, User.email == identifier)).first()
if not user:
    raise SystemExit(f"User not found: {identifier}")

salt = generate_salt()
user.password_salt = salt
user.password_hash = create_bcrypt_hash(new_password, salt)
db_connection.session.commit()
print(f"Password updated for: {user.username or user.email}")
'@ | python -
```

### 4) 可选：修改用户名

```powershell
@'
from mage_ai.orchestration.db import db_connection
from mage_ai.orchestration.db.models.oauth import User

old_identifier = "admin"
new_username = "new_admin"

db_connection.start_session(force=True)
user = User.query.filter(User.username == old_identifier).first()
if not user:
    raise SystemExit(f"User not found: {old_identifier}")

user.username = new_username
db_connection.session.commit()
print(f"Username updated: {new_username}")
'@ | python -
```

### 5) 重启服务并验证

```powershell
python -m mage_ai.cli.main start test_project --port 6789
```

然后访问 `http://localhost:6789/sign-in` 登录验证。

## 备注：默认 Owner 账号与环境变量

初次启动且无 Owner 用户时，会创建默认 Owner：

- Email：`admin@admin.com`
- Username：`admin`
- Password：`admin`

可通过环境变量自定义默认 Owner（仅在“无 Owner 用户”时生效）：

- `DEFAULT_OWNER_EMAIL`
- `DEFAULT_OWNER_USERNAME`
- `DEFAULT_OWNER_PASSWORD`

如果系统中已存在 Owner 用户，这些环境变量不会自动覆盖已有用户密码。
