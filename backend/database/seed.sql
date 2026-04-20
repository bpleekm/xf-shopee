-- XF Shopee ERP 初始数据
-- 版本: 1.0.0
-- 创建日期: 2024-04-20

USE `xf_shopee`;

-- 插入默认角色
INSERT INTO `roles` (`id`, `name`, `description`, `level`) VALUES
(1, 'super_admin', '超级管理员', 0),
(2, 'user', '普通用户', 100),
(3, 'staff', '员工', 50),
(4, 'manager', '经理', 20);

-- 插入默认权限
INSERT INTO `permissions` (`id`, `name`, `description`, `module`, `action`) VALUES
-- 用户管理权限
(1, 'user.view', '查看用户', 'user', 'view'),
(2, 'user.create', '创建用户', 'user', 'create'),
(3, 'user.edit', '编辑用户', 'user', 'edit'),
(4, 'user.delete', '删除用户', 'user', 'delete'),
-- 产品管理权限
(5, 'product.view', '查看产品', 'product', 'view'),
(6, 'product.create', '创建产品', 'product', 'create'),
(7, 'product.edit', '编辑产品', 'product', 'edit'),
(8, 'product.delete', '删除产品', 'product', 'delete'),
-- 订单管理权限
(9, 'order.view', '查看订单', 'order', 'view'),
(10, 'order.create', '创建订单', 'order', 'create'),
(11, 'order.edit', '编辑订单', 'order', 'edit'),
(12, 'order.delete', '删除订单', 'order', 'delete'),
(13, 'order.process', '处理订单', 'order', 'process'),
-- 购物车权限
(14, 'cart.view', '查看购物车', 'cart', 'view'),
(15, 'cart.modify', '修改购物车', 'cart', 'modify'),
-- 系统管理权限
(16, 'system.config', '系统配置', 'system', 'config'),
(17, 'system.monitor', '系统监控', 'system', 'monitor');

-- 为超级管理员分配所有权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, id FROM `permissions`;

-- 为员工分配基本权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(3, 5),  -- product.view
(3, 9),  -- order.view
(3, 13), -- order.process
(3, 14), -- cart.view
(3, 15); -- cart.modify

-- 为经理分配更多权限
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 1),  -- user.view
(4, 5),  -- product.view
(4, 6),  -- product.create
(4, 7),  -- product.edit
(4, 9),  -- order.view
(4, 11), -- order.edit
(4, 13), -- order.process
(4, 14), -- cart.view
(4, 15); -- cart.modify

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role_id`, `status`) VALUES
(1, 'admin', 'admin@xfshopee.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeQ7nHw5W6B6bQJ9J7C6U5q1Jt1V1v1', '系统管理员', 1, 'active');

-- 插入测试用户 (密码: user123)
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `full_name`, `role_id`, `status`) VALUES
(2, 'testuser', 'user@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeQ7nHw5W6B6bQJ9J7C6U5q1Jt1V1v1', '测试用户', 2, 'active');

-- 插入产品分类
INSERT INTO `product_categories` (`id`, `parent_id`, `name`, `slug`, `description`, `sort_order`) VALUES
(1, NULL, '电子产品', 'electronics', '电子设备及配件', 1),
(2, NULL, '服装服饰', 'clothing', '服装、鞋帽、配饰', 2),
(3, NULL, '家居用品', 'home', '家居装饰、厨房用品', 3),
(4, NULL, '食品饮料', 'food', '食品、饮料、酒水', 4),
(5, 1, '手机', 'mobile-phones', '智能手机', 1),
(6, 1, '笔记本电脑', 'laptops', '便携式电脑', 2),
(7, 2, '男装', 'men-clothing', '男士服装', 1),
(8, 2, '女装', 'women-clothing', '女士服装', 2);

-- 插入示例产品
INSERT INTO `products` (`id`, `sku`, `name`, `description`, `category_id`, `brand`, `price`, `cost_price`, `stock_quantity`, `image_urls`, `attributes`) VALUES
(1, 'IPHONE14-128', 'iPhone 14 (128GB)', '苹果最新款智能手机，128GB存储空间', 5, 'Apple', 6999.00, 5500.00, 50, '["/images/iphone14-1.jpg", "/images/iphone14-2.jpg"]', '{"color": "黑色", "storage": "128GB", "screen_size": "6.1英寸"}'),
(2, 'MBP-M2-256', 'MacBook Pro M2 (256GB)', '苹果MacBook Pro笔记本电脑，M2芯片，256GB SSD', 6, 'Apple', 12999.00, 11000.00, 30, '["/images/mbp-m2-1.jpg"]', '{"color": "深空灰", "storage": "256GB", "screen_size": "13英寸"}'),
(3, 'TSHIRT-M-BLACK', '男士黑色T恤', '纯棉男士黑色短袖T恤，舒适透气', 7, '优衣库', 89.00, 45.00, 200, '["/images/tshirt-black-1.jpg"]', '{"color": "黑色", "size": "M", "material": "纯棉"}'),
(4, 'DRESS-W-RED', '女士红色连衣裙', '夏季女士红色连衣裙，时尚优雅', 8, 'ZARA', 299.00, 150.00, 80, '["/images/dress-red-1.jpg", "/images/dress-red-2.jpg"]', '{"color": "红色", "size": "S", "material": "聚酯纤维"}'),
(5, 'COFFEE-500G', '哥伦比亚咖啡豆 (500g)', '新鲜烘焙的哥伦比亚咖啡豆，中度烘焙', 4, '星巴克', 99.00, 60.00, 150, '["/images/coffee-1.jpg"]', '{"weight": "500g", "roast_level": "中度", "origin": "哥伦比亚"}');

-- 插入系统配置
INSERT INTO `system_settings` (`key`, `value`, `description`, `category`) VALUES
('store_name', '"XF Shopee"', '店铺名称', 'general'),
('store_contact_email', '"contact@xfshopee.com"', '联系邮箱', 'general'),
('store_contact_phone', '"400-123-4567"', '联系电话', 'general'),
('store_address', '{"street": "科技路123号", "city": "上海", "province": "上海市", "postal_code": "200000"}' , '店铺地址', 'general'),
('currency', '"CNY"', '货币单位', 'general'),
('tax_rate', '0.13', '税率', 'general'),
('shipping_fee', '10.00', '默认运费', 'shipping'),
('free_shipping_threshold', '199.00', '免运费门槛', 'shipping'),
('order_auto_cancel_hours', '24', '订单自动取消时间(小时)', 'order'),
('inventory_low_threshold', '10', '库存低阈值', 'inventory');

-- 创建测试订单
INSERT INTO `orders` (`order_number`, `user_id`, `status`, `total_amount`, `shipping_fee`, `final_amount`, `payment_method`, `payment_status`, `shipping_address`) VALUES
('ORD202404200001', 2, 'delivered', 7088.00, 0.00, 7088.00, 'alipay', 'paid', '{"recipient": "测试用户", "phone": "13800138000", "street": "测试地址123号", "city": "北京", "province": "北京市", "postal_code": "100000"}'),
('ORD202404200002', 2, 'processing', 299.00, 10.00, 309.00, 'wechat_pay', 'paid', '{"recipient": "测试用户", "phone": "13800138000", "street": "测试地址123号", "city": "北京", "province": "北京市", "postal_code": "100000"}');

-- 创建订单项
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_sku`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 'iPhone 14 (128GB)', 'IPHONE14-128', 1, 6999.00, 6999.00),
(1, 5, '哥伦比亚咖啡豆 (500g)', 'COFFEE-500G', 1, 89.00, 89.00),
(2, 4, '女士红色连衣裙', 'DRESS-W-RED', 1, 299.00, 299.00);

-- 创建库存变更记录
INSERT INTO `inventory_transactions` (`product_id`, `transaction_type`, `quantity_change`, `reference_id`, `reference_type`, `note`) VALUES
(1, 'sale', -1, 1, 'order', '订单销售'),
(5, 'sale', -1, 1, 'order', '订单销售'),
(4, 'sale', -1, 2, 'order', '订单销售');