-- 用户账号表 - iam_account
CREATE TABLE `iam_account` (
    `id` BIGINT NOT NULL COMMENT '用户账号ID，不使用自动增长',
    `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名',
    `login_name` VARCHAR(50) NOT NULL COMMENT '登录名，唯一',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt哈希）',
    `email_encrypted` TEXT DEFAULT NULL COMMENT '加密后的电子邮件',
    `email_masked` VARCHAR(100) DEFAULT NULL COMMENT '脱敏后的电子邮件（用于显示）',
    `email_hash` VARCHAR(64) DEFAULT NULL COMMENT '电子邮件的哈希值（用于快速查找）',
    `email_verified` TINYINT(1) DEFAULT 0 COMMENT '电子邮件是否已验证：0-未验证，1-已验证',
    `phone_encrypted` TEXT DEFAULT NULL COMMENT '加密后的手机号码',
    `phone_masked` VARCHAR(20) DEFAULT NULL COMMENT '脱敏后的手机号码（用于显示）',
    `phone_hash` VARCHAR(64) DEFAULT NULL COMMENT '手机号码的哈希值（用于快速查找）',
    `phone_verified` TINYINT(1) DEFAULT 0 COMMENT '手机号码是否已验证：0-未验证，1-已验证',
    `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `status` TINYINT DEFAULT 0 COMMENT '账号状态：0-未激活，1-正常，2-锁定，9-删除',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `update_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_login_name` (`login_name`),
    UNIQUE KEY `uk_email_hash` (`email_hash`),
    UNIQUE KEY `uk_phone_hash` (`phone_hash`),
    KEY `idx_username` (`username`),
    KEY `idx_status` (`status`),
    KEY `idx_create_date` (`create_date`),
    KEY `idx_email_verified` (`email_verified`),
    KEY `idx_phone_verified` (`phone_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户账号表';

-- OAuth账号表 - iam_oauth_account
CREATE TABLE `iam_oauth_account` (
    `id` BIGINT NOT NULL COMMENT 'OAuth账号ID，不使用自动增长',
    `provider` VARCHAR(20) NOT NULL COMMENT 'OAuth提供商：google、facebook、wechat等',
    `provider_user_id` VARCHAR(100) NOT NULL COMMENT '提供商用户ID（Google的sub、Facebook的id、微信的openid）',
    `union_id` VARCHAR(100) DEFAULT NULL COMMENT '提供商跨应用统一用户ID（主要用于微信unionid）',
    `user_id` BIGINT DEFAULT NULL COMMENT '关联的用户账号ID',
    `access_token` TEXT DEFAULT NULL COMMENT '提供商访问令牌（加密存储）',
    `refresh_token` TEXT DEFAULT NULL COMMENT '提供商刷新令牌（加密存储）',
    `token_type` VARCHAR(20) DEFAULT 'Bearer' COMMENT '令牌类型，通常为Bearer',
    `scope` VARCHAR(200) DEFAULT NULL COMMENT '授权范围',
    `expires_at` DATETIME DEFAULT NULL COMMENT '访问令牌过期时间',
    `refresh_expires_at` DATETIME DEFAULT NULL COMMENT '刷新令牌过期时间',
    `raw_user_info` TEXT DEFAULT NULL COMMENT '提供商返回的原始用户信息JSON',
    `status` VARCHAR(20) DEFAULT 'active' COMMENT '绑定状态：active-激活，revoked-已撤销，expired-已过期',
    `last_used_at` DATETIME DEFAULT NULL COMMENT '最后使用时间',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_provider_user` (`provider`, `provider_user_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_provider_union` (`provider`, `union_id`),
    KEY `idx_status` (`status`),
    KEY `idx_expires_at` (`expires_at`),
    KEY `idx_last_used_at` (`last_used_at`),
    KEY `idx_create_date` (`create_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OAuth账号绑定表';

-- 用户资料表 - iam_user_profile
CREATE TABLE `iam_user_profile` (
    `user_id` BIGINT NOT NULL COMMENT '用户ID，关联account表',
    `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    `gender` TINYINT DEFAULT NULL COMMENT '性别：0-未知，1-男，2-女',
    `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
    `education` VARCHAR(50) DEFAULT NULL COMMENT '教育背景',
    `profession` VARCHAR(100) DEFAULT NULL COMMENT '职业',
    `location` VARCHAR(200) DEFAULT NULL COMMENT '地理位置',
    `bio` TEXT DEFAULT NULL COMMENT '个人简介',
    `school_id` BIGINT DEFAULT NULL COMMENT '学校ID',
    `extra_info` JSON DEFAULT NULL COMMENT '其他扩展信息',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `update_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`user_id`),
    KEY `idx_real_name` (`real_name`),
    KEY `idx_gender` (`gender`),
    KEY `idx_location` (`location`),
    KEY `idx_school_id` (`school_id`),
    KEY `idx_create_date` (`create_date`),
    CONSTRAINT `fk_profile_user_id` FOREIGN KEY (`user_id`) REFERENCES `uc_account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料表';

-- 登录日志表 - iam_login_log
CREATE TABLE `iam_login_log` (
    `id` BIGINT NOT NULL COMMENT '日志ID，不使用自动增长',
    `user_id` BIGINT DEFAULT NULL COMMENT '用户ID，关联account表',
    `login_type` VARCHAR(20) DEFAULT 'password' COMMENT '登录类型：password-密码登录，oauth-OAuth登录，sms-短信登录',
    `provider` VARCHAR(20) DEFAULT NULL COMMENT 'OAuth提供商（仅OAuth登录时有值）',
    `ip` VARCHAR(45) NOT NULL COMMENT '登录IP地址（支持IPv6）',
    `user_agent` TEXT DEFAULT NULL COMMENT '用户代理字符串',
    `device` VARCHAR(100) DEFAULT NULL COMMENT '登录设备信息',
    `location` VARCHAR(200) DEFAULT NULL COMMENT '登录地理位置',
    `status` TINYINT DEFAULT 1 COMMENT '登录状态：0-失败，1-成功',
    `failure_reason` VARCHAR(100) DEFAULT NULL COMMENT '失败原因（仅失败时有值）',
    `session_id` VARCHAR(100) DEFAULT NULL COMMENT '会话ID',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_ip` (`ip`),
    KEY `idx_status` (`status`),
    KEY `idx_login_type` (`login_type`),
    KEY `idx_provider` (`provider`),
    KEY `idx_create_date` (`create_date`),
    CONSTRAINT `fk_login_log_user_id` FOREIGN KEY (`user_id`) REFERENCES `uc_account` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- 临时票据表 - iam_auth_ticket
CREATE TABLE `iam_auth_ticket` (
    `id` BIGINT NOT NULL COMMENT '票据ID，不使用自动增长',
    `user_id` BIGINT NOT NULL COMMENT '用户ID，关联account表',
    `ticket` VARCHAR(255) NOT NULL COMMENT '认证票据（加密或哈希）',
    `ticket_type` VARCHAR(20) DEFAULT 'access' COMMENT '票据类型：access-访问票据，verification-验证票据',
    `scope` VARCHAR(100) DEFAULT NULL COMMENT '票据授权范围',
    `client_id` VARCHAR(50) DEFAULT NULL COMMENT '客户端ID（第三方应用标识）',
    `expires_at` DATETIME NOT NULL COMMENT '票据过期时间',
    `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
    `status` TINYINT DEFAULT 1 COMMENT '票据状态：0-已失效，1-有效，2-已使用',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ticket` (`ticket`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_ticket_type` (`ticket_type`),
    KEY `idx_client_id` (`client_id`),
    KEY `idx_expires_at` (`expires_at`),
    KEY `idx_status` (`status`),
    KEY `idx_create_date` (`create_date`),
    CONSTRAINT `fk_ticket_user_id` FOREIGN KEY (`user_id`) REFERENCES `uc_account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='临时票据表';

-- 用户认证token表 - iam_auth_token
CREATE TABLE `iam_auth_token` (
    `id` BIGINT NOT NULL COMMENT '认证token ID，不使用自动增长',
    `user_id` BIGINT NOT NULL COMMENT '用户ID，关联account表',
    `token_hash` VARCHAR(64) NOT NULL COMMENT 'Token哈希值（用于验证，不存储原始token）',
    `token_type` VARCHAR(20) DEFAULT 'bearer' COMMENT 'Token类型：bearer、jwt等',
    `device_id` VARCHAR(100) DEFAULT NULL COMMENT '设备标识',
    `client_info` TEXT DEFAULT NULL COMMENT '客户端信息JSON',
    `scope` VARCHAR(100) DEFAULT NULL COMMENT 'Token授权范围',
    `expires_at` DATETIME NOT NULL COMMENT 'Token过期时间',
    `last_used_at` DATETIME DEFAULT NULL COMMENT '最后使用时间',
    `status` TINYINT DEFAULT 1 COMMENT 'Token状态：0-已失效，1-有效',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token_hash` (`token_hash`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_device_id` (`device_id`),
    KEY `idx_token_type` (`token_type`),
    KEY `idx_expires_at` (`expires_at`),
    KEY `idx_status` (`status`),
    KEY `idx_last_used_at` (`last_used_at`),
    KEY `idx_create_date` (`create_date`),
    CONSTRAINT `fk_auth_token_user_id` FOREIGN KEY (`user_id`) REFERENCES `uc_account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证Token表';

-- 创建视图：用户完整信息视图
CREATE VIEW `v_user_info` AS
SELECT 
    a.id,
    a.username,
    a.login_name,
    a.email_masked,
    a.phone_masked,
    a.email_verified,
    a.phone_verified,
    a.avatar,
    a.status,
    a.create_date as account_create_date,
    
    p.real_name,
    p.gender,
    p.birth_date,
    p.education,
    p.profession,
    p.location,
    p.bio,
    p.school_id,
    (SELECT COUNT(*) FROM iam_oauth_account o WHERE o.user_id = a.id AND o.status = 'active') as oauth_bindings_count,
    (SELECT GROUP_CONCAT(o.provider) FROM iam_oauth_account o WHERE o.user_id = a.id AND o.status = 'active') as oauth_providers
FROM iam_account a
LEFT JOIN iam_user_profile p ON a.id = p.user_id
WHERE a.status != 9;

-- 菜单表 - iam_menu
CREATE TABLE `iam_menu` (
    `tenant_id` BIGINT NOT NULL COMMENT '租户ID',
    `id` BIGINT NOT NULL COMMENT '菜单ID，不使用自动增长',
    `pid` BIGINT DEFAULT 0 COMMENT '父菜单ID，一级菜单为0',
    `name` VARCHAR(100) NOT NULL COMMENT '菜单名称',
    `icon` VARCHAR(100) DEFAULT NULL COMMENT '菜单图标',
    `path` VARCHAR(255) DEFAULT NULL COMMENT '菜单路径',
    `type` VARCHAR(20) DEFAULT 'menu' COMMENT '菜单类型：directory-目录，menu-菜单，button-按钮',
    `sort_num` DOUBLE DEFAULT 0 COMMENT '菜单排序号，越小越靠前',
    `status` VARCHAR(20) DEFAULT 'enabled' COMMENT '菜单状态：enabled-启用，disabled-禁用',
    `create_by` BIGINT DEFAULT NULL COMMENT '创建人ID',
    `create_date` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT DEFAULT NULL COMMENT '更新人ID',
    `update_date` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`tenant_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';

