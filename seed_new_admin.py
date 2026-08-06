from database import SessionLocal
from models import User, UserRole
from auth_utils import hash_password

db = SessionLocal()

admin = User(
    email="admin2@gmail.com",
    password_hash=hash_password("Admin12345"),
    full_name="Second Admin",
    role=UserRole.admin,
    is_active=True,
    is_email_verified=True,
)

db.add(admin)
db.commit()
db.refresh(admin)

print("New admin created:")
print(admin.email)

db.close()
