-- 协作功能数据库架构
-- 添加到现有的 database-schema.sql 之后

-- ============================================
-- 9. 项目分享表
-- ============================================
CREATE TABLE public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'comment')),
  expires_at TIMESTAMPTZ,
  password TEXT,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_shares_project_id ON public.project_shares(project_id);
CREATE INDEX idx_project_shares_token ON public.project_shares(share_token);
CREATE INDEX idx_project_shares_created_by ON public.project_shares(created_by);

-- ============================================
-- 10. 项目协作者表
-- ============================================
CREATE TABLE public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer', 'commenter')),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_status ON public.project_collaborators(status);

-- ============================================
-- 11. 项目评论表
-- ============================================
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position JSONB, -- {x: number, y: number}
  thread_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX idx_project_comments_user_id ON public.project_comments(user_id);
CREATE INDEX idx_project_comments_thread_id ON public.project_comments(thread_id);

-- ============================================
-- Row Level Security 策略
-- ============================================

-- 分享链接策略
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares of their projects"
  ON public.project_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their projects"
  ON public.project_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares of their projects"
  ON public.project_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 协作者策略
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators of their projects or projects they collaborate on"
  ON public.project_collaborators FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can invite collaborators"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own collaboration status"
  ON public.project_collaborators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can remove collaborators"
  ON public.project_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 评论策略
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on projects they can access"
  ON public.project_comments FOR SELECT
  USING (
    -- 项目拥有者
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
      AND projects.user_id = auth.uid()
    ) OR
    -- 协作者
    EXISTS (
      SELECT 1 FROM public.project_collaborators
      WHERE project_collaborators.project_id = project_comments.project_id
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.status = 'accepted'
    ) OR
    -- 公开项目
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
      AND projects.is_public = true
    )
  );

CREATE POLICY "Users can add comments to projects they can access"
  ON public.project_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.user_id = auth.uid() OR
        projects.is_public = true OR
        EXISTS (
          SELECT 1 FROM public.project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
          AND project_collaborators.status = 'accepted'
          AND project_collaborators.role IN ('editor', 'commenter')
        )
      )
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON public.project_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.project_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 触发器
-- ============================================

-- 自动更新评论的 updated_at
CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 函数
-- ============================================

-- 检查分享链接是否有效
CREATE OR REPLACE FUNCTION public.is_share_link_valid(share_token_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  share_record RECORD;
BEGIN
  SELECT * INTO share_record
  FROM public.project_shares
  WHERE share_token = share_token_param;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 检查过期时间
  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- 检查使用次数
  IF share_record.max_uses IS NOT NULL AND share_record.use_count >= share_record.max_uses THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取用户在项目中的角色
CREATE OR REPLACE FUNCTION public.get_user_project_role(
  project_id_param UUID,
  user_id_param UUID
)
RETURNS TEXT AS $$
DECLARE
  project_owner UUID;
  collaborator_role TEXT;
BEGIN
  -- 检查是否是项目拥有者
  SELECT user_id INTO project_owner
  FROM public.projects
  WHERE id = project_id_param;

  IF project_owner = user_id_param THEN
    RETURN 'owner';
  END IF;

  -- 检查是否是协作者
  SELECT role INTO collaborator_role
  FROM public.project_collaborators
  WHERE project_id = project_id_param
    AND user_id = user_id_param
    AND status = 'accepted';

  IF FOUND THEN
    RETURN collaborator_role;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 权限设置
-- ============================================

GRANT ALL ON public.project_shares TO authenticated;
GRANT ALL ON public.project_collaborators TO authenticated;
GRANT ALL ON public.project_comments TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_share_link_valid TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_project_role TO authenticated;
