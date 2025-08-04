
-- ===================================================
-- OTTIMIZZAZIONI DATABASE PER 500+ UTENTI SIMULTANEI
-- ===================================================

-- Configurazioni di performance per MySQL/MariaDB
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL innodb_log_file_size = 268435456; -- 256MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2; -- Performance boost
SET GLOBAL query_cache_size = 67108864; -- 64MB query cache
SET GLOBAL query_cache_type = 1;
SET GLOBAL max_connections = 1000; -- Supporta molte connessioni
SET GLOBAL thread_cache_size = 64;
SET GLOBAL table_open_cache = 4096;

-- Configurazioni per concorrenza
SET GLOBAL innodb_thread_concurrency = 0; -- Auto-detect
SET GLOBAL innodb_read_io_threads = 8;
SET GLOBAL innodb_write_io_threads = 8;

-- Partitioning per tabelle grandi (opzionale)
-- Partiziona workouts per mese per performance migliori
ALTER TABLE workouts PARTITION BY RANGE (YEAR(scheduled_date) * 100 + MONTH(scheduled_date)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    PARTITION p202403 VALUES LESS THAN (202404),
    PARTITION p202404 VALUES LESS THAN (202405),
    PARTITION p202405 VALUES LESS THAN (202406),
    PARTITION p202406 VALUES LESS THAN (202407),
    PARTITION p202407 VALUES LESS THAN (202408),
    PARTITION p202408 VALUES LESS THAN (202409),
    PARTITION p202409 VALUES LESS THAN (202410),
    PARTITION p202410 VALUES LESS THAN (202411),
    PARTITION p202411 VALUES LESS THAN (202412),
    PARTITION p202412 VALUES LESS THAN (202501),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Partiziona weight_progress per anno
ALTER TABLE weight_progress PARTITION BY RANGE (YEAR(measured_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- Query di monitoraggio performance
CREATE VIEW performance_monitor AS
SELECT 
    'Active Users' as metric,
    COUNT(*) as value
FROM users 
WHERE is_active = 1 AND last_login > DATE_SUB(NOW(), INTERVAL 24 HOUR)
UNION ALL
SELECT 
    'Daily Workouts',
    COUNT(*)
FROM workouts 
WHERE DATE(scheduled_date) = CURDATE()
UNION ALL
SELECT 
    'Active Sessions',
    COUNT(*)
FROM workout_sessions 
WHERE ended_at IS NULL
UNION ALL
SELECT 
    'Unread Messages',
    COUNT(*)
FROM messages 
WHERE read_at IS NULL;
