-- 组织模块 MySQL DDL
-- 根据 src/nservers/org/schema.md 生成
-- 表名前缀：org_
-- 注意：ID 字段不使用 AUTO_INCREMENT，由应用程序生成
-- 注意：不使用外键约束，由应用程序保证数据完整性

-- 区域表
DROP TABLE IF EXISTS `org_area`;
CREATE TABLE `org_area` (
    `id` BIGINT PRIMARY KEY COMMENT '区域ID',
    `tenant_id` BIGINT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '区域名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '区域代码',
    `pid` BIGINT DEFAULT NULL COMMENT '父区域ID',
    `level` INT DEFAULT 1 COMMENT '区域级别',
    `sort_num` DOUBLE DEFAULT 0 COMMENT '排序号',
    `create_by` BIGINT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_pid` (`pid`),
    INDEX `idx_code` (`code`),
    INDEX `idx_sort_num` (`sort_num`),
    UNIQUE KEY `uk_tenant_code` (`tenant_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='区域表';

-- 组织表
DROP TABLE IF EXISTS `org_org`;
CREATE TABLE `org_org` (
    `id` BIGINT PRIMARY KEY COMMENT '组织ID',
    `tenant_id` BIGINT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '组织名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '组织代码',
    `type` VARCHAR(20) DEFAULT 'default' COMMENT '组织类型',
    `pid` BIGINT DEFAULT NULL COMMENT '父组织ID',
    `area_id` BIGINT DEFAULT NULL COMMENT '区域ID',
    `sort_num` DOUBLE DEFAULT 0 COMMENT '排序号，pid相同时，按sort_num升序排列',
    `ext` JSON DEFAULT NULL COMMENT '扩展属性',
    `create_by` BIGINT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` BIGINT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_pid` (`pid`),
    INDEX `idx_area_id` (`area_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_code` (`code`),
    INDEX `idx_sort_num` (`sort_num`),
    UNIQUE KEY `uk_tenant_code` (`tenant_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织表';

-- 部门表
DROP TABLE IF EXISTS `org_department`;
CREATE TABLE `org_department` (
    `id` INT PRIMARY KEY COMMENT '部门ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '部门代码，不为空时唯一',
    `org_id` INT NOT NULL COMMENT '组织ID',
    `pid` INT DEFAULT NULL COMMENT '父部门ID',
    `sort_num` DOUBLE DEFAULT 0 COMMENT '排序号，pid相同时，按sort_num升序排列',
    `ext` JSON DEFAULT NULL COMMENT '扩展属性',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_pid` (`pid`),
    INDEX `idx_code` (`code`),
    INDEX `idx_sort_num` (`sort_num`),
    UNIQUE KEY `uk_tenant_code` (`tenant_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';

-- 学校表
DROP TABLE IF EXISTS `org_school`;
CREATE TABLE `org_school` (
    `id` INT PRIMARY KEY COMMENT '学校ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '学校名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '学校代码',
    `type` VARCHAR(20) DEFAULT 'school' COMMENT '组织类型',
    `pid` INT DEFAULT NULL COMMENT '父组织ID',
    `area_id` INT DEFAULT NULL COMMENT '区域ID',
    `school_type` VARCHAR(20) DEFAULT NULL COMMENT '学校类型（如：小学、中学、高中、大学等）',
    `school_stage` VARCHAR(20) DEFAULT NULL COMMENT '学段（如：小学、初中、高中、大学等）',
    `school_level` VARCHAR(20) DEFAULT NULL COMMENT '学校级别（如：公立、私立等）',
    `sort_num` DOUBLE DEFAULT 0 COMMENT '排序号',
    `ext` JSON DEFAULT NULL COMMENT '扩展属性（包括学校代码、地址、电话、邮箱、官网、Logo等）',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_pid` (`pid`),
    INDEX `idx_area_id` (`area_id`),
    INDEX `idx_school_type` (`school_type`),
    INDEX `idx_school_stage` (`school_stage`),
    INDEX `idx_code` (`code`),
    INDEX `idx_sort_num` (`sort_num`),
    UNIQUE KEY `uk_tenant_code` (`tenant_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学校表';

-- 群组模板表
DROP TABLE IF EXISTS `org_group_template`;
CREATE TABLE `org_group_template` (
    `id` INT PRIMARY KEY COMMENT '群组模板ID',
    `name` VARCHAR(100) NOT NULL COMMENT '群组模板名称',
    `description` TEXT DEFAULT NULL COMMENT '群组模板描述',
    `type` VARCHAR(20) NOT NULL UNIQUE COMMENT '群组模板类型，唯一',
    `config` JSON NOT NULL COMMENT '群组配置（权限、角色等）',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组模板表';

-- 群组表
DROP TABLE IF EXISTS `org_group`;
CREATE TABLE `org_group` (
    `id` INT PRIMARY KEY COMMENT '群组ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '群组名称',
    `org_id` INT NOT NULL COMMENT '组织ID',
    `owner_id` INT NOT NULL COMMENT '群组所有者ID',
    `type` VARCHAR(20) NOT NULL COMMENT '群组类型，对应group_template.type',
    `description` TEXT DEFAULT NULL COMMENT '群组描述',
    `config` JSON DEFAULT NULL COMMENT '群组配置',
    `ext` JSON DEFAULT NULL COMMENT '扩展属性',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_owner_id` (`owner_id`),
    INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组表';

-- 群成员表
DROP TABLE IF EXISTS `org_group_member`;
CREATE TABLE `org_group_member` (
    `id` INT PRIMARY KEY COMMENT '群成员ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `group_id` INT NOT NULL COMMENT '群组ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `nick_name` VARCHAR(50) DEFAULT NULL COMMENT '群昵称',
    `role` VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_role` (`role`),
    INDEX `idx_status` (`status`),
    UNIQUE KEY `uk_group_user` (`group_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- 组织用户表
DROP TABLE IF EXISTS `org_user`;
CREATE TABLE `org_user` (
    `id` INT PRIMARY KEY COMMENT '组织用户ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `org_id` INT NOT NULL COMMENT '组织ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `role` VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_role` (`role`),
    UNIQUE KEY `uk_org_user` (`org_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织用户表';

-- 班级表（继承自群组）
DROP TABLE IF EXISTS `org_class`;
CREATE TABLE `org_class` (
    `id` INT PRIMARY KEY COMMENT '班级ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `name` VARCHAR(100) NOT NULL COMMENT '班级名称',
    `org_id` INT NOT NULL COMMENT '组织ID',
    `school_id` INT NOT NULL COMMENT '学校ID',
    `owner_id` INT NOT NULL COMMENT '班级所有者ID',
    `type` VARCHAR(20) NOT NULL DEFAULT 'class' COMMENT '群组类型',
    `grade` VARCHAR(20) DEFAULT NULL COMMENT '年级',
    `class_code` VARCHAR(50) DEFAULT NULL COMMENT '班级代码',
    `class_type` VARCHAR(20) DEFAULT NULL COMMENT '班级类型（如：普通班、实验班、特长班等）',
    `description` TEXT DEFAULT NULL COMMENT '班级描述',
    `config` JSON DEFAULT NULL COMMENT '班级配置',
    `ext` JSON DEFAULT NULL COMMENT '扩展属性',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_org_id` (`org_id`),
    INDEX `idx_school_id` (`school_id`),
    INDEX `idx_owner_id` (`owner_id`),
    INDEX `idx_grade` (`grade`),
    INDEX `idx_class_code` (`class_code`),
    UNIQUE KEY `uk_school_class_code` (`school_id`, `class_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- 班级成员表（继承自群成员）
DROP TABLE IF EXISTS `org_class_member`;
CREATE TABLE `org_class_member` (
    `id` INT PRIMARY KEY COMMENT '班级成员ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `class_id` INT NOT NULL COMMENT '班级ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `nick_name` VARCHAR(50) DEFAULT NULL COMMENT '班级昵称',
    `role` VARCHAR(20) NOT NULL DEFAULT 'student' COMMENT '角色',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态',
    `seat_number` INT DEFAULT NULL COMMENT '座位号',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_class_id` (`class_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_role` (`role`),
    INDEX `idx_status` (`status`),
    INDEX `idx_seat_number` (`seat_number`),
    UNIQUE KEY `uk_class_user` (`class_id`, `user_id`),
    UNIQUE KEY `uk_class_seat` (`class_id`, `seat_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级成员表';

-- 群组成员申请记录表
DROP TABLE IF EXISTS `org_group_member_request`;
CREATE TABLE `org_group_member_request` (
    `id` INT PRIMARY KEY COMMENT '申请记录ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `group_id` INT NOT NULL COMMENT '群组ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '申请状态（pending, approved, rejected）',
    `reason` TEXT DEFAULT NULL COMMENT '申请理由',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_create_date` (`create_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员申请记录表';

-- 群组成员邀请记录表
DROP TABLE IF EXISTS `org_group_member_invite`;
CREATE TABLE `org_group_member_invite` (
    `id` INT PRIMARY KEY COMMENT '邀请记录ID',
    `tenant_id` INT NOT NULL COMMENT '租户ID',
    `group_id` INT NOT NULL COMMENT '群组ID',
    `inviter_id` INT NOT NULL COMMENT '邀请人ID',
    `invitee_id` INT NOT NULL COMMENT '被邀请人ID',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '邀请状态（pending, accepted, rejected）',
    `create_by` INT NOT NULL COMMENT '创建人',
    `create_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by` INT NOT NULL COMMENT '更新人',
    `update_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引
    INDEX `idx_tenant_id` (`tenant_id`),
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_inviter_id` (`inviter_id`),
    INDEX `idx_invitee_id` (`invitee_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_create_date` (`create_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群组成员邀请记录表';

-- 插入默认群组模板数据
INSERT INTO `org_group_template` (`id`, `name`, `description`, `type`, `config`, `create_by`, `update_by`) VALUES
(1, '普通群模板', '普通群组模板', 'normal', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": false, "allow_invite_members": true, "readonly_allow_invite_members": false, "allow_leave": true, "readonly_allow_leave": false, "allow_join_request": true, "readonly_allow_join_request": false, "max_members": 500, "roles": [{"name": "群主", "code": "owner", "permissions": ["*"]}, {"name": "管理员", "code": "admin", "permissions": ["manage_members", "delete_messages"]}, {"name": "成员", "code": "member", "permissions": ["send_message"]}]}', 1, 1),
(2, '组织群模板', '组织群组模板', 'org', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": true, "allow_invite_members": false, "readonly_allow_invite_members": true, "allow_leave": false, "readonly_allow_leave": true, "allow_join_request": false, "readonly_allow_join_request": true, "max_members": 1000, "roles": [{"name": "群主", "code": "owner", "permissions": ["*"]}, {"name": "管理员", "code": "admin", "permissions": ["manage_members", "delete_messages"]}, {"name": "成员", "code": "member", "permissions": ["send_message"]}]}', 1, 1),
(3, '课程群模板', '课程群组模板', 'course', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": false, "allow_invite_members": true, "readonly_allow_invite_members": false, "allow_leave": true, "readonly_allow_leave": false, "allow_join_request": true, "readonly_allow_join_request": false, "max_members": 200, "roles": [{"name": "老师", "code": "teacher", "permissions": ["*"]}, {"name": "助教", "code": "assistant", "permissions": ["manage_members", "delete_messages"]}, {"name": "学生", "code": "student", "permissions": ["send_message"]}]}', 1, 1),
(4, '培训群模板', '培训群组模板', 'training', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": false, "allow_invite_members": true, "readonly_allow_invite_members": false, "allow_leave": true, "readonly_allow_leave": false, "allow_join_request": true, "readonly_allow_join_request": false, "max_members": 300, "roles": [{"name": "培训师", "code": "trainer", "permissions": ["*"]}, {"name": "助教", "code": "assistant", "permissions": ["manage_members", "delete_messages"]}, {"name": "学员", "code": "trainee", "permissions": ["send_message"]}]}', 1, 1),
(5, '班级群模板', '班级群组模板', 'class', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": true, "allow_invite_members": false, "readonly_allow_invite_members": true, "allow_leave": false, "readonly_allow_leave": true, "allow_join_request": false, "readonly_allow_join_request": true, "max_members": 100, "roles": [{"name": "班主任", "code": "head_teacher", "permissions": ["*"]}, {"name": "老师", "code": "teacher", "permissions": ["manage_members", "delete_messages", "send_announcement"]}, {"name": "学生", "code": "student", "permissions": ["send_message"]}, {"name": "家长", "code": "parent", "permissions": ["send_message", "view_announcement"]}]}', 1, 1),
(6, '教研群模板', '教研群组模板', 'research', '{"allow_owner_add_members": true, "allow_add_members": true, "readonly_allow_add_members": false, "allow_invite_members": true, "readonly_allow_invite_members": false, "allow_leave": true, "readonly_allow_leave": false, "allow_join_request": true, "readonly_allow_join_request": false, "max_members": 50, "roles": [{"name": "组长", "code": "leader", "permissions": ["*"]}, {"name": "成员", "code": "member", "permissions": ["send_message", "upload_file"]}]}', 1, 1);