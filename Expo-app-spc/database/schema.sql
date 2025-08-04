
-- ===================================================
-- SCHEMA COMPLETO DATABASE FITNESS APP
-- Supporta 500+ utenti con ottimizzazioni performance
-- ===================================================

-- Tabella utenti (coaches e clienti)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('coach', 'client') NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('M', 'F', 'Other'),
    height_cm INTEGER,
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Tabella relazione coach-client
CREATE TABLE coach_client_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_relationship (coach_id, client_id, is_active),
    INDEX idx_coach (coach_id),
    INDEX idx_client (client_id),
    INDEX idx_active (is_active)
);

-- Tabella esercizi
CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    muscle_groups JSON NOT NULL,
    instructions TEXT,
    equipment VARCHAR(255),
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    created_by INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_public (is_public),
    INDEX idx_name (name),
    FULLTEXT idx_search (name, instructions)
);

-- Tabella workout templates
CREATE TABLE workout_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    is_public BOOLEAN DEFAULT FALSE,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_public (is_public),
    FULLTEXT idx_search (name, description)
);

-- Tabella workout assignments (workout assegnati ai clienti)
CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    coach_id INTEGER NOT NULL,
    template_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMP NULL,
    duration_minutes INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL,
    INDEX idx_client (client_id),
    INDEX idx_coach (coach_id),
    INDEX idx_date (scheduled_date),
    INDEX idx_completed (is_completed),
    INDEX idx_client_date (client_id, scheduled_date)
);

-- Tabella esercizi nei workout templates
CREATE TABLE workout_template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    order_in_workout INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER,
    weight_kg DECIMAL(5,2),
    rest_seconds INTEGER,
    duration_seconds INTEGER,
    distance_meters INTEGER,
    notes TEXT,
    
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    INDEX idx_template (template_id),
    INDEX idx_exercise (exercise_id),
    INDEX idx_order (template_id, order_in_workout)
);

-- Tabella esercizi nei workout assegnati
CREATE TABLE workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    order_in_workout INTEGER NOT NULL,
    sets INTEGER NOT NULL,
    reps INTEGER,
    weight_kg DECIMAL(5,2),
    rest_seconds INTEGER,
    duration_seconds INTEGER,
    distance_meters INTEGER,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    INDEX idx_workout (workout_id),
    INDEX idx_exercise (exercise_id),
    INDEX idx_order (workout_id, order_in_workout),
    INDEX idx_completed (is_completed)
);

-- Tabella sessioni di allenamento (tracking in tempo reale)
CREATE TABLE workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    duration_seconds INTEGER,
    calories_burned INTEGER,
    heart_rate_avg INTEGER,
    heart_rate_max INTEGER,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workout (workout_id),
    INDEX idx_client (client_id),
    INDEX idx_date (started_at),
    INDEX idx_completed (is_completed)
);

-- Tabella set completati durante le sessioni
CREATE TABLE workout_session_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    workout_exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    reps_completed INTEGER,
    weight_used DECIMAL(5,2),
    duration_seconds INTEGER,
    distance_meters INTEGER,
    rest_duration_seconds INTEGER,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_exercise (workout_exercise_id),
    INDEX idx_set (session_id, workout_exercise_id, set_number)
);

-- Tabella progressi del peso
CREATE TABLE weight_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    measurement_type ENUM('manual', 'scale', 'trainer') DEFAULT 'manual',
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_date (measured_at),
    INDEX idx_client_date (client_id, measured_at)
);

-- Tabella progressi foto
CREATE TABLE photo_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    photo_type ENUM('front', 'side', 'back', 'other') NOT NULL,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_date (taken_at),
    INDEX idx_type (photo_type),
    INDEX idx_client_date (client_id, taken_at)
);

-- Tabella piani nutrizionali
CREATE TABLE nutrition_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    coach_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    daily_calories INTEGER,
    daily_protein_g INTEGER,
    daily_carbs_g INTEGER,
    daily_fats_g INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_coach (coach_id),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
);

-- Tabella alimenti
CREATE TABLE foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    barcode VARCHAR(50),
    calories_per_100g INTEGER NOT NULL,
    protein_per_100g DECIMAL(5,2) NOT NULL,
    carbs_per_100g DECIMAL(5,2) NOT NULL,
    fats_per_100g DECIMAL(5,2) NOT NULL,
    fiber_per_100g DECIMAL(5,2),
    sugar_per_100g DECIMAL(5,2),
    sodium_per_100g DECIMAL(5,2),
    category VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_category (category),
    FULLTEXT idx_search (name, brand)
);

-- Tabella diario alimentare
CREATE TABLE nutrition_diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    quantity_grams DECIMAL(6,2) NOT NULL,
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_date (consumed_at),
    INDEX idx_meal (meal_type),
    INDEX idx_client_date (client_id, DATE(consumed_at))
);

-- Tabella messaggi
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    message_text TEXT NOT NULL,
    message_type ENUM('text', 'image', 'voice', 'video', 'workout', 'nutrition') DEFAULT 'text',
    attachment_url VARCHAR(500),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_conversation (sender_id, receiver_id),
    INDEX idx_date (sent_at),
    INDEX idx_unread (receiver_id, read_at)
);

-- Tabella notifiche
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('workout', 'message', 'progress', 'reminder', 'achievement') NOT NULL,
    related_id INTEGER, -- ID dell'oggetto correlato (workout, message, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_unread (user_id, is_read),
    INDEX idx_type (notification_type),
    INDEX idx_date (created_at)
);

-- Tabella obiettivi
CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    goal_type ENUM('weight_loss', 'weight_gain', 'muscle_gain', 'strength', 'endurance', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(8,2),
    current_value DECIMAL(8,2) DEFAULT 0,
    unit VARCHAR(20), -- kg, lbs, cm, minutes, etc.
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_type (goal_type),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, target_date)
);

-- Tabella achievements/badge
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(255),
    achievement_type ENUM('workout', 'consistency', 'weight', 'strength', 'milestone') NOT NULL,
    criteria JSON, -- Criteri per ottenere l'achievement
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella achievements ottenuti dagli utenti
CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user (user_id),
    INDEX idx_achievement (achievement_id)
);

-- ===================================================
-- VISTE PER PERFORMANCE QUERIES
-- ===================================================

-- Vista per dashboard clienti
CREATE VIEW client_dashboard AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT w.id) as total_workouts,
    COUNT(DISTINCT CASE WHEN w.is_completed = 1 THEN w.id END) as completed_workouts,
    COUNT(DISTINCT CASE WHEN DATE(w.scheduled_date) = CURDATE() THEN w.id END) as today_workouts,
    MAX(wp.measured_at) as last_weight_date,
    (SELECT weight_kg FROM weight_progress WHERE client_id = u.id ORDER BY measured_at DESC LIMIT 1) as current_weight,
    COUNT(DISTINCT g.id) as active_goals
FROM users u
LEFT JOIN workouts w ON u.id = w.client_id
LEFT JOIN weight_progress wp ON u.id = wp.client_id
LEFT JOIN goals g ON u.id = g.client_id AND g.is_active = 1
WHERE u.role = 'client' AND u.is_active = 1
GROUP BY u.id;

-- Vista per statistiche coach
CREATE VIEW coach_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT ccr.client_id) as total_clients,
    COUNT(DISTINCT CASE WHEN ccr.is_active = 1 THEN ccr.client_id END) as active_clients,
    COUNT(DISTINCT w.id) as total_workouts_assigned,
    COUNT(DISTINCT CASE WHEN w.is_completed = 1 THEN w.id END) as completed_workouts,
    AVG(w.rating) as avg_workout_rating
FROM users u
LEFT JOIN coach_client_relationships ccr ON u.id = ccr.coach_id
LEFT JOIN workouts w ON u.id = w.coach_id
WHERE u.role = 'coach' AND u.is_active = 1
GROUP BY u.id;

-- ===================================================
-- INDICI DI PERFORMANCE PER 500+ UTENTI
-- ===================================================

-- Indici compositi per query frequenti
CREATE INDEX idx_workout_client_date_completed ON workouts(client_id, scheduled_date, is_completed);
CREATE INDEX idx_message_conversation_date ON messages(sender_id, receiver_id, sent_at);
CREATE INDEX idx_nutrition_client_date ON nutrition_diary(client_id, DATE(consumed_at));
CREATE INDEX idx_weight_progress_client_date ON weight_progress(client_id, measured_at DESC);
CREATE INDEX idx_session_client_date ON workout_sessions(client_id, started_at DESC);

-- ===================================================
-- TRIGGER PER AUTOMAZIONE
-- ===================================================

-- Trigger per aggiornare updated_at
DELIMITER $$
CREATE TRIGGER update_users_timestamp 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_workouts_timestamp 
    BEFORE UPDATE ON workouts 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_workout_templates_timestamp 
    BEFORE UPDATE ON workout_templates 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_nutrition_plans_timestamp 
    BEFORE UPDATE ON nutrition_plans 
    FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ===================================================
-- STORED PROCEDURES PER OPERAZIONI COMUNI
-- ===================================================

DELIMITER $$

-- Procedura per ottenere dashboard completa client
CREATE PROCEDURE GetClientDashboard(IN p_client_id INT)
BEGIN
    -- Workout di oggi
    SELECT w.*, GROUP_CONCAT(e.name) as exercise_names
    FROM workouts w
    LEFT JOIN workout_exercises we ON w.id = we.workout_id
    LEFT JOIN exercises e ON we.exercise_id = e.id
    WHERE w.client_id = p_client_id 
    AND DATE(w.scheduled_date) = CURDATE()
    GROUP BY w.id;
    
    -- Ultimo peso
    SELECT * FROM weight_progress 
    WHERE client_id = p_client_id 
    ORDER BY measured_at DESC 
    LIMIT 1;
    
    -- Statistiche settimanali
    SELECT 
        COUNT(*) as workouts_this_week,
        COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_this_week,
        AVG(duration_minutes) as avg_duration
    FROM workouts 
    WHERE client_id = p_client_id 
    AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    
    -- Obiettivi attivi
    SELECT * FROM goals 
    WHERE client_id = p_client_id 
    AND is_active = 1 
    ORDER BY target_date ASC;
END$$

-- Procedura per statistiche coach
CREATE PROCEDURE GetCoachStats(IN p_coach_id INT)
BEGIN
    SELECT 
        COUNT(DISTINCT ccr.client_id) as total_clients,
        COUNT(DISTINCT CASE WHEN ccr.is_active = 1 THEN ccr.client_id END) as active_clients,
        COUNT(DISTINCT w.id) as workouts_assigned_this_month,
        COUNT(DISTINCT CASE WHEN w.is_completed = 1 THEN w.id END) as workouts_completed_this_month,
        AVG(w.rating) as avg_rating
    FROM coach_client_relationships ccr
    LEFT JOIN workouts w ON ccr.coach_id = w.coach_id 
        AND w.scheduled_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
    WHERE ccr.coach_id = p_coach_id;
END$$

DELIMITER ;
