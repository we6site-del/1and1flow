# 数据库迁移：添加 CHAT 类型支持

## 问题
当尝试创建 CHAT 类型的模型时，出现错误：
```
new row for relation "ai_models" violates check constraint "ai_models_type_check"
```

## 原因
数据库表 `ai_models` 有一个检查约束，只允许 `type` 字段为 `IMAGE` 或 `VIDEO`。

## 解决方案

### 方法 1：通过 Supabase Dashboard（推荐）

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard
   - 选择您的项目

2. **打开 SQL Editor**
   - 点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

3. **执行以下 SQL**：
   ```sql
   -- 删除旧的约束
   ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_type_check;
   
   -- 添加新的约束（包含 CHAT）
   ALTER TABLE ai_models ADD CONSTRAINT ai_models_type_check 
       CHECK (type IN ('IMAGE', 'VIDEO', 'CHAT'));
   ```

4. **点击 "Run"** 执行

5. **验证**：
   ```sql
   SELECT constraint_name, check_clause 
   FROM information_schema.check_constraints 
   WHERE constraint_name = 'ai_models_type_check';
   ```

### 方法 2：通过 psql 命令行

如果您有直接的数据库访问权限：

```bash
# 连接到数据库
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# 执行迁移
\i backend/migrations/add_chat_type_to_ai_models.sql
```

### 方法 3：使用 Python 脚本

```python
from supabase import create_client
import os

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(supabase_url, supabase_key)

# 执行 SQL
sql = """
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_type_check;
ALTER TABLE ai_models ADD CONSTRAINT ai_models_type_check 
    CHECK (type IN ('IMAGE', 'VIDEO', 'CHAT'));
"""

supabase.rpc('exec_sql', {'query': sql}).execute()
```

## 迁移后验证

1. **返回 Admin Panel**
   - 访问 `/admin/ai-models`

2. **尝试创建 CHAT 模型**
   - 点击 "Create Model"
   - Type: 选择 `CHAT`
   - Provider: 选择 `OPENROUTER`
   - API Path: `anthropic/claude-3-haiku:free`
   - 保存

3. **确认成功**
   - 应该能够成功创建
   - 模型出现在列表中，带有绿色的 CHAT 徽章

## 注意事项

- ⚠️ 这个迁移是**安全的**，不会影响现有数据
- ✅ 只是扩展了允许的值，不会删除或修改现有记录
- ✅ 可以随时回滚（如果需要）

## 回滚（如果需要）

如果需要撤销此更改：

```sql
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_type_check;
ALTER TABLE ai_models ADD CONSTRAINT ai_models_type_check 
    CHECK (type IN ('IMAGE', 'VIDEO'));
```

## 相关文件

- SQL 迁移文件：`backend/migrations/add_chat_type_to_ai_models.sql`
