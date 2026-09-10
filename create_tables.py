from sqlalchemy import text

from database import engine, Base
from models import Student, User , Course , Lecture , Enrollment , LectureProgress , Notification

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
	connection.execute(text(
		"ALTER TABLE notifications "
		"ADD COLUMN IF NOT EXISTS recipient_user_id INTEGER"
	))
	connection.execute(text(
		"CREATE INDEX IF NOT EXISTS ix_notifications_recipient_user_id "
		"ON notifications (recipient_user_id)"
	))

print("Tables created successfully!")