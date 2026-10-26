from app.database import engine, SessionLocal, Base, get_db

# AsyncSession alias / compatibility bridge
AsyncSessionLocal = SessionLocal
