import ResponseService from "../utils/httpService.js";
import { roleModel, moduleModel, menuModel } from "../models/index.js";
import { FLAGS, getEffectivePermissions } from "../utils/permission.js";

const ADMIN_ROLES = ['admin', 'super admin', 'superadmin'];

export const buildUserMenus = async (userId, roleId) => {
    const role = await roleModel.findOne({ where: { id: roleId, is_deleted: false }, raw: true });
    if (!role) return null;
    const isAdmin = ADMIN_ROLES.includes(role.name.trim().toLowerCase());

    const modules = await moduleModel.findAll({
        where: { is_deleted: false, is_portal: true },
        attributes: ['id', 'name', 'url', 'icon'],
        order: [['name', 'ASC']],
        raw: true,
    });
    const moduleIds = modules.map((m) => m.id);

    const menus = moduleIds.length
        ? await menuModel.findAll({
            where: { is_deleted: false, module_id: moduleIds },
            attributes: ['id', 'name', 'url', 'icon', 'module_id', 'parent_menu_id'],
            order: [['name', 'ASC']],
            raw: true,
        })
        : [];

    const effective = isAdmin ? new Map() : await getEffectivePermissions(userId, roleId);
    const flagsOf = (menuId) =>
        Object.fromEntries(FLAGS.map((f) => [f, isAdmin ? true : (effective.get(menuId)?.[f] ?? false)]));

    // visible menus + their parents
    const menuById = new Map(menus.map((m) => [m.id, m]));
    const visible = new Set();
    for (const m of menus) {
        if (!isAdmin && !effective.get(m.id)?.can_view) continue;
        visible.add(m.id);
        let parentId = m.parent_menu_id;
        while (parentId && menuById.has(parentId) && !visible.has(parentId)) {
            visible.add(parentId);
            parentId = menuById.get(parentId).parent_menu_id;
        }
    }

    // build tree
    const nodes = new Map();
    for (const m of menus) {
        if (visible.has(m.id)) nodes.set(m.id, { ...m, ...flagsOf(m.id), children: [] });
    }
    const rootsByModule = new Map();
    for (const node of nodes.values()) {
        const parent = node.parent_menu_id && nodes.get(node.parent_menu_id);
        if (parent) parent.children.push(node);
        else {
            if (!rootsByModule.has(node.module_id)) rootsByModule.set(node.module_id, []);
            rootsByModule.get(node.module_id).push(node);
        }
    }

    // shape that the sidebar (MenuItem) already understands
    const toItem = (m) => ({
        id: m.id,
        label: m.name,
        route: m.url ?? undefined,
        iconPath: m.icon ?? undefined,
        can_view: m.can_view,
        can_add: m.can_add,
        can_edit: m.can_edit,
        can_delete: m.can_delete,
        children: m.children.length ? m.children.map(toItem) : undefined,
    });

    const modulesWithMenus = new Set(menus.map((m) => m.module_id));

    const data = modules
        .filter((m) => !modulesWithMenus.has(m.id) || rootsByModule.has(m.id))
        .map((m) => {
            const roots = rootsByModule.get(m.id) ?? [];
            return roots.length
                ? { id: m.id, label: m.name, iconPath: m.icon ?? undefined, children: roots.map(toItem) }
                : { id: m.id, label: m.name, route: m.url ?? undefined, iconPath: m.icon ?? undefined };
        });

    return { is_admin: isAdmin, modules: data };
};

const MyMenus = async (req, res) => {
    try {
        const result = await buildUserMenus(req.userId, req.roleId);
        if (!result) return ResponseService.notFound(res, 'Role not found');
        return ResponseService.success(res, 'Success', result);
    } catch (error) {
        console.error('MyMenus error:', error);
        return ResponseService.error(res, error.message);
    }
};

export { MyMenus };