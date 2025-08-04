
-- ===================================================
-- INDICI AGGIUNTIVI PER PERFORMANCE OTTIMIZZATA
-- Specifici per gestire 500+ utenti simultanei
-- ===================================================

-- Indici per ricerche frequenti
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_exercises_category_public ON exercises(category, is_public);
CREATE INDEX idx_workouts_date_range ON workouts(scheduled_date, is_completed);

-- Indici per query di aggregazione
CREATE INDEX idx_weight_progress_monthly ON weight_progress(client_id, YEAR(measured_at), MONTH(measured_at));
CREATE INDEX idx_nutrition_daily ON nutrition_diary(client_id, DATE(consumed_at), meal_type);
CREATE INDEX idx_workout_sessions_duration ON workout_sessions(client_id, duration_seconds, is_completed);

-- Indici per messaggistica in tempo reale
CREATE INDEX idx_messages_unread_receiver ON messages(receiver_id, read_at, sent_at DESC);
CREATE INDEX idx_messages_conversation_recent ON messages(sender_id, receiver_id, sent_at DESC);

-- Indici per notifiche push
CREATE INDEX idx_notifications_unread_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_date ON notifications(notification_type, created_at DESC);

-- Indici per report e analytics
CREATE INDEX idx_workouts_coach_month ON workouts(coach_id, YEAR(scheduled_date), MONTH(scheduled_date));
CREATE INDEX idx_achievements_user_date ON user_achievements(user_id, earned_at DESC);
CREATE INDEX idx_goals_client_active ON goals(client_id, is_active, target_date);

-- Indici per cache e performance
CREATE INDEX idx_workout_exercises_order ON workout_exercises(workout_id, order_in_workout);
CREATE INDEX idx_session_sets_performance ON workout_session_sets(session_id, completed_at);
