from fastapi import FastAPI

from database import Base, engine
import auth
import users

# Creates tables if they don't exist. For real migrations as the schema evolves,
# swap this out for Alembic rather than relying on create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lenovo Support - Auth Service",
    description="Full CRUD authentication with admin, staff, and customer roles",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
