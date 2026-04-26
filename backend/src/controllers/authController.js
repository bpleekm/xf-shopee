const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { ApiResponse, asyncHandler } = require('../utils/response');

class AuthController {
  static getUserPermissions = asyncHandler(async (req, res) => {
    const userRoles = await Role.getUserRoles(req.user.id);

    const permissions = new Map();

    for (const role of userRoles) {
      const rolePermissions = await Role.getRolePermissions(role.id);
      for (const perm of rolePermissions) {
        permissions.set(perm.code, perm);
      }
    }

    const permissionsArray = Array.from(permissions.values());

    return res.status(200).json(
      ApiResponse.success({ permissions: permissionsArray, roles: userRoles }, '获取用户权限成功').toJSON()
    );
  });

  static checkPermission = asyncHandler(async (req, res) => {
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(422).json(
        ApiResponse.error('权限代码列表是必填项').toJSON()
      );
    }

    const hasPermission = await Role.userHasPermission(req.user.id, permissions);

    return res.status(200).json(
      ApiResponse.success({ hasPermission, requiredPermissions: permissions }, '权限检查完成').toJSON()
    );
  });

  static getResources = asyncHandler(async (req, res) => {
    const resources = await Permission.getResources();

    return res.status(200).json(
      ApiResponse.success({ resources }, '获取资源分类成功').toJSON()
    );
  });

  static getRoles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, systemRole, search } = req.query;

    const result = await Role.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      systemRole: systemRole !== undefined ? systemRole === 'true' : undefined,
      search
    });

    return res.status(200).json(
      ApiResponse.success(result, '获取角色列表成功').toJSON()
    );
  });

  static getRoleById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const role = await Role.findById(parseInt(id));

    if (!role) {
      return res.status(404).json(ApiResponse.notFound('角色不存在').toJSON());
    }

    const permissions = await Role.getRolePermissions(role.id);

    return res.status(200).json(
      ApiResponse.success({ role: { ...role, permissions } }, '获取角色详情成功').toJSON()
    );
  });

  static createRole = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
      return res.status(422).json(
        ApiResponse.error('角色名称是必填项').toJSON()
      );
    }

    const existingRole = await Role.findByName(name);
    if (existingRole) {
      return res.status(409).json(
        ApiResponse.error('角色名称已存在').toJSON()
      );
    }

    const role = await Role.create({
      name,
      description: description || '',
      is_system_role: false
    });

    return res.status(201).json(
      ApiResponse.success({ role }, '角色创建成功').toJSON()
    );
  });

  static updateRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingRole = await Role.findById(parseInt(id));
    if (!existingRole) {
      return res.status(404).json(ApiResponse.notFound('角色不存在').toJSON());
    }

    if (existingRole.is_system_role) {
      return res.status(403).json(
        ApiResponse.error('系统角色不允许修改').toJSON()
      );
    }

    if (name && name !== existingRole.name) {
      const roleWithName = await Role.findByName(name);
      if (roleWithName) {
        return res.status(409).json(
          ApiResponse.error('角色名称已存在').toJSON()
        );
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const role = await Role.update(parseInt(id), updateData);

    return res.status(200).json(
      ApiResponse.success({ role }, '角色更新成功').toJSON()
    );
  });

  static deleteRole = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const role = await Role.findById(parseInt(id));
    if (!role) {
      return res.status(404).json(ApiResponse.notFound('角色不存在').toJSON());
    }

    if (role.is_system_role) {
      return res.status(403).json(
        ApiResponse.error('系统角色不允许删除').toJSON()
      );
    }

    const deleted = await Role.delete(parseInt(id));
    if (!deleted) {
      return res.status(500).json(
        ApiResponse.error('角色删除失败').toJSON()
      );
    }

    return res.status(200).json(
      ApiResponse.success(null, '角色删除成功').toJSON()
    );
  });

  static assignPermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(422).json(
        ApiResponse.error('权限ID列表是必填项').toJSON()
      );
    }

    const role = await Role.findById(parseInt(id));
    if (!role) {
      return res.status(404).json(ApiResponse.notFound('角色不存在').toJSON());
    }

    const assignedCount = await Role.assignPermissions(parseInt(id), permissionIds);

    return res.status(200).json(
      ApiResponse.success({ assignedCount, roleId: parseInt(id) }, `成功分配 ${assignedCount} 个权限`).toJSON()
    );
  });

  static removePermissions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(422).json(
        ApiResponse.error('权限ID列表是必填项').toJSON()
      );
    }

    const role = await Role.findById(parseInt(id));
    if (!role) {
      return res.status(404).json(ApiResponse.notFound('角色不存在').toJSON());
    }

    const removedCount = await Role.removePermissions(parseInt(id), permissionIds);

    return res.status(200).json(
      ApiResponse.success({ removedCount, roleId: parseInt(id) }, `成功移除 ${removedCount} 个权限`).toJSON()
    );
  });

  static getPermissionList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, resource, action, search } = req.query;

    const result = await Permission.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      resource,
      action,
      search
    });

    return res.status(200).json(
      ApiResponse.success(result, '获取权限列表成功').toJSON()
    );
  });

  static createPermission = asyncHandler(async (req, res) => {
    const { code, name, description, resource, action } = req.body;

    if (!code || !name || !resource || !action) {
      return res.status(422).json(
        ApiResponse.error('权限代码、名称、资源和操作是必填项').toJSON()
      );
    }

    const existingPermission = await Permission.findByCode(code);
    if (existingPermission) {
      return res.status(409).json(
        ApiResponse.error('权限代码已存在').toJSON()
      );
    }

    const permission = await Permission.create({
      code,
      name,
      description: description || '',
      resource,
      action
    });

    return res.status(201).json(
      ApiResponse.success({ permission }, '权限创建成功').toJSON()
    );
  });

  static updatePermission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, resource, action } = req.body;

    const permission = await Permission.findById(parseInt(id));
    if (!permission) {
      return res.status(404).json(ApiResponse.notFound('权限不存在').toJSON());
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (resource) updateData.resource = resource;
    if (action) updateData.action = action;

    const updatedPermission = await Permission.update(parseInt(id), updateData);

    return res.status(200).json(
      ApiResponse.success({ permission: updatedPermission }, '权限更新成功').toJSON()
    );
  });

  static deletePermission = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const permission = await Permission.findById(parseInt(id));
    if (!permission) {
      return res.status(404).json(ApiResponse.notFound('权限不存在').toJSON());
    }

    const isUsed = await Permission.isUsed(parseInt(id));
    if (isUsed) {
      return res.status(400).json(
        ApiResponse.error('权限已被角色使用，无法删除').toJSON()
      );
    }

    const deleted = await Permission.delete(parseInt(id));
    if (!deleted) {
      return res.status(500).json(
        ApiResponse.error('权限删除失败').toJSON()
      );
    }

    return res.status(200).json(
      ApiResponse.success(null, '权限删除成功').toJSON()
    );
  });

  static getUserRoles = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    const roles = await Role.getUserRoles(parseInt(userId));

    return res.status(200).json(
      ApiResponse.success({ userId: parseInt(userId), roles }, '获取用户角色成功').toJSON()
    );
  });

  static assignUserRoles = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(422).json(
        ApiResponse.error('角色ID列表是必填项').toJSON()
      );
    }

    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    const assignedCount = await Role.assignUserRoles(parseInt(userId), roleIds);

    return res.status(200).json(
      ApiResponse.success({ assignedCount, userId: parseInt(userId) }, `成功分配 ${assignedCount} 个角色`).toJSON()
    );
  });

  static removeUserRoles = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(422).json(
        ApiResponse.error('角色ID列表是必填项').toJSON()
      );
    }

    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json(ApiResponse.notFound('用户不存在').toJSON());
    }

    const removedCount = await Role.removeUserRoles(parseInt(userId), roleIds);

    return res.status(200).json(
      ApiResponse.success({ removedCount, userId: parseInt(userId) }, `成功移除 ${removedCount} 个角色`).toJSON()
    );
  });
}

module.exports = AuthController;
