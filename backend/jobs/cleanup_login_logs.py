"""Cleanup job for login logs older than 24 hours."""
from datetime import datetime, timedelta


def cleanup_old_login_logs(db):
    """Delete login logs older than 24 hours."""
    try:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        result = db.login_logs.delete_many({'created_at': {'$lt': cutoff}})
        if result.deleted_count > 0:
            print(f'🧹 Cleaned up {result.deleted_count} old login logs')
    except Exception as e:
        print(f'⚠️ Login log cleanup error: {str(e)}')
