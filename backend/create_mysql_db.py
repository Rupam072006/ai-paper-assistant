import pymysql
import re
from app.config import settings

def init_xampp_mysql_db():
    """Connect to XAMPP MySQL server and auto-create the target database if missing."""
    db_url = settings.DATABASE_URL
    # Match database name from URL e.g. mysql+pymysql://root:@localhost:3306/research_db?charset=utf8mb4
    match = re.search(r'3306/([a-zA-Z0-9_\-]+)', db_url)
    db_name = match.group(1) if match else "research_db"

    host = "localhost"
    port = 3306
    user = "root"
    password = ""

    try:
        conn = pymysql.connect(host=host, port=port, user=user, password=password)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        conn.close()
        print(f"[XAMPP MySQL] Database '{db_name}' verified / created successfully!")
    except Exception as e:
        print(f"[XAMPP MySQL Warning] Could not connect to MySQL at {host}:{port}: {e}")
        print("Ensure MySQL is started in XAMPP Control Panel.")

if __name__ == "__main__":
    init_xampp_mysql_db()
