
-- ===================================================
-- DATI DI ESEMPIO PER TESTARE 500+ UTENTI
-- ===================================================

-- Inserimento coach (10 coach per gestire 500 clienti)
INSERT INTO users (email, password, role, name, phone, gender, created_at) VALUES
('coach1@fitness.com', 'password123', 'coach', 'Marco Rossi', '+39123456701', 'M', NOW()),
('coach2@fitness.com', 'password123', 'coach', 'Laura Bianchi', '+39123456702', 'F', NOW()),
('coach3@fitness.com', 'password123', 'coach', 'Andrea Verdi', '+39123456703', 'M', NOW()),
('coach4@fitness.com', 'password123', 'coach', 'Giulia Neri', '+39123456704', 'F', NOW()),
('coach5@fitness.com', 'password123', 'coach', 'Luca Ferrari', '+39123456705', 'M', NOW()),
('coach6@fitness.com', 'password123', 'coach', 'Chiara Romano', '+39123456706', 'F', NOW()),
('coach7@fitness.com', 'password123', 'coach', 'Davide Ricci', '+39123456707', 'M', NOW()),
('coach8@fitness.com', 'password123', 'coach', 'Federica Marino', '+39123456708', 'F', NOW()),
('coach9@fitness.com', 'password123', 'coach', 'Matteo Bruno', '+39123456709', 'M', NOW()),
('coach10@fitness.com', 'password123', 'coach', 'Valentina Galli', '+39123456710', 'F', NOW());

-- Procedure per generare 500 clienti automaticamente
DELIMITER $$
CREATE PROCEDURE GenerateClients()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE coach_id INT;
    
    WHILE i <= 500 DO
        SET coach_id = ((i - 1) % 10) + 1; -- Assegna ai coach 1-10
        
        INSERT INTO users (
            email, 
            password, 
            role, 
            name, 
            phone, 
            gender, 
            height_cm,
            activity_level,
            created_at
        ) VALUES (
            CONCAT('client', i, '@fitness.com'),
            'password123',
            'client',
            CONCAT('Cliente ', i),
            CONCAT('+3912345', LPAD(i, 4, '0')),
            CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END,
            FLOOR(160 + RAND() * 30), -- Altezza tra 160-190cm
            CASE FLOOR(RAND() * 5)
                WHEN 0 THEN 'sedentary'
                WHEN 1 THEN 'light'
                WHEN 2 THEN 'moderate'
                WHEN 3 THEN 'active'
                ELSE 'very_active'
            END,
            DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY)
        );
        
        -- Crea relazione coach-client
        INSERT INTO coach_client_relationships (
            coach_id, 
            client_id, 
            start_date, 
            is_active
        ) VALUES (
            coach_id,
            i + 10, -- IDs clienti iniziano da 11
            DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 180) DAY),
            1
        );
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

-- Esegui la generazione
CALL GenerateClients();

-- Esercizi base (50 esercizi comuni)
INSERT INTO exercises (name, category, muscle_groups, instructions, equipment, difficulty_level) VALUES
('Push-up', 'Chest', '["chest", "triceps", "shoulders"]', 'Posizione plank, abbassa il corpo fino al suolo', 'Body Weight', 'beginner'),
('Squat', 'Legs', '["quadriceps", "glutes", "hamstrings"]', 'Piedi larghezza spalle, scendi come se ti sedessi', 'Body Weight', 'beginner'),
('Pull-up', 'Back', '["lats", "biceps", "rhomboids"]', 'Appendi alla sbarra, solleva il corpo', 'Pull-up Bar', 'intermediate'),
('Deadlift', 'Full Body', '["hamstrings", "glutes", "lower_back", "traps"]', 'Solleva il bilanciere da terra mantenendo la schiena dritta', 'Barbell', 'intermediate'),
('Bench Press', 'Chest', '["chest", "triceps", "shoulders"]', 'Sdraiato sulla panca, spingi il bilanciere verso l alto', 'Barbell', 'intermediate'),
('Plank', 'Core', '["abs", "core", "shoulders"]', 'Mantieni posizione push-up statica', 'Body Weight', 'beginner'),
('Lunges', 'Legs', '["quadriceps", "glutes", "hamstrings"]', 'Passo avanti, abbassa il ginocchio posteriore', 'Body Weight', 'beginner'),
('Dips', 'Arms', '["triceps", "chest", "shoulders"]', 'Alle parallele, abbassa e solleva il corpo', 'Parallel Bars', 'intermediate'),
('Mountain Climbers', 'Cardio', '["core", "shoulders", "legs"]', 'Posizione plank, alterna ginocchia al petto', 'Body Weight', 'beginner'),
('Burpees', 'Full Body', '["full_body"]', 'Squat, plank, push-up, salto', 'Body Weight', 'advanced');

-- Workout templates (20 template base)
INSERT INTO workout_templates (name, description, created_by, difficulty_level, estimated_duration) VALUES
('Beginner Full Body', 'Allenamento completo per principianti', 1, 'beginner', 45),
('Upper Body Strength', 'Allenamento parte superiore', 1, 'intermediate', 60),
('Lower Body Power', 'Allenamento gambe e glutei', 2, 'intermediate', 50),
('HIIT Cardio', 'Allenamento cardio ad alta intensità', 2, 'advanced', 30),
('Core & Abs', 'Allenamento addominali e core', 3, 'beginner', 25);

-- Procedure per generare workout per tutti i clienti
DELIMITER $$
CREATE PROCEDURE GenerateWorkouts()
BEGIN
    DECLARE i INT DEFAULT 11; -- Client IDs start from 11
    DECLARE j INT DEFAULT 0;
    DECLARE coach_id INT;
    DECLARE template_id INT;
    
    WHILE i <= 510 DO -- 500 clients (IDs 11-510)
        SET coach_id = ((i - 11) % 10) + 1;
        SET j = 0;
        
        -- Genera 10 workout per ogni cliente (ultimi 10 giorni)
        WHILE j < 10 DO
            SET template_id = (j % 5) + 1; -- Cicla tra i 5 template
            
            INSERT INTO workouts (
                client_id,
                coach_id,
                template_id,
                name,
                description,
                scheduled_date,
                is_completed,
                duration_minutes,
                rating
            ) VALUES (
                i,
                coach_id,
                template_id,
                CONCAT('Workout ', j + 1),
                'Allenamento personalizzato',
                DATE_SUB(CURDATE(), INTERVAL j DAY),
                CASE WHEN j < 7 THEN 1 ELSE 0 END, -- Primi 7 completati
                FLOOR(30 + RAND() * 60), -- Durata 30-90 min
                CASE WHEN j < 7 THEN FLOOR(3 + RAND() * 3) ELSE NULL END -- Rating 3-5
            );
            
            SET j = j + 1;
        END WHILE;
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL GenerateWorkouts();

-- Procedure per generare dati peso per tutti i clienti
DELIMITER $$
CREATE PROCEDURE GenerateWeightProgress()
BEGIN
    DECLARE i INT DEFAULT 11;
    DECLARE j INT DEFAULT 0;
    DECLARE base_weight DECIMAL(5,2);
    
    WHILE i <= 510 DO
        SET base_weight = 60 + RAND() * 40; -- Peso base 60-100kg
        SET j = 0;
        
        -- 10 misurazioni negli ultimi 30 giorni
        WHILE j < 10 DO
            INSERT INTO weight_progress (
                client_id,
                weight_kg,
                body_fat_percentage,
                measured_at,
                notes
            ) VALUES (
                i,
                base_weight + (RAND() - 0.5) * 5, -- Variazione ±2.5kg
                15 + RAND() * 15, -- Body fat 15-30%
                DATE_SUB(NOW(), INTERVAL (j * 3) DAY),
                CASE WHEN j = 0 THEN 'Misurazione più recente' ELSE '' END
            );
            
            SET j = j + 1;
        END WHILE;
        
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL GenerateWeightProgress();

-- Cleanup procedures
DROP PROCEDURE GenerateClients;
DROP PROCEDURE GenerateWorkouts;
DROP PROCEDURE GenerateWeightProgress;
