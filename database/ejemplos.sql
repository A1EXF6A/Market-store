-- Script SQL para generar datos de ejemplo
-- Base de datos de sistema de gestión/marketplace

-- Insertar usuarios con diferentes roles
INSERT INTO users (national_id, first_name, last_name, email, phone, address, gender, role, status, password_hash, verified, created_at) VALUES
-- Compradores
('12345678', 'Juan', 'Pérez', 'juan.perez@email.com', '+1234567890', 'Calle 123, Ciudad', 'male', 'buyer', 'active', '$2b$10$hash1', true, NOW()),
('87654321', 'María', 'González', 'maria.gonzalez@email.com', '+0987654321', 'Avenida 456, Ciudad', 'female', 'buyer', 'active', '$2b$10$hash2', true, NOW()),
('11223344', 'Carlos', 'López', 'carlos.lopez@email.com', '+1122334455', 'Plaza 789, Ciudad', 'male', 'buyer', 'active', '$2b$10$hash3', false, NOW()),

-- Vendedores
('99887766', 'Ana', 'Martín', 'ana.martin@email.com', '+9988776655', 'Boulevard 321, Ciudad', 'female', 'seller', 'active', '$2b$10$hash4', true, NOW()),
('55443322', 'Luis', 'Rodríguez', 'luis.rodriguez@email.com', '+5544332211', 'Carrera 654, Ciudad', 'male', 'seller', 'active', '$2b$10$hash5', true, NOW()),
('77665544', 'Sofia', 'Hernández', 'sofia.hernandez@email.com', '+7766554433', 'Diagonal 987, Ciudad', 'female', 'seller', 'suspended', '$2b$10$hash6', true, NOW()),

-- Moderadores y Admins
('11111111', 'Admin', 'Principal', 'admin@sistema.com', '+1111111111', 'Oficina Central', 'other', 'admin', 'active', '$2b$10$hashadmin', true, NOW()),
('22222222', 'Moderador', 'Uno', 'mod1@sistema.com', '+2222222222', 'Oficina Moderación', 'male', 'moderator', 'active', '$2b$10$hashmod1', true, NOW());

-- Insertar items (productos y servicios)
INSERT INTO items (code, seller_id, type, name, description, price, location, availability, status, published_at) VALUES
-- Productos
('PROD001', 4, 'product', 'Laptop Gaming Asus ROG', 'Laptop para gaming con RTX 3060, 16GB RAM, SSD 512GB', 1299.99, 'Ciudad Norte', true, 'active', NOW()),
('PROD002', 4, 'product', 'iPhone 14 Pro', 'iPhone 14 Pro 256GB, color azul, como nuevo', 899.99, 'Ciudad Norte', true, 'active', NOW()),
('PROD003', 5, 'product', 'Bicicleta Montaña', 'Bicicleta de montaña Trek, 21 velocidades, muy buen estado', 450.00, 'Ciudad Sur', true, 'active', NOW()),
('PROD004', 5, 'product', 'Mesa de Oficina', 'Mesa de oficina de madera, 1.5m x 0.8m, con cajones', 180.00, 'Ciudad Sur', false, 'active', NOW()),

-- Servicios
('SERV001', 4, 'service', 'Clases de Programación', 'Clases particulares de programación en Python y JavaScript', 25.00, 'Online/Presencial', true, 'active', NOW()),
('SERV002', 5, 'service', 'Reparación de Computadoras', 'Servicio técnico especializado en reparación y mantenimiento', 40.00, 'Ciudad Centro', true, 'active', NOW()),
('SERV003', 6, 'service', 'Diseño Gráfico', 'Servicios de diseño gráfico y branding para empresas', 80.00, 'Ciudad Oeste', true, 'suspended', NOW());

-- Insertar servicios (tabla services para items de tipo service)
INSERT INTO services (item_id, working_hours) VALUES
(5, 'Lunes a Viernes: 6:00 PM - 9:00 PM, Sábados: 9:00 AM - 2:00 PM'),
(6, 'Lunes a Sábado: 8:00 AM - 6:00 PM'),
(7, 'Lunes a Viernes: 9:00 AM - 5:00 PM');

-- Insertar fotos de items
INSERT INTO item_photos (item_id, url) VALUES
(1, 'https://example.com/photos/laptop1_main.jpg'),
(1, 'https://example.com/photos/laptop1_side.jpg'),
(2, 'https://example.com/photos/iphone14_front.jpg'),
(2, 'https://example.com/photos/iphone14_back.jpg'),
(3, 'https://example.com/photos/bike_full.jpg'),
(4, 'https://example.com/photos/desk_front.jpg'),
(5, 'https://example.com/photos/programming_class.jpg'),
(6, 'https://example.com/photos/repair_service.jpg');

-- Insertar chats
INSERT INTO chats (buyer_id, seller_id, started_at) VALUES
(1, 4, NOW() - INTERVAL '2 days'),
(2, 4, NOW() - INTERVAL '1 day'),
(1, 5, NOW() - INTERVAL '3 hours'),
(3, 5, NOW() - INTERVAL '1 hour');

-- Insertar mensajes
INSERT INTO messages (chat_id, sender_id, content, sent_at) VALUES
-- Chat 1 (Juan pregunta sobre laptop)
(1, 1, '¡Hola! Me interesa la laptop gaming. ¿Está disponible?', NOW() - INTERVAL '2 days'),
(1, 4, 'Hola Juan, sí está disponible. ¿Tienes alguna pregunta específica?', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'),
(1, 1, '¿Cuánto tiempo de uso tiene? ¿Incluye algún juego?', NOW() - INTERVAL '2 days' + INTERVAL '1 hour'),
(1, 4, 'Tiene 6 meses de uso, muy cuidada. No incluye juegos pero puedo ayudarte con la instalación.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),

-- Chat 2 (María pregunta sobre iPhone)
(2, 2, 'Buenas, ¿el iPhone incluye cargador y caja original?', NOW() - INTERVAL '1 day'),
(2, 4, 'Hola María, sí incluye todo: cargador, caja y auriculares sin usar.', NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),

-- Chat 3 (Juan pregunta sobre bicicleta)
(3, 1, '¿La bicicleta necesita alguna reparación?', NOW() - INTERVAL '2 hours'),
(3, 5, 'No, está en perfectas condiciones. Recién cambié llantas.', NOW() - INTERVAL '1 hour');

-- Insertar favoritos
INSERT INTO favorites (user_id, item_id, saved_at) VALUES
(1, 1, NOW() - INTERVAL '3 days'),
(1, 3, NOW() - INTERVAL '2 days'),
(2, 2, NOW() - INTERVAL '1 day'),
(2, 5, NOW() - INTERVAL '6 hours'),
(3, 4, NOW() - INTERVAL '4 hours'),
(3, 6, NOW() - INTERVAL '2 hours');

-- Insertar ratings
INSERT INTO ratings (seller_id, buyer_id, score, comment, created_at) VALUES
(4, 1, 5, 'Excelente vendedor, muy responsable y el producto llegó en perfectas condiciones.', NOW() - INTERVAL '1 week'),
(4, 2, 4, 'Buen servicio, aunque tardó un poco en responder. El producto está como se describía.', NOW() - INTERVAL '5 days'),
(5, 1, 5, 'Súper recomendado! Muy profesional y puntual.', NOW() - INTERVAL '3 days'),
(5, 3, 3, 'Producto OK, pero la entrega fue un poco tardía.', NOW() - INTERVAL '2 days');

-- Insertar reportes
INSERT INTO reports (item_id, buyer_id, type, comment, reported_at) VALUES
(7, 1, 'inappropriate', 'El servicio no corresponde con lo ofrecido en la descripción.', NOW() - INTERVAL '1 day'),
(4, 2, 'spam', 'El vendedor está publicando el mismo producto múltiples veces.', NOW() - INTERVAL '2 hours');

-- Insertar incidentes
INSERT INTO incidents (item_id, reported_at, status, description, moderator_id, seller_id) VALUES
(7, NOW() - INTERVAL '1 day', 'suspended', 'Item suspendido por reportes de contenido inapropiado', 8, 6),
(4, NOW() - INTERVAL '2 hours', 'pending', 'Investigando reportes de spam', 8, 5);

-- Insertar apelaciones
INSERT INTO appeals (incident_id, seller_id, reason, created_at, reviewed) VALUES
(1, 6, 'Considero que la suspensión es injusta. El servicio que ofrezco es legítimo y tengo experiencia comprobable en diseño gráfico. Puedo proporcionar mi portafolio y referencias de clientes anteriores.', NOW() - INTERVAL '12 hours', false),
(2, 5, 'No estoy spammeando. Solo tengo una publicación de la mesa de oficina. Puede ser un error del sistema.', NOW() - INTERVAL '1 hour', false);