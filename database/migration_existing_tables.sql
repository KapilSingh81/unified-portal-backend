-- Existing DB ke liye (sequelize.sync() purani tables me columns add NAHI karta).
-- Naye tables (role_master, user_master, parent_user_mapping, role_menu_mapping,
-- role_permission_mapping, all_log) server start par sync() se auto ban jaate hain.

-- 1) company_master.code  (CompanyCode UK)
IF COL_LENGTH('company_master', 'code') IS NULL
    ALTER TABLE company_master ADD code NVARCHAR(50) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_company_master_code')
    CREATE UNIQUE INDEX UQ_company_master_code ON company_master (code) WHERE code IS NOT NULL;
GO

-- 2) menu_master.parent_menu_id  (parent_of self relation)
IF COL_LENGTH('menu_master', 'parent_menu_id') IS NULL
    ALTER TABLE menu_master ADD parent_menu_id CHAR(36) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_menu_master_parent_menu')
    ALTER TABLE menu_master ADD CONSTRAINT FK_menu_master_parent_menu
        FOREIGN KEY (parent_menu_id) REFERENCES menu_master (id);
GO
