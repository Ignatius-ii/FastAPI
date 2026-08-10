from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import auth
import users
import tickets
# Creates tables if they don't exist. For real migrations as the schema evolves,
# swap this out for Alembic rather than relying on create_all.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lenovo Support - Auth Service",
    description="Full CRUD authentication with admin, staff, and customer roles",
    version="1.0.0",
)

app.add_middleware(
CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
