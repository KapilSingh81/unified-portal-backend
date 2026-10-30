// Saare models + relations ek jagah. server.js isko import karta hai taaki sync() se sab tables ban jaayein.
import { companyModel } from "./companyModel.js";
import { domainModel } from "./domainModel.js";
import { moduleModel } from "./moudleModel.js";
import { menuModel } from "./menuMasterModel.js";
import { roleModel } from "./roleModel.js";
import { userModel } from "./userModel.js";
import { parentUserMappingModel } from "./parentUserMappingModel.js";
import { roleMenuMappingModel } from "./roleMenuMappingModel.js";
import { rolePermissionMappingModel } from "./rolePermissionMappingModel.js";
import { allLogModel } from "./allLogModel.js";

// MSSQL: multiple cascade paths error se bachne ke liye sab FK NO ACTION.
const rel = (foreignKey, as) => ({ foreignKey, as, onDelete: "NO ACTION", onUpdate: "NO ACTION" });

// Company 1 -> * Domain / Role / UserMaster
companyModel.hasMany(domainModel, rel("company_id", "domains"));
domainModel.belongsTo(companyModel, rel("company_id", "company"));

companyModel.hasMany(roleModel, rel("company_id", "roles"));
roleModel.belongsTo(companyModel, rel("company_id", "company"));

companyModel.hasMany(userModel, rel("company_id", "users"));
userModel.belongsTo(companyModel, rel("company_id", "company"));

// Role 1 -> * UserMaster
roleModel.hasMany(userModel, rel("role_id", "users"));
userModel.belongsTo(roleModel, rel("role_id", "role"));

// UserMaster <-> ParentUserMapping (parent / child)
userModel.hasMany(parentUserMappingModel, rel("parent_user_id", "childMappings"));
parentUserMappingModel.belongsTo(userModel, rel("parent_user_id", "parent"));
userModel.hasMany(parentUserMappingModel, rel("child_user_id", "parentMappings"));
parentUserMappingModel.belongsTo(userModel, rel("child_user_id", "child"));

// UserMaster 1 -> * AllLog (actor)
userModel.hasMany(allLogModel, rel("user_id", "logs"));
allLogModel.belongsTo(userModel, rel("user_id", "actor"));

// Role / Menu -> RoleMenuMapping
roleModel.hasMany(roleMenuMappingModel, rel("role_id", "menuMappings"));
roleMenuMappingModel.belongsTo(roleModel, rel("role_id", "role"));
menuModel.hasMany(roleMenuMappingModel, rel("menu_id", "roleMappings"));
roleMenuMappingModel.belongsTo(menuModel, rel("menu_id", "menu"));

// Role / Menu -> RolePermissionMapping (can_view / can_edit / can_delete)
roleModel.hasMany(rolePermissionMappingModel, rel("role_id", "permissionMappings"));
rolePermissionMappingModel.belongsTo(roleModel, rel("role_id", "role"));
menuModel.hasMany(rolePermissionMappingModel, rel("menu_id", "rolePermissions"));
rolePermissionMappingModel.belongsTo(menuModel, rel("menu_id", "menu"));

export {
    companyModel,
    domainModel,
    moduleModel,
    menuModel,
    roleModel,
    userModel,
    parentUserMappingModel,
    roleMenuMappingModel,
    rolePermissionMappingModel,
    allLogModel,
};
