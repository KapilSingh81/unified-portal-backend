-- Reference DDL (Sequelize sync ka verified output). Normally ise run karne ki zaroorat nahi,
-- server start par sync() khud bana deta hai. Order important hai (FK dependency).

CREATE TABLE role_master (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL REFERENCES company_master (id),
  name NVARCHAR(100) NOT NULL,
  status BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE user_master (
  id CHAR(36) NOT NULL PRIMARY KEY,
  company_id CHAR(36) NOT NULL REFERENCES company_master (id),
  role_id CHAR(36) NOT NULL REFERENCES role_master (id),
  user_name NVARCHAR(100) NOT NULL,
  password NVARCHAR(255) NOT NULL,
  status BIT NOT NULL DEFAULT 1,
  is_deleted BIT NOT NULL DEFAULT 0
);

CREATE TABLE parent_user_mapping (
  id CHAR(36) NOT NULL PRIMARY KEY,
  parent_user_id CHAR(36) NOT NULL REFERENCES user_master (id),
  child_user_id CHAR(36) NOT NULL REFERENCES user_master (id)
);
CREATE UNIQUE INDEX UQ_parent_user_mapping_pair ON parent_user_mapping (parent_user_id, child_user_id);

CREATE TABLE role_menu_mapping (
  id CHAR(36) NOT NULL PRIMARY KEY,
  role_id CHAR(36) NOT NULL REFERENCES role_master (id),
  menu_id CHAR(36) NOT NULL REFERENCES menu_master (id)
);
CREATE UNIQUE INDEX UQ_role_menu_mapping_pair ON role_menu_mapping (role_id, menu_id);

CREATE TABLE role_permission_mapping (
  id CHAR(36) NOT NULL PRIMARY KEY,
  role_id CHAR(36) NOT NULL REFERENCES role_master (id),
  menu_id CHAR(36) NOT NULL REFERENCES menu_master (id),
  can_view BIT NOT NULL DEFAULT 0,
  can_edit BIT NOT NULL DEFAULT 0,
  can_delete BIT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX UQ_role_permission_mapping_pair ON role_permission_mapping (role_id, menu_id);

CREATE TABLE all_log (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL REFERENCES user_master (id),
  table_name NVARCHAR(100) NOT NULL,
  action_type NVARCHAR(20) NOT NULL,
  record_id NVARCHAR(100) NULL,
  old_values NVARCHAR(MAX) NULL,
  new_values NVARCHAR(MAX) NULL,
  created_at DATETIMEOFFSET NOT NULL
);
