# Logging Configuration Guide

This document describes the logging configuration for the SomethingX backend application.

## Overview

The application uses **Logback** for logging with the following features:
- Console logging for immediate output
- File logging with automatic rotation
- Separate error log files
- Environment-specific log levels
- Async appenders for better performance

## Configuration Files

- **logback-spring.xml**: Main logging configuration
- **application.properties**: Log path configuration

## Log Files

### Production/Docker Environment
- **application.log**: All application logs (INFO and above)
- **error.log**: Error-level logs only
- Logs are automatically rotated:
  - By size: 100MB per file (application.log), 50MB per file (error.log)
  - By time: Daily rotation
  - Retention: 30 days for application logs, 90 days for error logs
  - Total size cap: 3GB for application logs, 1GB for error logs

### Development Environment
- Same file structure as production
- More verbose logging (DEBUG level for application code)

## Log Levels

### Production/Docker Profile
- **Root level**: WARN
- **Application code** (`com.profiling`): INFO
- **Framework logs** (Spring, MongoDB, Apache): WARN

### Development Profile
- **Root level**: INFO
- **Application code** (`com.profiling`): DEBUG

## Log Format

All logs use the following format:
```
%d{yyyy-MM-dd'T'HH:mm:ss.SSSZ} [%thread] %-5level %logger{36} - %msg%n
```

Example:
```
2024-01-15T10:30:45.123+0000 [http-nio-9090-exec-1] INFO  c.p.controller.AuthController - Login successful for userId=123
```

## Configuration via Environment Variables

### LOG_PATH
Set the directory where log files will be stored.

**Default**: `./logs` (local) or `/app/logs` (Docker)

**Example**:
```bash
# Local development
LOG_PATH=./logs

# Docker/Production
LOG_PATH=/app/logs
```

### Spring Profile
Control log levels via Spring profile:

```bash
# Production
SPRING_PROFILES_ACTIVE=production

# Docker (default in docker-compose)
SPRING_PROFILES_ACTIVE=docker

# Development (default)
SPRING_PROFILES_ACTIVE=dev
```

## Docker Configuration

Logs are stored in a Docker volume (`backend_logs`) that persists across container restarts.

To access logs:
```bash
# View logs in real-time
docker-compose logs -f backend

# Access log files directly
docker-compose exec backend ls -lh /app/logs

# Copy logs to host
docker cp profiling-backend:/app/logs ./local-logs
```

## Log Rotation

Logs are automatically rotated based on:
1. **Size**: When a log file reaches the maximum size (100MB for application, 50MB for errors)
2. **Time**: Daily rotation at midnight
3. **Retention**: Old logs are automatically deleted after the retention period

### Rotation Examples

**application.log**:
- `application.log` (current)
- `application.2024-01-14.0.log.gz` (yesterday, first file)
- `application.2024-01-14.1.log.gz` (yesterday, second file if >100MB)
- `application.2024-01-13.0.log.gz` (day before)

**error.log**:
- `error.log` (current)
- `error.2024-01-14.0.log.gz` (yesterday)

## Performance Considerations

### Async Appenders
In production, file appenders use async mode for better performance:
- **Queue size**: 512 for application logs, 256 for error logs
- **Non-blocking**: Logging doesn't block request processing
- **Automatic discarding**: If queue is full, logs are discarded (only in extreme cases)

### Log Level Impact
- **WARN/ERROR**: Minimal performance impact
- **INFO**: Moderate impact, recommended for production
- **DEBUG**: High impact, use only in development

## Monitoring Logs

### View Recent Errors
```bash
# Docker
docker-compose exec backend tail -f /app/logs/error.log

# Local
tail -f logs/error.log
```

### Search Logs
```bash
# Find all errors in last 24 hours
grep -i error logs/application.log | tail -100

# Find specific user activity
grep "userId=123" logs/application.log

# Count errors
grep -c "ERROR" logs/error.log
```

### Log Analysis Tools
Consider using:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki + Grafana**
- **CloudWatch** (AWS)
- **Datadog** or **New Relic**

## Troubleshooting

### Logs Not Appearing
1. Check LOG_PATH is set correctly
2. Verify directory permissions
3. Check disk space
4. Review application startup logs

### Too Many Logs
1. Increase log level to WARN
2. Reduce retention period
3. Check for excessive DEBUG logging

### Logs Too Large
1. Reduce maxFileSize in logback-spring.xml
2. Reduce maxHistory (retention days)
3. Reduce totalSizeCap

### Missing Logs After Restart
- Logs are stored in Docker volume `backend_logs`
- Volume persists across restarts
- Check volume exists: `docker volume ls`

## Best Practices

1. **Never log sensitive information**:
   - Passwords
   - API keys
   - JWT tokens
   - Personal data (PII)

2. **Use appropriate log levels**:
   - ERROR: System errors, exceptions
   - WARN: Recoverable issues, deprecated usage
   - INFO: Important business events, user actions
   - DEBUG: Detailed debugging information

3. **Structured logging**:
   - Include context (userId, requestId, etc.)
   - Use consistent message format
   - Include relevant metadata

4. **Monitor log sizes**:
   - Set up alerts for disk space
   - Monitor log rotation
   - Review retention policies regularly

## Example Log Messages

### Good Logging
```java
log.info("User registered successfully userId={}, email={}", userId, email);
log.warn("Login failed for email={}: invalid password", email);
log.error("Database connection failed: {}", e.getMessage(), e);
```

### Bad Logging (Avoid)
```java
log.info("Password: " + password); // NEVER log passwords
log.debug("Full request: " + request); // May contain sensitive data
log.error("Error occurred"); // Too vague, no context
```

## Configuration Updates

The logging configuration supports hot-reloading:
- Configuration is scanned every 30 seconds
- Changes to logback-spring.xml are automatically detected
- No application restart required for most changes

However, for production, it's recommended to restart the application after configuration changes.
